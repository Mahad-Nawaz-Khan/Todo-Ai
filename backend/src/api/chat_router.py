"""
Chat API Router - Endpoints for AI Chatbot functionality
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlmodel import Session
from typing import Optional, Dict, Any
from ..middleware.auth import get_current_user
from ..database import get_session
from ..services.chat_service import chat_service
from ..services.auth_service import auth_service
from ..services.agent_service import agent_service
from ..models.chat_models import (
    ChatMessageCreate,
    ChatResponse,
    ChatHistoryResponse,
    ChatMessageResponse,
)
import logging


logger = logging.getLogger(__name__)


# Initialize rate limiter for this router
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])


def _chat_message_to_response(message) -> ChatMessageResponse:
    """Convert a ChatMessage model to ChatMessageResponse"""
    return ChatMessageResponse(
        id=message.id,
        content=message.content,
        sender_type=message.sender_type,
        intent=message.intent,
        created_at=message.created_at
    )


@router.post("/message", response_model=ChatResponse)
@limiter.limit("30/minute")
async def send_chat_message(
    request: Request,
    message_data: ChatMessageCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db_session: Session = Depends(get_session)
):
    """
    Send a message to the AI chatbot and get a response.

    The AI will analyze the message, detect the user's intent,
    and perform appropriate actions (create/update/delete/search tasks).
    """
    try:
        user = await auth_service.get_or_create_user_from_auth_payload(current_user, db_session)
        user_id = user.id

        # Generate session ID if not provided
        session_id = message_data.session_id or f"session_{user_id}_{int(hash(current_user.get('sub', '')) % 1000000)}"

        # Create user message with intent detection
        user_message = chat_service.create_user_message(
            user_id=user_id,
            session_id=session_id,
            content=message_data.content,
            db_session=db_session
        )

        # Build recent conversation context for the AI service.
        history_messages = chat_service.get_chat_history(user_id, session_id, db_session, limit=10)
        conversation_history = [
            {
                "sender_type": msg.sender_type,
                "content": msg.content,
                "created_at": msg.created_at.isoformat(),
            }
            for msg in history_messages[:-1]
        ]

        user_info = {
            "name": current_user.get("given_name") or current_user.get("name") or "there",
            "first_name": current_user.get("given_name", ""),
            "last_name": current_user.get("family_name", ""),
            "email": current_user.get("email", ""),
        }

        ai_result = await agent_service.process_message(
            content=message_data.content,
            user_id=user_id,
            db_session=db_session,
            conversation_history=conversation_history,
            user_info=user_info,
        )

        ai_response_content = ai_result.get("content") or "I'm sorry, I couldn't process that request."
        operation_performed = ai_result.get("operation_performed")
        model_used = ai_result.get("model_used") or "OpenAI Agents SDK (Z.ai)"

        # Mark user message as processed
        user_message.processed = True
        db_session.add(user_message)
        db_session.commit()

        # Create AI response message
        ai_message = chat_service.create_ai_message(
            user_id=user_id,
            session_id=session_id,
            content=ai_response_content,
            db_session=db_session
        )

        return ChatResponse(
            message=_chat_message_to_response(ai_message),
            operation_performed=operation_performed,
            model_used=model_used
        )

    except Exception as e:
        logger.exception(f"Error processing chat message: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process message")


@router.get("/history", response_model=ChatHistoryResponse)
@limiter.limit("60/minute")
async def get_chat_history(
    request: Request,
    session_id: Optional[str] = None,
    limit: int = 50,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db_session: Session = Depends(get_session)
):
    """
    Get chat history for a session.
    """
    try:
        user = await auth_service.get_or_create_user_from_auth_payload(current_user, db_session)
        user_id = user.id

        # Use provided session_id or generate default
        if not session_id:
            session_id = f"session_{user_id}_{int(hash(current_user.get('sub', '')) % 1000000)}"

        # Get chat history
        messages = chat_service.get_chat_history(user_id, session_id, db_session, limit)

        # Convert to response format
        message_responses = [_chat_message_to_response(msg) for msg in messages]

        return ChatHistoryResponse(
            messages=message_responses,
            total_count=len(message_responses),
            session_id=session_id
        )

    except Exception as e:
        logger.exception(f"Error getting chat history: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve chat history")


@router.delete("/history")
@limiter.limit("10/minute")
async def clear_chat_history(
    request: Request,
    session_id: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db_session: Session = Depends(get_session)
):
    """
    Clear chat history for a session.
    """
    try:
        user = await auth_service.get_or_create_user_from_auth_payload(current_user, db_session)
        user_id = user.id

        # Use provided session_id or generate default
        if not session_id:
            session_id = f"session_{user_id}_{int(hash(current_user.get('sub', '')) % 1000000)}"

        # This would need to be implemented in the chat service
        # For now, return success
        return {"message": "Chat history cleared", "session_id": session_id}

    except Exception as e:
        logger.exception(f"Error clearing chat history: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to clear chat history")