from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlmodel import Session
from typing import Dict, Any, Optional
import os

from pydantic import BaseModel

from ..database import get_session
from ..middleware.auth import get_current_user
from ..services.auth_service import auth_service

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/api/v1", tags=["auth"])


@router.get("/auth/debug")
async def auth_debug(request: Request):
    from ..services.agent_service import agent_service

    return {
        "clerk_issuer": os.getenv("CLERK_ISSUER", "NOT SET"),
        "clerk_jwks_url": os.getenv("CLERK_JWKS_URL", "NOT SET"),
        "clerk_audience": os.getenv("CLERK_JWT_AUDIENCE", "NOT SET (optional)"),
        "app_jwt_issuer": os.getenv("APP_JWT_ISSUER", "todo-ai-auth"),
        "app_jwt_audience": os.getenv("APP_JWT_AUDIENCE", "NOT SET (optional)"),
        "app_jwt_secret_set": bool(os.getenv("APP_JWT_SECRET")),
        "auth_header_present": request.headers.get("Authorization") is not None,
        "auth_header_format": "Bearer <token>" if request.headers.get("Authorization", "").startswith("Bearer ") else "Invalid format",
        "agent_service_available": agent_service.is_available(),
        "gemini_api_key_set": bool(os.getenv("GEMINI_API_KEY")),
        "gemini_model": os.getenv("GEMINI_MODEL", "NOT SET"),
    }


class UserResponse(BaseModel):
    id: int
    auth_subject: str
    provider: str
    email: Optional[str] = None
    first_name: str = ""
    last_name: str = ""


@router.get("/auth/me", response_model=UserResponse)
@limiter.limit("50/minute")
def get_current_user_info(
    request: Request,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db_session: Session = Depends(get_session)
):
    user = auth_service.get_user_by_auth_payload(current_user, db_session)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    claims = auth_service.normalize_claims(current_user)
    identity = auth_service.get_identity_by_auth_payload(current_user, db_session)

    return UserResponse(
        id=user.id,
        auth_subject=claims["sub"],
        provider=claims["provider"],
        email=(identity.email if identity else None) or claims.get("email"),
        first_name=(identity.first_name if identity and identity.first_name else claims.get("first_name")) or "",
        last_name=(identity.last_name if identity and identity.last_name else claims.get("last_name")) or "",
    )
