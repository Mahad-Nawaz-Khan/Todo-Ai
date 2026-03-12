from fastapi import HTTPException, Request
from fastapi.security import HTTPBearer
import os
from typing import Dict, Any
from dotenv import load_dotenv
import httpx
import asyncio
import logging

load_dotenv(override=True)

logger = logging.getLogger(__name__)

# Using python-jose for JWT verification
from jose import JWTError, jwt
from jose.constants import ALGORITHMS
import time

# Define the security scheme
security = HTTPBearer()

class ClerkAuthMiddleware:
    def __init__(self):
        # Cache JWKS to avoid fetching on every request
        self.jwks_cache = {}
        self.cache_duration = 300  # 5 minutes

        self.jwks_url_override = os.getenv("CLERK_JWKS_URL")
        self.issuer_override = os.getenv("CLERK_ISSUER")
        self.audience_override = os.getenv("CLERK_JWT_AUDIENCE")

    def _get_token_claims(self, token: str) -> Dict[str, Any]:
        try:
            return jwt.get_unverified_claims(token)
        except Exception as e:
            logger.error(f"Failed to get token claims: {e}")
            raise HTTPException(status_code=401, detail="Invalid token")

    def _get_issuer(self, token_claims: Dict[str, Any]) -> str:
        issuer = self.issuer_override or token_claims.get("iss")
        if not issuer or not isinstance(issuer, str):
            logger.error(f"Missing or invalid issuer in token: {token_claims.get('iss')}")
            raise HTTPException(status_code=401, detail="Token issuer (iss) is missing")
        return issuer.rstrip("/")

    def _get_jwks_url(self, issuer: str) -> str:
        if self.jwks_url_override:
            return self.jwks_url_override
        return f"{issuer}/.well-known/jwks.json"

    def _get_audience(self, token_claims: Dict[str, Any]):
        # Only validate audience if you explicitly configured it.
        return self.audience_override

    async def get_jwks_for_token(self, token: str) -> Dict:
        """Get JWKS for a specific token (issuer-aware) with caching."""
        token_claims = self._get_token_claims(token)
        issuer = self._get_issuer(token_claims)
        jwks_url = self._get_jwks_url(issuer)

        # Check cache first
        cache_key = jwks_url
        current_time = time.time()
        if cache_key in self.jwks_cache:
            cached_data = self.jwks_cache[cache_key]
            if current_time - cached_data["time"] <= self.cache_duration:
                return cached_data["jwks"]

        # Fetch JWKS from Clerk
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(jwks_url)
                response.raise_for_status()
        except httpx.HTTPStatusError as e:
            logger.error(f"Failed to fetch JWKS from {jwks_url}: {e.response.status_code}")
            raise HTTPException(
                status_code=500,
                detail=f"Could not fetch JWKS from Clerk (status {e.response.status_code})"
            )
        except Exception as e:
            logger.error(f"Failed to fetch JWKS: {e}")
            raise HTTPException(status_code=500, detail="Could not fetch JWKS from Clerk")

        jwks_data = response.json()

        # Cache the result
        self.jwks_cache[cache_key] = {
            "jwks": jwks_data,
            "time": current_time
        }

        return jwks_data

    async def verify_token(self, request: Request) -> Dict[str, Any]:
        """
        Verify the Clerk JWT token from the request using JWKS
        """
        # Get the authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            logger.warning("Missing or invalid authorization header")
            raise HTTPException(
                status_code=401,
                detail="Invalid or missing authorization header"
            )

        # Extract the token
        token = auth_header.split(" ")[1]

        try:
            token_claims = self._get_token_claims(token)
            issuer = self._get_issuer(token_claims)
            audience = self._get_audience(token_claims)

            # Decode header to get kid (key ID)
            header = jwt.get_unverified_header(token)
            kid = header.get("kid")
            if not kid:
                logger.error("Token header missing kid")
                raise HTTPException(
                    status_code=401,
                    detail="Token header missing kid"
                )

            # Get JWKS
            jwks = await self.get_jwks_for_token(token)

            # Find the key with matching kid
            key = None
            for jwk in jwks.get("keys", []):
                if jwk.get("kid") == kid:
                    key = jwk
                    break

            if not key:
                logger.error(f"Token signing key not found for kid: {kid}")
                raise HTTPException(
                    status_code=401,
                    detail="Token signing key not found"
                )

            # Decode and verify the token
            decode_kwargs = {
                "algorithms": [ALGORITHMS.RS256],
                "issuer": issuer,
            }
            if audience is not None:
                decode_kwargs["audience"] = audience

            payload = jwt.decode(token, key, **decode_kwargs)

            logger.info(f"Successfully verified token for user: {payload.get('sub')}")
            return payload

        except JWTError as e:
            logger.error(f"JWT verification failed: {e}")
            raise HTTPException(
                status_code=401,
                detail=f"Token verification failed: {str(e)}"
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Token verification error: {e}")
            raise HTTPException(
                status_code=401,
                detail=f"Token verification failed: {str(e)}"
            )


# Create an instance of the middleware
auth_middleware = ClerkAuthMiddleware()


# Dependency to get the current user from the token
async def get_current_user(request: Request) -> Dict[str, Any]:
    return await auth_middleware.verify_token(request)
