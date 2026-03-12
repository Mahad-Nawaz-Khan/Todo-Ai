"""
Chatbot data models for AI Chatbot System
"""

from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional, TYPE_CHECKING, List
from sqlalchemy import Index, Column, Enum as SAEnum
from enum import Enum

if TYPE_CHECKING:
    from .user import User


class SenderTypeEnum(str, Enum):
    """Enum for message sender types"""
    USER = "USER"
    AI = "AI"


class IntentTypeEnum(str, Enum):
    """Enum for user intent types"""
    CREATE_TASK = "CREATE_TASK"
    UPDATE_TASK = "UPDATE_TASK"
    DELETE_TASK = "DELETE_TASK"
    SEARCH_TASKS = "SEARCH_TASKS"
    LIST_TASKS = "LIST_TASKS"
    READ_TASK = "READ_TASK"
    UNKNOWN = "UNKNOWN"


class OperationTypeEnum(str, Enum):
    """Enum for operation types"""
    CREATE = "CREATE"
    READ = "READ"
    UPDATE = "UPDATE"
    DELETE = "DELETE"


class OperationStatusEnum(str, Enum):
    """Enum for operation status"""
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class EntityTypeEnum(str, Enum):
    """Enum for entity types"""
    TASK = "TASK"
    TAG = "TAG"
    USER = "USER"


class ChatInteraction(SQLModel, table=True):
    """
    Represents a conversation between a user and the AI chatbot.
    Groups related messages together for context management.
    """
    __table_args__ = (
        Index("idx_chat_interaction_user_session", "user_id", "session_id"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    session_id: str = Field(index=True)  # For grouping related messages
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow, index=True)

    # Relationships
    messages: List["ChatMessage"] = Relationship(back_populates="chat_interaction")


class ChatMessage(SQLModel, table=True):
    """
    Represents individual messages within a chat interaction.
    Contains the message content, sender type, and detected intent.
    """
    __table_args__ = (
        Index("idx_chat_message_interaction", "chat_interaction_id"),
        Index("idx_chat_message_created", "created_at"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    chat_interaction_id: int = Field(foreign_key="chatinteraction.id", index=True)
    sender_type: SenderTypeEnum = Field(
        sa_column=Column(SAEnum(SenderTypeEnum), nullable=False)
    )
    content: str = Field(max_length=5000)  # Message text content
    intent: Optional[str] = None  # Detected user intent
    intent_confidence: Optional[float] = None  # Confidence score of intent recognition
    processed: bool = False  # Whether the message has been processed
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    chat_interaction: ChatInteraction = Relationship(back_populates="messages")
    operation_request: Optional["OperationRequest"] = Relationship(back_populates="chat_message")


class OperationRequest(SQLModel, table=True):
    """
    Structured request to be processed by the MCP server containing validated parameters.
    Tracks the execution of data operations initiated by the AI chatbot.
    """
    __table_args__ = (
        Index("idx_operation_request_message", "chat_message_id"),
        Index("idx_operation_request_status", "status"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    chat_message_id: Optional[int] = Field(foreign_key="chatmessage.id", index=True)
    operation_type: OperationTypeEnum = Field(
        sa_column=Column(SAEnum(OperationTypeEnum), nullable=False)
    )
    entity_type: EntityTypeEnum = Field(
        sa_column=Column(SAEnum(EntityTypeEnum), nullable=False)
    )
    parameters: str = Field(default="{}")  # JSON string of validated parameters
    status: OperationStatusEnum = Field(
        sa_column=Column(SAEnum(OperationStatusEnum), nullable=False),
        default=OperationStatusEnum.PENDING
    )
    response: Optional[str] = None  # JSON string of result from MCP server
    error_message: Optional[str] = None  # Error message if operation failed
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

    # Relationships
    chat_message: ChatMessage = Relationship(back_populates="operation_request")


# Pydantic models for API requests/responses


class IntentDetectionResult(SQLModel):
    """Result of intent detection from a user message"""
    intent: IntentTypeEnum
    confidence: float
    parameters: dict = {}  # Extracted parameters


class ChatMessageCreate(SQLModel):
    """Request to create a new chat message"""
    content: str
    session_id: Optional[str] = None  # Optional session ID for conversation context
    is_welcome: bool = False  # If True, this is a welcome message - save but don't process


class ChatMessageResponse(SQLModel):
    """Response containing a chat message"""
    id: int
    content: str
    sender_type: SenderTypeEnum
    intent: Optional[str] = None
    created_at: datetime


class ChatResponse(SQLModel):
    """Response from chat API endpoint"""
    message: ChatMessageResponse
    operation_performed: Optional[dict] = None  # Details of any operation performed
    model_used: Optional[str] = None  # Which AI model was used


class ChatHistoryResponse(SQLModel):
    """Response for chat history endpoint"""
    messages: List[ChatMessageResponse]
    total_count: int
    session_id: str