"""
Streaming Chat API Router - Endpoints for AI Chatbot with SSE streaming

This router provides Server-Sent Events (SSE) streaming for real-time
AI responses using the OpenAI Agents SDK.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Query
from fastapi.responses import StreamingResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlmodel import Session
from typing import Optional, Dict, Any, AsyncIterator
import json
import logging
import asyncio

from ..middleware.auth import get_current_user
from ..database import get_session
from ..services.chat_service import chat_service
from ..services.auth_service import auth_service
from ..services.agent_service import agent_service
from ..models.chat_models import (
    ChatMessageCreate,
    SenderTypeEnum,
)


logger = logging.getLogger(__name__)


# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/api/v1/chat", tags=["chat-streaming"])


async def _stream_response_generator(
    content: str,
    user_id: int,
    session_id: str,
    db_session: Session,
    conversation_history: Optional[list] = None,
    user_info: Optional[Dict[str, str]] = None
) -> AsyncIterator[str]:
    """
    Generator function that yields SSE formatted events.

    Args:
        content: User message content
        user_id: Internal user ID
        session_id: Session identifier
        db_session: Database session
        conversation_history: Optional conversation history
        user_info: Optional user information for personalization

    Yields:
        SSE formatted strings
    """
    try:
        # Create user message first
        user_message = chat_service.create_user_message(
            user_id=user_id,
            session_id=session_id,
            content=content,
            db_session=db_session
        )

        # Send initial event
        yield f"event: message_created\ndata: {json.dumps({'id': user_message.id, 'content': content})}\n\n"

        # Process with streaming agent (AI is required)
        if not agent_service.is_available():
            yield f"data: {json.dumps({'type': 'error', 'content': 'AI service is not available. Please ensure GEMINI_API_KEY is configured.'})}\n\n"
            yield f"data: [DONE]\n\n"
            return

        full_response_content = ""
        operation_performed = None
        model_used = None

        async for event in agent_service.process_message_streamed(
            content=content,
            user_id=user_id,
            db_session=db_session,
            conversation_history=conversation_history,
            user_info=user_info
        ):
            if event["type"] == "content_delta":
                # Stream text content
                full_response_content += event["content"]
                yield f"data: {json.dumps({'type': 'content_delta', 'content': event['content']})}\n\n"

            elif event["type"] == "tool_call":
                # Notify that a tool is being called
                yield f"data: {json.dumps({'type': 'tool_call', 'tool': event.get('tool_name'), 'args': event.get('tool_args')})}\n\n"

            elif event["type"] == "tool_output":
                # Tool result received
                yield f"data: {json.dumps({'type': 'tool_output', 'output': event.get('output')})}\n\n"

            elif event["type"] == "final":
                # Final response
                full_response_content = event.get("content", full_response_content)
                operation_performed = event.get("operation_performed")
                model_used = event.get("model_used")

                # Create AI message in database
                ai_message = chat_service.create_ai_message(
                    user_id=user_id,
                    session_id=session_id,
                    content=full_response_content,
                    db_session=db_session
                )

                # Send final event with complete response
                final_data = {
                    "type": "final",
                    "content": full_response_content,
                    "operation_performed": operation_performed,
                    "model_used": model_used,
                    "message": {
                        "id": str(ai_message.id),
                        "content": full_response_content,
                        "sender_type": "AI",
                        "created_at": ai_message.created_at.isoformat()
                    }
                }
                yield f"data: {json.dumps(final_data)}\n\n"
                yield f"data: [DONE]\n\n"
                return

            elif event["type"] == "error":
                # Error occurred
                yield f"data: {json.dumps({'type': 'error', 'content': event.get('content', 'Unknown error')})}\n\n"
                return

    except Exception as e:
        logger.exception(f"Error in stream generator: {str(e)}")
        yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"


@router.get("/stream")
@limiter.limit("30/minute")
async def stream_chat_get(
    request: Request,
    content: str = Query(..., description="The user's message content"),
    session_id: str = Query(..., description="The session identifier"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db_session: Session = Depends(get_session)
):
    """
    GET endpoint for streaming chat (for easier frontend integration).

    Query parameters:
    - content: The user's message
    - session_id: The session identifier
    """
    try:
        # Get or create user from Clerk payload
        user = await auth_service.get_or_create_user_from_clerk_payload(current_user, db_session)
        user_id = user.id

        # Get conversation history for context
        messages = chat_service.get_chat_history(user_id, session_id, db_session, limit=10)
        conversation_history = [
            {
                "sender_type": msg.sender_type,
                "content": msg.content,
                "created_at": msg.created_at.isoformat()
            }
            for msg in messages
        ]

        # Extract user info from Clerk payload for personalized responses
        user_info = {
            "name": current_user.get("given_name") or current_user.get("name") or "there",
            "first_name": current_user.get("given_name", ""),
            "last_name": current_user.get("family_name", ""),
            "email": current_user.get("email", "")
        }

        # Return streaming response
        return StreamingResponse(
            _stream_response_generator(
                content=content,
                user_id=user_id,
                session_id=session_id,
                db_session=db_session,
                conversation_history=conversation_history,
                user_info=user_info
            ),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            }
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
    db_session: Session = Depends(get_session)
):
    """
    Send a message to the AI chatbot and get a streamed response using Server-Sent Events.

    The streaming endpoint provides real-time token-by-token updates as the AI generates
    its response. Connect with EventSource or similar SSE client.

    Example using JavaScript EventSource:
    ```javascript
    const eventSource = new EventSource('/api/v1/chat/message/stream?content=...' + session_id, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ...' }
    });

    eventSource.addEventListener('content', (e) => {
        const data = JSON.parse(e.data);
        console.log('Content delta:', data.content);
    });

    eventSource.addEventListener('done', (e) => {
        const data = JSON.parse(e.data);
        console.log('Complete:', data);
        eventSource.close();
    });
    ```
    """
    try:
        # Get or create user from Clerk payload
        user = await auth_service.get_or_create_user_from_clerk_payload(current_user, db_session)
        user_id = user.id

        # Generate session ID if not provided
        session_id = message_data.session_id or f"session_{user_id}_{int(hash(current_user.get('sub', '')) % 1000000)}"

        # Handle welcome messages - just save to DB, don't process with AI
        if getattr(message_data, 'is_welcome', False):
            ai_message = chat_service.create_ai_message(
                user_id=user_id,
                session_id=session_id,
                content=message_data.content,
                db_session=db_session
            )

            # Return simple success response
            async def welcome_response_generator():
                yield f"data: {json.dumps({'type': 'final', 'content': message_data.content, 'message': {'id': str(ai_message.id), 'content': message_data.content, 'sender_type': 'AI', 'created_at': ai_message.created_at.isoformat()}})}\\n\\n"
                yield f"data: [DONE]\\n\\n"

            return StreamingResponse(
                welcome_response_generator(),
                media_type="text/event-stream",
                headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"}
            )

        # Get conversation history for context
        messages = chat_service.get_chat_history(user_id, session_id, db_session, limit=10)
        conversation_history = [
            {
                "sender_type": msg.sender_type,
                "content": msg.content,
                "created_at": msg.created_at.isoformat()
            }
            for msg in messages
        ]

        # Extract user info from Clerk payload for personalized responses
        user_info = {
            "name": current_user.get("given_name") or current_user.get("name") or "there",
            "first_name": current_user.get("given_name", ""),
            "last_name": current_user.get("family_name", ""),
            "email": current_user.get("email", "")
        }

        # Return streaming response
        return StreamingResponse(
            _stream_response_generator(
                content=message_data.content,
                user_id=user_id,
                session_id=session_id,
                db_session=db_session,
                conversation_history=conversation_history,
                user_info=user_info
            ),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",  # Disable nginx buffering
            }
        )

    except Exception as e:
        logger.exception(f"Error processing streaming chat message: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process message")
