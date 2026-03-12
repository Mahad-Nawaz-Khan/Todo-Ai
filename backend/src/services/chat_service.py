"""
Chat Service - Core chatbot business logic with intent classification
"""

import logging
import re
import json
from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlmodel import Session, select
from ..models.chat_models import (
    ChatInteraction,
    ChatMessage,
    OperationRequest,
    SenderTypeEnum,
    IntentTypeEnum,
    OperationTypeEnum,
    OperationStatusEnum,
    EntityTypeEnum,
    IntentDetectionResult,
)
from ..models.user import User


logger = logging.getLogger(__name__)


class ChatService:
    """
    Core chatbot service for processing user messages and managing conversations.
    Handles intent classification, parameter extraction, and orchestration of AI operations.
    """

    def __init__(self):
        pass

    # ============================================================================
    # Intent Classification
    # ============================================================================

    def classify_intent(self, message: str) -> IntentDetectionResult:
        """
        Classify the intent from a user message using rule-based pattern matching.
        In production, this would use an AI model for better accuracy.

        Args:
            message: The user's message text

        Returns:
            IntentDetectionResult with detected intent, confidence, and parameters
        """
        message_lower = message.lower().strip()

        # Pattern matching for different intents
        patterns = {
            # Create task patterns
            IntentTypeEnum.CREATE_TASK: [
                r'\b(create|add|make|new)\s+(a\s+)?task\s+(to|for|about)?\s*(.+)',
                r'\b(create|add)\s+(.+?)\s+task',
                r'\b(remind\s+me\s+(to|about))\s*(.+)',
                r'\b(need\s+to|should|have\s+to|gotta)\s*(.+)',
                r'\b(new\s+task)[\s:]+(.+)',
            ],
            # Update task patterns
            IntentTypeEnum.UPDATE_TASK: [
                r'\b(update|change|edit|modify)\s+(the\s+)?task\s*(.+)',
                r'\b(mark|set|change)\s+(the\s+)?task\s*\d*\s+as\s+(completed|done|finished)',
                r'\b(mark|set|change)\s+task\s*\d+\s+as\s+(completed|done|finished)',
                r'\b(complete|finish|done)\s+(the\s+)?task\s*\d*',
            ],
            # Delete task patterns
            IntentTypeEnum.DELETE_TASK: [
                r'\b(delete|remove)\s+(the\s+)?task\s*(\d+)?\s*(.+)?',
                r'\b(delete|remove)\s+(the\s+)?task\s*(\d+)?$',
            ],
            # Search tasks patterns
            IntentTypeEnum.SEARCH_TASKS: [
                r'\b(search|find|look\s+for)\s+(tasks?)\s*(.+)',
                r'\b(show\s+me)\s*(tasks?)\s*(with|containing)\s*(.+)',
            ],
            # List tasks patterns - Order matters! More specific patterns first
            IntentTypeEnum.LIST_TASKS: [
                r'\b(today|tomorrow|this\s+week)\s*',
                r'\b(show|list|display|what\s+are)\s*(all\s+)?(my\s+)?tasks?',
                r'\b(get|see|view)\s*(all\s+)?(my\s+)?tasks?',
                r'\b(tasks?)\s+(do\s+)?(i\s+have)',
            ],
            # Read task patterns
            IntentTypeEnum.READ_TASK: [
                r'\b(show|get|tell\s+me\s+about)\s+(the\s+)?task\s*\d+',
            ],
        }

        # Check each pattern
        for intent, pattern_list in patterns.items():
            for pattern in pattern_list:
                match = re.search(pattern, message_lower, re.IGNORECASE)
                if match:
                    # Extract parameters from the match
                    parameters = self._extract_parameters(message, intent, match)
                    confidence = self._calculate_confidence(message, intent, match)

                    logger.info(f"Detected intent: {intent} with confidence {confidence}")
                    return IntentDetectionResult(
                        intent=intent,
                        confidence=confidence,
                        parameters=parameters
                    )

        # Default to unknown if no pattern matches
        logger.info(f"No intent detected, returning UNKNOWN")
        return IntentDetectionResult(
            intent=IntentTypeEnum.UNKNOWN,
            confidence=0.0,
            parameters={}
        )

    def _extract_parameters(self, message: str, intent: IntentTypeEnum, match: re.Match) -> Dict[str, Any]:
        """
        Extract parameters from the message based on the detected intent.

        Args:
            message: The original user message
            intent: The detected intent
            match: The regex match object

        Returns:
            Dictionary of extracted parameters
        """
        parameters = {}
        message_lower = message.lower()

        # Extract priority
        priority_patterns = {
            'high': [r'\bhigh\s*priority', r'\bhigh', r'\bimportant', r'\burgent', r'\bcrucial'],
            'medium': [r'\bmedium\s*priority', r'\bmedium', r'\bnormal'],
            'low': [r'\blow\s*priority', r'\blow', r'\bminor', r'\btrivial'],
        }

        for priority, patterns in priority_patterns.items():
            for pattern in patterns:
                if re.search(pattern, message_lower):
                    parameters['priority'] = priority.upper()
                    break

        # Extract due date (simple patterns)
        due_date_patterns = [
            (r'\btoday', lambda: datetime.now().strftime('%Y-%m-%d')),
            (r'\btomorrow', lambda: (datetime.now().replace(hour=23, minute=59) +
                                     __import__('datetime').timedelta(days=1)).strftime('%Y-%m-%d')),
            (r'\bthis\s+week', lambda: (datetime.now().replace(hour=23, minute=59) +
                                       __import__('datetime').timedelta(days=7)).strftime('%Y-%m-%d')),
            (r'\bby\s+friday', lambda: self._get_next_friday()),
            (r'\bby\s+monday', lambda: self._get_next_monday()),
        ]

        for pattern, date_func in due_date_patterns:
            if re.search(pattern, message_lower):
                try:
                    parameters['due_date'] = date_func()
                except:
                    pass
                break

        # Extract task title based on intent
        if intent == IntentTypeEnum.CREATE_TASK:
            # Try to extract title from various patterns
            title_match = re.search(
                r'\b(create|add|make|new)\s+(a\s+)?task\s+(to|for|about)?\s*(.+?)(?:\s+(?:with|by|priority|$))',
                message_lower
            )
            if title_match:
                title = title_match.group(4).strip()
                # Remove trailing words that are part of the command
                for word in ['with', 'by', 'due', 'priority']:
                    if word in title:
                        title = title.split(word)[0].strip()
                if title:
                    parameters['title'] = title.capitalize()

        return parameters

    def _calculate_confidence(self, message: str, intent: IntentTypeEnum, match: re.Match) -> float:
        """
        Calculate confidence score for the detected intent.

        Args:
            message: The user message
            intent: The detected intent
            match: The regex match object

        Returns:
            Confidence score between 0.0 and 1.0
        """
        # Base confidence on match quality
        confidence = 0.7  # Base confidence for any match

        # Increase confidence if match is specific
        if match and match.end() - match.start() > len(message) * 0.3:
            confidence += 0.1

        # Check for clear intent keywords
        clear_indicators = {
            IntentTypeEnum.CREATE_TASK: ['create', 'add', 'make', 'new'],
            IntentTypeEnum.UPDATE_TASK: ['update', 'change', 'edit', 'modify', 'complete'],
            IntentTypeEnum.DELETE_TASK: ['delete', 'remove'],
            IntentTypeEnum.SEARCH_TASKS: ['search', 'find'],
            IntentTypeEnum.LIST_TASKS: ['show', 'list', 'display'],
            IntentTypeEnum.READ_TASK: ['show', 'get', 'tell'],
        }

        for keyword in clear_indicators.get(intent, []):
            if keyword in message.lower():
                confidence += 0.1
                break

        return min(confidence, 1.0)

    # Helper methods for date extraction
    def _get_next_friday(self):
        """Get the date of next Friday"""
        today = datetime.now()
        days_ahead = 4 - today.weekday()
        if days_ahead <= 0:  # Target day already happened this week
            days_ahead += 7
        return (today + __import__('datetime').timedelta(days=days_ahead)).strftime('%Y-%m-%d')

    def _get_next_monday(self):
        """Get the date of next Monday"""
        today = datetime.now()
        days_ahead = 0 - today.weekday()
        if days_ahead <= 0:
            days_ahead += 7
        return (today + __import__('datetime').timedelta(days=days_ahead)).strftime('%Y-%m-%d')

    # ============================================================================
    # Chat Message Management
    # ============================================================================

    def create_chat_interaction(
        self,
        user_id: int,
        session_id: str,
        db_session: Session
    ) -> ChatInteraction:
        """
        Create a new chat interaction for a user session.

        Args:
            user_id: The internal user ID
            session_id: Session identifier for conversation grouping
            db_session: Database session

        Returns:
            Created ChatInteraction object
        """
        interaction = ChatInteraction(
            user_id=user_id,
            session_id=session_id
        )
        db_session.add(interaction)
        db_session.commit()
        db_session.refresh(interaction)
        logger.info(f"Created chat interaction {interaction.id} for user {user_id}")
        return interaction

    def get_or_create_interaction(
        self,
        user_id: int,
        session_id: str,
        db_session: Session
    ) -> ChatInteraction:
        """
        Get existing chat interaction or create a new one for the session.

        Args:
            user_id: The internal user ID
            session_id: Session identifier
            db_session: Database session

        Returns:
            ChatInteraction object
        """
        interaction = db_session.exec(
            select(ChatInteraction).where(
                ChatInteraction.user_id == user_id,
                ChatInteraction.session_id == session_id
            )
        ).first()

        if not interaction:
            interaction = self.create_chat_interaction(user_id, session_id, db_session)
        else:
            # Update the updated_at timestamp
            interaction.updated_at = datetime.utcnow()
            db_session.add(interaction)
            db_session.commit()

        return interaction

    def create_user_message(
        self,
        user_id: int,
        session_id: str,
        content: str,
        db_session: Session
    ) -> ChatMessage:
        """
        Create a new user message and detect its intent.

        Args:
            user_id: The internal user ID
            session_id: Session identifier
            content: Message content
            db_session: Database session

        Returns:
            Created ChatMessage object
        """
        # Validate message length
        if len(content) > 5000:
            raise ValueError("Message content exceeds 5000 character limit")

        # Get or create chat interaction
        interaction = self.get_or_create_interaction(user_id, session_id, db_session)

        # Classify intent
        intent_result = self.classify_intent(content)

        # Create message
        message = ChatMessage(
            chat_interaction_id=interaction.id,
            sender_type=SenderTypeEnum.USER,
            content=content,
            intent=intent_result.intent.value if intent_result.intent != IntentTypeEnum.UNKNOWN else None,
            intent_confidence=intent_result.confidence,
            processed=False
        )

        db_session.add(message)
        db_session.commit()
        db_session.refresh(message)

        logger.info(f"Created user message {message.id} with intent {intent_result.intent}")
        return message

    def create_ai_message(
        self,
        user_id: int,
        session_id: str,
        content: str,
        db_session: Session
    ) -> ChatMessage:
        """
        Create a new AI response message.

        Args:
            user_id: The internal user ID
            session_id: Session identifier
            content: Message content
            db_session: Database session

        Returns:
            Created ChatMessage object
        """
        # Get or create chat interaction
        interaction = self.get_or_create_interaction(user_id, session_id, db_session)

        # Create message
        message = ChatMessage(
            chat_interaction_id=interaction.id,
            sender_type=SenderTypeEnum.AI,
            content=content,
            intent=None,
            processed=True
        )

        db_session.add(message)
        db_session.commit()
        db_session.refresh(message)

        logger.info(f"Created AI message {message.id}")
        return message

    def get_chat_history(
        self,
        user_id: int,
        session_id: str,
        db_session: Session,
        limit: int = 50
    ) -> List[ChatMessage]:
        """
        Get chat history for a user session.

        Args:
            user_id: The internal user ID
            session_id: Session identifier
            db_session: Database session
            limit: Maximum number of messages to return

        Returns:
            List of ChatMessage objects
        """
        interaction = self.get_or_create_interaction(user_id, session_id, db_session)

        messages = db_session.exec(
            select(ChatMessage)
            .where(ChatMessage.chat_interaction_id == interaction.id)
            .order_by(ChatMessage.created_at)
            .limit(limit)
        ).all()

        return messages

    # ============================================================================
    # Operation Request Management
    # ============================================================================

    def create_operation_request(
        self,
        chat_message_id: int,
        operation_type: OperationTypeEnum,
        entity_type: EntityTypeEnum,
        parameters: Dict[str, Any],
        db_session: Session
    ) -> OperationRequest:
        """
        Create a new operation request to be executed by the MCP server.

        Args:
            chat_message_id: ID of the chat message that triggered the operation
            operation_type: Type of operation (CREATE, READ, UPDATE, DELETE)
            entity_type: Type of entity (TASK, TAG, USER)
            parameters: Validated parameters for the operation
            db_session: Database session

        Returns:
            Created OperationRequest object
        """
        operation_request = OperationRequest(
            chat_message_id=chat_message_id,
            operation_type=operation_type,
            entity_type=entity_type,
            parameters=json.dumps(parameters),
            status=OperationStatusEnum.PENDING
        )

        db_session.add(operation_request)
        db_session.commit()
        db_session.refresh(operation_request)

        logger.info(f"Created operation request {operation_request.id}")
        return operation_request

    def update_operation_status(
        self,
        operation_id: int,
        status: OperationStatusEnum,
        db_session: Session,
        response: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None
    ) -> OperationRequest:
        """
        Update the status of an operation request.

        Args:
            operation_id: ID of the operation request
            status: New status
            response: Optional response data
            error_message: Optional error message if operation failed
            db_session: Database session

        Returns:
            Updated OperationRequest object
        """
        operation_request = db_session.get(OperationRequest, operation_id)
        if not operation_request:
            raise ValueError(f"Operation request {operation_id} not found")

        operation_request.status = status
        if response:
            operation_request.response = json.dumps(response)
        if error_message:
            operation_request.error_message = error_message
        if status == OperationStatusEnum.COMPLETED:
            operation_request.completed_at = datetime.utcnow()

        db_session.add(operation_request)
        db_session.commit()
        db_session.refresh(operation_request)

        logger.info(f"Updated operation {operation_id} status to {status}")
        return operation_request


# Singleton instance
chat_service = ChatService()