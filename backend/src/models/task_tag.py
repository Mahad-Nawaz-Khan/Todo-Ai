from sqlmodel import SQLModel, Field
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .task import Task
    from .tag import Tag


class TaskTagLink(SQLModel, table=True):
    task_id: int = Field(foreign_key="task.id", primary_key=True)
    tag_id: int = Field(foreign_key="tag.id", primary_key=True)