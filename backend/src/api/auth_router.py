from typing import Any, Dict, Optional
import logging
import os
import hashlib

from fastapi import APIRouter, Depends, File, HTTPException, Request, Response, UploadFile
from pwdlib.hashers.bcrypt import BcryptHasher

pwd_context = BcryptHasher()
from pydantic import BaseModel, field_validator
from ..rate_limit import limiter
from sqlmodel import Session, select

from ..database import get_session
from ..middleware.auth import get_current_user
from ..models.credential import Credential
from ..models.user import User
from ..services.auth_service import auth_service

logger = logging.getLogger(__name__)

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
        "openrouter_api_key_set": bool(os.getenv("OPENROUTER_API_KEY")),
        "openrouter_model": os.getenv("OPENROUTER_MODEL", "NOT SET"),
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
        profile_image_url=stored_profile_image_url,
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


# ---------------------------------------------------------------------------
# Email / password authentication
# ---------------------------------------------------------------------------

MIN_PASSWORD_LENGTH = 8


class EmailSignUpRequest(BaseModel):
    email: str
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("Invalid email address")
        return v


class EmailLoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        return v.strip().lower()


def generate_avatar_svg(initial: str, email: str) -> bytes:
    """Generate a Google-style avatar SVG with the user's initial."""
    # Google-style colors
    colors = [
        "#E53935", "#D81B60", "#8E24AA", "#5E35B1", "#3949AB",
        "#1E88E5", "#039BE5", "#00ACC1", "#00897B", "#43A047",
        "#7CB342", "#C0CA33", "#FDD835", "#FFB300", "#FB8C00",
        "#F4511E", "#6D4C41", "#757575", "#546E7A", "#263238"
    ]
    # Consistent color based on email hash
    hash_val = int(hashlib.md5(email.lower().encode()).hexdigest(), 16)
    bg_color = colors[hash_val % len(colors)]
    text_color = "#FFFFFF"
    
    svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <rect width="120" height="120" fill="{bg_color}" rx="60" ry="60"/>
  <text x="60" y="60" dy="0.35em" text-anchor="middle" font-family="Arial, sans-serif" font-size="55" font-weight="500" fill="{text_color}">{initial}</text>
</svg>'''
    return svg.encode('utf-8')


@router.post("/auth/email/register")
@limiter.limit("5/minute")
async def email_register(
    request: Request,
    body: EmailSignUpRequest,
    db_session: Session = Depends(get_session),
):
    if len(body.password) < MIN_PASSWORD_LENGTH:
        raise HTTPException(status_code=400, detail=f"Password must be at least {MIN_PASSWORD_LENGTH} characters")

    email_lower = body.email.strip().lower()

    # Check if credential already exists for this email
    existing_cred = db_session.exec(select(Credential).where(Credential.email == email_lower)).first()
    if existing_cred:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    from ..models.auth_identity import AuthIdentity

    # Existing identity by email: block only if it belongs to OAuth or another provider.
    existing_identity = db_session.exec(select(AuthIdentity).where(AuthIdentity.email == email_lower)).first()
    if existing_identity and existing_identity.provider != "email":
        raise HTTPException(status_code=409, detail="An account with this email already exists. Try signing in with Google or GitHub.")

    # Reuse partially-created user rows if a previous attempt failed mid-signup.
    external_user_id = f"email:{email_lower}"
    user = db_session.exec(select(User).where(User.clerk_user_id == external_user_id)).first()
    if not user:
        user = User(clerk_user_id=external_user_id)
        db_session.add(user)
        db_session.flush()

    # Generate Google-style avatar for email users
    if not user.profile_image_data:
        initial = (body.first_name[0] if body.first_name else email_lower[0]).upper()
        avatar_svg = generate_avatar_svg(initial, email_lower)
        user.profile_image_data = avatar_svg
        user.profile_image_content_type = "image/svg+xml"
        user.profile_image_url = f"/api/v1/auth/profile-image/{user.id}"

    # Create Credential (bcrypt limits to 72 bytes)
    # Truncate by encoding to bytes first, then decoding back
    password_bytes = body.password.encode("utf-8")[:72]
    password_truncated = password_bytes.decode("utf-8", errors="ignore")
    hashed = pwd_context.hash(password_truncated)
    cred = Credential(
        user_id=user.id,
        email=email_lower,
        hashed_password=hashed,
    )
    db_session.add(cred)

    # Create AuthIdentity (so the existing auth pipeline works)
    if existing_identity:
        existing_identity.user_id = user.id
        existing_identity.provider = "email"
        existing_identity.provider_subject = email_lower
        existing_identity.email = email_lower
        existing_identity.email_verified = False
        existing_identity.first_name = body.first_name
        existing_identity.last_name = body.last_name
        db_session.add(existing_identity)
    else:
        identity = AuthIdentity(
            user_id=user.id,
            provider="email",
            provider_subject=email_lower,
            email=email_lower,
            email_verified=False,
            first_name=body.first_name,
            last_name=body.last_name,
        )
        db_session.add(identity)
    db_session.commit()

    logger.info(f"New email user registered: {email_lower}")

    return {
        "id": user.id,
        "email": email_lower,
        "provider": "email",
        "first_name": body.first_name or "",
        "last_name": body.last_name or "",
    }


@router.post("/auth/email/login")
@limiter.limit("10/minute")
async def email_login(
    request: Request,
    body: EmailLoginRequest,
    db_session: Session = Depends(get_session),
):
    email_lower = body.email.strip().lower()

    # Truncate password to 72 bytes (bcrypt limit) - same as registration
    password_bytes = body.password.encode("utf-8")[:72]
    password_truncated = password_bytes.decode("utf-8", errors="ignore")

    cred = db_session.exec(select(Credential).where(Credential.email == email_lower)).first()
    if not cred or not pwd_context.verify(password_truncated, cred.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user = db_session.get(User, cred.user_id)
    if not user:
        raise HTTPException(status_code=500, detail="User record not found")

    # Update the identity if needed
    from ..models.auth_identity import AuthIdentity

    identity = db_session.exec(
        select(AuthIdentity).where(
            AuthIdentity.provider == "email",
            AuthIdentity.provider_subject == email_lower,
        )
    ).first()

    first_name = identity.first_name if identity else ""
    last_name = identity.last_name if identity else ""

    logger.info(f"Email user logged in: {email_lower}")

    return {
        "id": user.id,
        "email": email_lower,
        "provider": "email",
        "first_name": first_name or "",
        "last_name": last_name or "",
    }
