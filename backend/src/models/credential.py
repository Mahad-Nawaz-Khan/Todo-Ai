from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .user import User


class CredentialBase(SQLModel):
    email: str = Field(nullable=False, unique=True, index=True)
    hashed_password: str = Field(nullable=False)


class Credential(CredentialBase, table=True):
    __tablename__ = "credential"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", nullable=False, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    user: "User" = Relationship(back_populates="credential")
