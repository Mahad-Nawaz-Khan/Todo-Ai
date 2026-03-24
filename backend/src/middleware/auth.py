import logging
import os
from typing import Dict, Any

from dotenv import load_dotenv
from fastapi import HTTPException, Request
from fastapi.security import HTTPBearer
from jose import JWTError, jwt
from jose.constants import ALGORITHMS

load_dotenv(override=True)

logger = logging.getLogger(__name__)
security = HTTPBearer()


class AuthMiddleware:
    def __init__(self):
        self.app_jwt_secret = os.getenv("APP_JWT_SECRET")
        self.app_jwt_issuer = os.getenv("APP_JWT_ISSUER", "todo-ai-auth")
        self.app_jwt_audience = os.getenv("APP_JWT_AUDIENCE")

    def _get_unverified_claims(self, token: str) -> Dict[str, Any]:
        try:
            return jwt.get_unverified_claims(token)
        except Exception as e:
            logger.error(f"Failed to get token claims: {e}")
            raise HTTPException(status_code=401, detail="Invalid token")

    def _get_auth_header_token(self, request: Request) -> str:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            logger.warning("Missing or invalid authorization header")
            raise HTTPException(status_code=401, detail="Invalid or missing authorization header")

        return auth_header.split(" ", 1)[1]

    def _is_app_token(self, token_claims: Dict[str, Any]) -> bool:
        issuer = token_claims.get("iss")
        return bool(self.app_jwt_secret and issuer == self.app_jwt_issuer)

    def _decode_app_token(self, token: str) -> Dict[str, Any]:
        if not self.app_jwt_secret:
            raise HTTPException(status_code=500, detail="APP_JWT_SECRET is not configured")

        decode_kwargs: Dict[str, Any] = {
            "algorithms": [ALGORITHMS.HS256],
            "issuer": self.app_jwt_issuer,
        }
        if self.app_jwt_audience:
            decode_kwargs["audience"] = self.app_jwt_audience

        payload = jwt.decode(token, self.app_jwt_secret, **decode_kwargs)
        payload["provider"] = payload.get("provider") or "app"
        return payload

    async def verify_token(self, request: Request) -> Dict[str, Any]:
        token = self._get_auth_header_token(request)

        try:
            token_claims = self._get_unverified_claims(token)
            if not self._is_app_token(token_claims):
                raise HTTPException(status_code=401, detail="Only app-issued JWTs are accepted")

            payload = self._decode_app_token(token)
            logger.info(f"Successfully verified token for user: {payload.get('sub')}")
            return payload
        except JWTError as e:
            logger.error(f"JWT verification failed: {e}")
            raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Token verification error: {e}")
            raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")


auth_middleware = AuthMiddleware()


async def get_current_user(request: Request) -> Dict[str, Any]:
    return await auth_middleware.verify_token(request)
