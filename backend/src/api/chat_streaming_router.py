"""
Streaming Chat API Router - Endpoints for AI Chatbot with SSE streaming.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Query
from fastapi.responses import StreamingResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlmodel import Session
from typing import Optional, Dict, Any, AsyncIterator
import json
import logging

from ..middleware.auth import get_current_user
from ..database import get_session
from ..services.chat_service import chat_service
from ..services.auth_service import auth_service
from ..services.agent_service import agent_service
from ..models.chat_models import ChatInteraction, ChatMessage, ChatMessageCreate


logger = logging.getLogger(__name__)


limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/api/v1/chat", tags=["chat-streaming"])


def _sse_payload(data: Dict[str, Any]) -> str:
    return f"data: {json.dumps(data)}\n\n"


def _sse_done() -> str:
    return "data: [DONE]\n\n"


def _build_user_info(current_user: Dict[str, Any]) -> Dict[str, str]:
    return {
        "name": current_user.get("given_name") or current_user.get("name") or "there",
        "first_name": current_user.get("given_name", ""),
        "last_name": current_user.get("family_name", ""),
        "email": current_user.get("email", ""),
    }


def _build_conversation_history(messages: list[ChatMessage]) -> list[Dict[str, str]]:
    return [
        {
            "sender_type": msg.sender_type,
            "content": msg.content,
            "created_at": msg.created_at.isoformat(),
        }
        for msg in messages
    ]


def _default_session_id(user_id: int, current_user: Dict[str, Any]) -> str:
    return f"session_{user_id}_{int(hash(current_user.get('sub', '')) % 1000000)}"


def _stream_headers() -> Dict[str, str]:
    return {
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
    }


def _final_stream_payload(ai_message: ChatMessage, content: str, operation_performed: Any, model_used: Any) -> Dict[str, Any]:
    return {
        "type": "final",
        "content": content,
        "operation_performed": operation_performed,
        "model_used": model_used,
        "message": {
            "id": str(ai_message.id),
            "content": content,
            "sender_type": "AI",
            "created_at": ai_message.created_at.isoformat(),
        },
    }


def _welcome_stream_payload(ai_message: ChatMessage, content: str) -> Dict[str, Any]:
    return {
        "type": "final",
        "content": content,
        "message": {
            "id": str(ai_message.id),
            "content": content,
            "sender_type": "AI",
            "created_at": ai_message.created_at.isoformat(),
        },
    }


async def _stream_response_generator(
    content: str,
    interaction: ChatInteraction,
    user_message: ChatMessage,
    db_session: Session,
    conversation_history: Optional[list] = None,
    user_info: Optional[Dict[str, str]] = None,
) -> AsyncIterator[str]:
    try:
        if not agent_service.is_available():
            yield _sse_payload({"type": "error", "content": "AI service is not available. Please ensure a provider key is configured."})
            yield _sse_done()
            return

        full_response_content = ""

        async for event in agent_service.process_message_streamed(
            content=content,
            user_id=interaction.user_id,
            db_session=db_session,
            conversation_history=conversation_history,
            user_info=user_info,
        ):
            if event["type"] == "content_delta":
                delta = event.get("content", "")
                full_response_content += delta
                if delta:
                    yield _sse_payload({"type": "content_delta", "content": delta})

            elif event["type"] == "final":
                full_response_content = event.get("content", full_response_content)
                ai_message = chat_service.finalize_interaction_response(
                    interaction=interaction,
                    user_message=user_message,
                    ai_content=full_response_content,
                    db_session=db_session,
                )
                yield _sse_payload(
                    _final_stream_payload(
                        ai_message,
                        full_response_content,
                        event.get("operation_performed"),
                        event.get("model_used"),
                    )
                )
                yield _sse_done()
                return

            elif event["type"] == "error":
                yield _sse_payload({"type": "error", "content": event.get("content", "Unknown error")})
                yield _sse_done()
                return

    except Exception as e:
        logger.exception(f"Error in stream generator: {str(e)}")
        yield _sse_payload({"type": "error", "content": str(e)})
        yield _sse_done()


@router.get("/stream")
@limiter.limit("30/minute")
async def stream_chat_get(
    request: Request,
    content: str = Query(..., description="The user's message content"),
    session_id: str = Query(..., description="The session identifier"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db_session: Session = Depends(get_session),
):
    try:
        user = await auth_service.resolve_user_from_auth_payload(current_user, db_session)
        interaction = chat_service.get_or_create_interaction(user.id, session_id, db_session)
        messages = chat_service.get_messages_for_interaction(interaction.id, db_session, limit=10)
        conversation_history = _build_conversation_history(messages)
        user_message = chat_service.create_user_message_for_interaction(interaction, content, db_session)

        return StreamingResponse(
            _stream_response_generator(
                content=content,
                interaction=interaction,
                user_message=user_message,
                db_session=db_session,
                conversation_history=conversation_history,
                user_info=_build_user_info(current_user),
            ),
            media_type="text/event-stream",
            headers=_stream_headers(),
        )

    except Exception as e:
        logger.exception(f"Error processing streaming chat message: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process message")


@router.post("/message/stream")
@limiter.limit("30/minute")
async def send_chat_message_stream(
    request: Request,
    message_data: ChatMessageCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db_session: Session = Depends(get_session),
):
    try:
        user = await auth_service.resolve_user_from_auth_payload(current_user, db_session)
        user_id = user.id
        session_id = message_data.session_id or _default_session_id(user_id, current_user)
        interaction = chat_service.get_or_create_interaction(user_id, session_id, db_session)

        if getattr(message_data, "is_welcome", False):
            ai_message = chat_service.create_ai_message_for_interaction(interaction, message_data.content, db_session)

            async def welcome_response_generator() -> AsyncIterator[str]:
                yield _sse_payload(_welcome_stream_payload(ai_message, message_data.content))
                yield _sse_done()

            return StreamingResponse(
                welcome_response_generator(),
                media_type="text/event-stream",
                headers=_stream_headers(),
            )

        messages = chat_service.get_messages_for_interaction(interaction.id, db_session, limit=10)
        conversation_history = _build_conversation_history(messages)
        user_message = chat_service.create_user_message_for_interaction(interaction, message_data.content, db_session)

        return StreamingResponse(
            _stream_response_generator(
                content=message_data.content,
                interaction=interaction,
                user_message=user_message,
                db_session=db_session,
                conversation_history=conversation_history,
                user_info=_build_user_info(current_user),
            ),
            media_type="text/event-stream",
            headers=_stream_headers(),
        )

    except Exception as e:
        logger.exception(f"Error processing streaming chat message: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process message")
