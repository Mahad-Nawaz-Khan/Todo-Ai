from pathlib import Path
from typing import Any, Dict, Optional
from urllib.parse import urlsplit
from uuid import uuid4
import os

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlmodel import Session

from ..database import get_session
from ..middleware.auth import get_current_user
from ..services.auth_service import auth_service

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/api/v1", tags=["auth"])

MEDIA_ROOT = Path(__file__).resolve().parents[1] / "media"
PROFILE_IMAGES_DIR = MEDIA_ROOT / "profile-images"
PROFILE_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
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


def _build_absolute_media_url(request: Request, stored_path: Optional[str]) -> Optional[str]:
    if not stored_path:
        return None
    if stored_path.startswith("http://") or stored_path.startswith("https://"):
        return stored_path
    return f"{_get_public_request_origin(request)}{stored_path}"


def _get_profile_image_file_path(stored_path: Optional[str]) -> Optional[Path]:
    if not stored_path:
        return None

    path = urlsplit(stored_path).path
    prefix = "/media/profile-images/"
    if not path.startswith(prefix):
        return None

    return PROFILE_IMAGES_DIR / Path(path).name


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

    return UserResponse(
        id=user.id,
        auth_subject=claims["sub"],
        provider=claims["provider"],
        email=(identity.email if identity else None) or claims.get("email"),
        first_name=first_name,
        last_name=last_name,
        name=name,
        profile_image_url=_build_absolute_media_url(request, getattr(user, "profile_image_url", None)) or claims.get("image_url"),
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
    previous_file_path = _get_profile_image_file_path(user.profile_image_url)

    extension = ALLOWED_IMAGE_TYPES[file.content_type]
    filename = f"user-{user.id}-{uuid4().hex}{extension}"
    destination = PROFILE_IMAGES_DIR / filename
    destination.write_bytes(contents)

    user.profile_image_url = f"/media/profile-images/{filename}"

    try:
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
    except Exception:
        if destination.exists():
            destination.unlink()
        raise

    if previous_file_path and previous_file_path.exists() and previous_file_path != destination:
        previous_file_path.unlink()

    return ProfileImageResponse(
        profile_image_url=_build_absolute_media_url(request, user.profile_image_url) or ""
    )
