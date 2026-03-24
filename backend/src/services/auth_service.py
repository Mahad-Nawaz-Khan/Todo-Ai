import logging
from typing import Optional, Dict, Any

from fastapi import HTTPException
from sqlmodel import Session, select

from ..models.auth_identity import AuthIdentity
from ..models.user import User

security_logger = logging.getLogger("security")
security_logger.setLevel(logging.INFO)
if not security_logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    security_logger.addHandler(handler)
    security_logger.propagate = False


class AuthService:
    def __init__(self):
        pass

    def normalize_claims(self, auth_payload: Dict[str, Any]) -> Dict[str, Any]:
        subject = auth_payload.get("sub")
        if not subject:
            security_logger.warning("Invalid auth payload: missing user ID")
            raise HTTPException(status_code=400, detail="Invalid auth payload: missing user ID")

        provider = auth_payload.get("provider") or auth_payload.get("iss") or "app"
        email = auth_payload.get("email")
        email_verified = bool(
            auth_payload.get("email_verified")
            or auth_payload.get("verified_email")
            or auth_payload.get("emailVerified")
        )
        first_name = auth_payload.get("given_name") or auth_payload.get("first_name")
        last_name = auth_payload.get("family_name") or auth_payload.get("last_name")
        name = auth_payload.get("name")

        return {
            "sub": subject,
            "provider": str(provider),
            "email": email.strip().lower() if isinstance(email, str) else None,
            "email_verified": email_verified,
            "first_name": first_name,
            "last_name": last_name,
            "name": name,
        }

    def _get_identity_by_subject(self, provider: str, subject: str, db_session: Session) -> Optional[AuthIdentity]:
        statement = select(AuthIdentity).where(
            AuthIdentity.provider == provider,
            AuthIdentity.provider_subject == subject,
        )
        return db_session.exec(statement).first()

    def _get_identity_by_email(self, email: str, db_session: Session) -> Optional[AuthIdentity]:
        statement = select(AuthIdentity).where(AuthIdentity.email == email)
        return db_session.exec(statement).first()

    def _update_identity_profile(self, identity: AuthIdentity, claims: Dict[str, Any], db_session: Session) -> AuthIdentity:
        changed = False

        if claims.get("email") and identity.email != claims["email"]:
            identity.email = claims["email"]
            changed = True

        if identity.email_verified != claims.get("email_verified", False):
            identity.email_verified = claims.get("email_verified", False)
            changed = True

        if claims.get("first_name") and identity.first_name != claims["first_name"]:
            identity.first_name = claims["first_name"]
            changed = True

        if claims.get("last_name") and identity.last_name != claims["last_name"]:
            identity.last_name = claims["last_name"]
            changed = True

        if changed:
            db_session.add(identity)
            db_session.commit()
            db_session.refresh(identity)

        return identity

    def _link_identity(self, user: User, claims: Dict[str, Any], db_session: Session) -> AuthIdentity:
        existing = self._get_identity_by_subject(claims["provider"], claims["sub"], db_session)
        if existing:
            return self._update_identity_profile(existing, claims, db_session)

        identity = AuthIdentity(
            user_id=user.id,
            provider=claims["provider"],
            provider_subject=claims["sub"],
            email=claims.get("email"),
            email_verified=claims.get("email_verified", False),
            first_name=claims.get("first_name"),
            last_name=claims.get("last_name"),
        )
        db_session.add(identity)
        db_session.commit()
        db_session.refresh(identity)
        return identity

    async def get_or_create_user_from_auth_payload(
        self,
        auth_payload: Dict[str, Any],
        db_session: Session,
    ) -> User:
        claims = self.normalize_claims(auth_payload)

        identity = self._get_identity_by_subject(claims["provider"], claims["sub"], db_session)
        if identity:
            user = self.get_user_by_id(identity.user_id, db_session)
            if not user:
                security_logger.error(f"Identity {identity.id} points to missing user {identity.user_id}")
                raise HTTPException(status_code=500, detail="Invalid identity mapping")

            self._update_identity_profile(identity, claims, db_session)
            security_logger.info(f"User authenticated: {claims['provider']}:{claims['sub']}")
            return user

        email = claims.get("email")
        if email and claims.get("email_verified"):
            matching_identity = self._get_identity_by_email(email, db_session)
            if matching_identity:
                user = self.get_user_by_id(matching_identity.user_id, db_session)
                if not user:
                    raise HTTPException(status_code=500, detail="Invalid identity mapping")
                self._link_identity(user, claims, db_session)
                security_logger.info(f"Linked auth identity for existing user: {claims['provider']}:{claims['sub']}")
                return user

        external_user_id = f'{claims["provider"]}:{claims["sub"]}'
        user = User(
            clerk_user_id=external_user_id,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        self._link_identity(user, claims, db_session)
        security_logger.info(f"New user created: {claims['provider']}:{claims['sub']}")
        return user

    def get_current_user_id(self, auth_payload: Dict[str, Any]) -> str:
        claims = self.normalize_claims(auth_payload)
        return claims["sub"]

    def get_user_by_id(self, user_id: int, db_session: Session) -> Optional[User]:
        try:
            statement = select(User).where(User.id == user_id)
            user = db_session.exec(statement).first()

            if user:
                security_logger.info(f"User data accessed: {user.id}")
            else:
                security_logger.warning(f"Attempt to access non-existent user ID: {user_id}")

            return user
        except Exception as e:
            security_logger.error(f"Error accessing user data for ID {user_id}: {str(e)}")
            raise

    def get_user_by_auth_payload(self, auth_payload: Dict[str, Any], db_session: Session) -> Optional[User]:
        claims = self.normalize_claims(auth_payload)
        identity = self._get_identity_by_subject(claims["provider"], claims["sub"], db_session)
        if identity:
            return self.get_user_by_id(identity.user_id, db_session)

        email = claims.get("email")
        if email and claims.get("email_verified"):
            identity = self._get_identity_by_email(email, db_session)
            if identity:
                return self.get_user_by_id(identity.user_id, db_session)

        return None

    def get_identity_by_auth_payload(self, auth_payload: Dict[str, Any], db_session: Session) -> Optional[AuthIdentity]:
        claims = self.normalize_claims(auth_payload)
        identity = self._get_identity_by_subject(claims["provider"], claims["sub"], db_session)
        if identity:
            return identity

        email = claims.get("email")
        if email and claims.get("email_verified"):
            return self._get_identity_by_email(email, db_session)

        return None


# Create a singleton instance
auth_service = AuthService()
