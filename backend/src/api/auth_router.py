from typing import Any, Dict, Optional
import os

from fastapi import APIRouter, Depends, File, HTTPException, Request, Response, UploadFile
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlmodel import Session

from ..database import get_session
from ..middleware.auth import get_current_user
from ..services.auth_service import auth_service

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/api/v1", tags=["auth"])

MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


@router.get("/auth/debug")
async def auth_debug(request: Request):
    from ..services.agent_service import agent_service

    return {
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
    name: Optional[str] = None
    profile_image_url: Optional[str] = None


class ProfileImageResponse(BaseModel):
    profile_image_url: str


def _get_public_request_origin(request: Request) -> str:
    forwarded_proto = request.headers.get("x-forwarded-proto")
    forwarded_host = request.headers.get("x-forwarded-host") or request.headers.get("host")

    if forwarded_proto and forwarded_host:
        return f"{forwarded_proto}://{forwarded_host}".rstrip("/")

    return str(request.base_url).rstrip("/")


def _build_profile_image_url(request: Request, user_id: int) -> str:
    return f"{_get_public_request_origin(request)}/api/v1/auth/profile-image/{user_id}"


@router.get("/auth/me", response_model=UserResponse)
@limiter.limit("50/minute")
async def get_current_user_info(
    request: Request,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db_session: Session = Depends(get_session),
):
    user = await auth_service.get_or_create_user_from_auth_payload(current_user, db_session)
    claims = auth_service.normalize_claims(current_user)
    identity = auth_service.get_identity_by_auth_payload(current_user, db_session)

    first_name = (identity.first_name if identity and identity.first_name else claims.get("first_name")) or ""
    last_name = (identity.last_name if identity and identity.last_name else claims.get("last_name")) or ""
    fallback_name = " ".join(part for part in [first_name, last_name] if part).strip() or None
    name = claims.get("name") or fallback_name

    stored_profile_image_url = _build_profile_image_url(request, user.id) if getattr(user, "profile_image_data", None) else None

    return UserResponse(
        id=user.id,
        auth_subject=claims["sub"],
        provider=claims["provider"],
        email=(identity.email if identity else None) or claims.get("email"),
        first_name=first_name,
        last_name=last_name,
        name=name,
        profile_image_url=stored_profile_image_url or claims.get("image_url"),
    )


@router.get("/auth/profile-image/{user_id}")
@limiter.limit("60/minute")
def get_profile_image(
    user_id: int,
    request: Request,
    db_session: Session = Depends(get_session),
):
    user = auth_service.get_user_by_id(user_id, db_session)
    if not user or not user.profile_image_data or not user.profile_image_content_type:
        raise HTTPException(status_code=404, detail="Profile image not found")

    return Response(
        content=user.profile_image_data,
        media_type=user.profile_image_content_type,
        headers={"Cache-Control": "public, max-age=3600"},
    )


@router.post("/auth/profile-image", response_model=ProfileImageResponse)
@limiter.limit("10/minute")
async def upload_profile_image(
    request: Request,
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db_session: Session = Depends(get_session),
):
    if not file.content_type or file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Please upload a JPG, PNG, WEBP, or GIF image")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    if len(contents) > MAX_PROFILE_IMAGE_BYTES:
        raise HTTPException(status_code=400, detail="Profile image must be 5 MB or smaller")

    user = await auth_service.get_or_create_user_from_auth_payload(current_user, db_session)
    user.profile_image_data = contents
    user.profile_image_content_type = file.content_type
    user.profile_image_url = f"/api/v1/auth/profile-image/{user.id}"

    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    return ProfileImageResponse(
        profile_image_url=_build_profile_image_url(request, user.id)
    )
