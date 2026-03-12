from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional, TYPE_CHECKING, List
from sqlalchemy import Index

if TYPE_CHECKING:
    from .task import Task
    from .tag import Tag


class UserBase(SQLModel):
    clerk_user_id: str = Field(unique=True, nullable=False)


class User(UserBase, table=True):
    __table_args__ = (
        Index("idx_user_clerk_id", "clerk_user_id"),  # Index for Clerk user ID lookups
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    clerk_user_id: str = Field(unique=True, nullable=False, index=True)  # Index for clerk_user_id
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)  # Index for created_at
    
    # Relationships
    tasks: List["Task"] = Relationship(back_populates="user")
    tags: List["Tag"] = Relationship(back_populates="user")