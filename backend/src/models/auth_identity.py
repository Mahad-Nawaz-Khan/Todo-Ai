from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Index
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .user import User


class AuthIdentityBase(SQLModel):
    provider: str = Field(nullable=False, index=True)
    provider_subject: str = Field(nullable=False, index=True)
    email: Optional[str] = Field(default=None, index=True)
    email_verified: bool = Field(default=False, nullable=False)
    first_name: Optional[str] = Field(default=None, nullable=True)
    last_name: Optional[str] = Field(default=None, nullable=True)


class AuthIdentity(AuthIdentityBase, table=True):
    __table_args__ = (
        Index("idx_auth_identity_provider_subject", "provider", "provider_subject", unique=True),
        Index("idx_auth_identity_email", "email"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", nullable=False, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow, index=True)

    user: "User" = Relationship(back_populates="auth_identities")
