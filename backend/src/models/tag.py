from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Index

from .task_tag import TaskTagLink

if TYPE_CHECKING:
    from .user import User
    from .task import Task
    


class TagBase(SQLModel):
    name: str
    color: str
    priority: int = 0
    user_id: int = Field(foreign_key="user.id")


class Tag(TagBase, table=True):
    __table_args__ = (
        Index("idx_tag_user_name", "user_id", "name"),  # Index for user-specific tag queries
        Index("idx_tag_user_priority", "user_id", "priority"),  # Index for priority-based queries
        Index("idx_tag_user_created_at", "user_id", "created_at"),  # Index for time-based queries
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    color: str
    priority: int = 0
    user_id: int = Field(foreign_key="user.id", index=True)  # Index for user_id
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)  # Index for created_at

    # Relationships
    user: "User" = Relationship(back_populates="tags")
    tasks: list["Task"] = Relationship(back_populates="tags", link_model=TaskTagLink)