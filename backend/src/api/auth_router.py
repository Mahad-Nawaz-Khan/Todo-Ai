from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlmodel import Session
from typing import Dict, Any
from ..middleware.auth import get_current_user, auth_middleware
from ..database import get_session
from ..services.auth_service import auth_service
from pydantic import BaseModel
import os

# Initialize rate limiter for this router
limiter = Limiter(key_func=get_remote_address)


router = APIRouter(prefix="/api/v1", tags=["auth"])


@router.get("/auth/debug")
async def auth_debug(request: Request):
    """
    Debug endpoint to check JWT and Agent configuration.
    """
    # Import agent service to check its status
    from ..services.agent_service import agent_service

    return {
        "clerk_issuer": os.getenv("CLERK_ISSUER", "NOT SET"),
        "clerk_jwks_url": os.getenv("CLERK_JWKS_URL", "NOT SET"),
        "clerk_audience": os.getenv("CLERK_JWT_AUDIENCE", "NOT SET (optional)"),
        "auth_header_present": request.headers.get("Authorization") is not None,
        "auth_header_format": "Bearer <token>" if request.headers.get("Authorization", "").startswith("Bearer ") else "Invalid format",
        "agent_service_available": agent_service.is_available(),
        "gemini_api_key_set": bool(os.getenv("GEMINI_API_KEY")),
        "gemini_model": os.getenv("GEMINI_MODEL", "NOT SET")
    }


class UserResponse(BaseModel):
    id: int
    clerk_user_id: str
    email: str
    first_name: str
    last_name: str


@router.get("/auth/me", response_model=UserResponse)
@limiter.limit("50/minute")  # 50 requests per minute for authenticated users
def get_current_user_info(
    request: Request,  # Required for rate limiting
    current_user: Dict[str, Any] = Depends(get_current_user),
    db_session: Session = Depends(get_session)
):
    """
    Get information about the currently authenticated user
    """
    clerk_user_id = auth_service.get_current_user_id(current_user)
    
    # Get user by Clerk user ID to get the integer user_id
    user = auth_service.get_user_by_clerk_id(clerk_user_id, db_session)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return UserResponse(
        id=user.id,
        clerk_user_id=user.clerk_user_id,
        email=user.email,
        first_name=user.first_name or "",
        last_name=user.last_name or ""
    )