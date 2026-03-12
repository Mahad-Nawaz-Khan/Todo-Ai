from pydantic import BaseModel
from datetime import datetime
from enum import Enum
from typing import List, Optional


class PriorityEnum(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class RecurrenceRuleEnum(str, Enum):
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"
    MONTHLY = "MONTHLY"


class TagResponse(BaseModel):
    id: int
    name: str
    color: Optional[str] = None
    priority: int = 0
    user_id: int
    created_at: datetime


class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    completed: bool
    priority: Optional[PriorityEnum] = PriorityEnum.MEDIUM
    due_date: Optional[datetime] = None
    recurrence_rule: Optional[RecurrenceRuleEnum] = None
    created_at: datetime
    updated_at: datetime
    tags: List[TagResponse] = []


class TaskCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Optional[PriorityEnum] = PriorityEnum.MEDIUM
    due_date: Optional[datetime] = None
    recurrence_rule: Optional[RecurrenceRuleEnum] = None
    tag_ids: Optional[List[int]] = []  # List of tag IDs to associate with the task


class TaskUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None
    priority: Optional[PriorityEnum] = None
    due_date: Optional[datetime] = None
    recurrence_rule: Optional[RecurrenceRuleEnum] = None
    tag_ids: Optional[List[int]] = None  # Updated list of tag IDs


class TaskToggleCompletionRequest(BaseModel):
    completed: bool