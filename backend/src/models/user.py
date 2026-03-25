from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional, TYPE_CHECKING, List
from sqlalchemy import Index

if TYPE_CHECKING:
    from .auth_identity import AuthIdentity
    from .task import Task
    from .tag import Tag


class UserBase(SQLModel):
    clerk_user_id: Optional[str] = Field(default=None, unique=True, nullable=True)
    profile_image_url: Optional[str] = Field(default=None, nullable=True)
    profile_image_data: Optional[bytes] = Field(default=None, nullable=True)
    profile_image_content_type: Optional[str] = Field(default=None, nullable=True)


class User(UserBase, table=True):
    __table_args__ = (
        Index("idx_user_clerk_id", "clerk_user_id"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    clerk_user_id: Optional[str] = Field(default=None, unique=True, nullable=True, index=True)
    profile_image_url: Optional[str] = Field(default=None, nullable=True)
    profile_image_data: Optional[bytes] = Field(default=None, nullable=True)
    profile_image_content_type: Optional[str] = Field(default=None, nullable=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

    tasks: List["Task"] = Relationship(back_populates="user")
    tags: List["Tag"] = Relationship(back_populates="user")
    auth_identities: List["AuthIdentity"] = Relationship(back_populates="user")
