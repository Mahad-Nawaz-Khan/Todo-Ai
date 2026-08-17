"""
Test Suite for Streaming Chat Functionality

Tests the streaming chat endpoint using SSE (Server-Sent Events).
"""

import pytest
import sys
import os
import asyncio
from httpx import AsyncClient, ASGITransport

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def app():
    """Create the FastAPI application for testing."""
    from src.main import app
    return app


@pytest.fixture
async def client(app):
    """Create an async HTTP client for testing."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac


@pytest.fixture
def mock_auth_headers():
    """Mock authentication headers."""
    return {
        "Authorization": "Bearer mock_token_123"
    }


# ============================================================================
# Mock Dependencies
# ============================================================================


@pytest.fixture
def mock_get_current_user(test_user):
    """Mock the get_current_user dependency."""
    from src.middleware import auth
    from src.models.user import User

    original = auth.get_current_user

    async def mock_get_user():
        return {
            "sub": test_user.clerk_id,
            "email": test_user.email,
            "username": test_user.username,
        }

    auth.get_current_user = mock_get_user
    yield mock_get_user
    auth.get_current_user = original


@pytest.fixture
def test_user(db_session):
    """Create a test user."""
    from src.models.user import User

    user = User(
        clerk_id="test_clerk_streaming",
        email="streaming@test.com",
        username="streaming_user",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


# ============================================================================
# Unit Tests
# ============================================================================


class TestStreamGenerator:
    """Test the stream response generator function."""

    @pytest.mark.asyncio
    async def test_stream_generator_without_ai_provider(self):
        """Without an initialized AI provider, the generator emits an error event and [DONE]."""
        from src.api.chat_streaming_router import _stream_response_generator

        events = []
        async for event in _stream_response_generator(
            content="Show me my tasks",
            interaction_id=1,
            user_id=1,
            user_message_id=1,
            conversation_history=None,
        ):
            events.append(event)

        assert len(events) > 0

        # The final event must always be the SSE [DONE] sentinel
        assert events[-1].strip() == "data: [DONE]"

        # An error payload is emitted since no AI provider is initialized in tests
        assert any('"type": "error"' in e for e in events[:-1])

    @pytest.mark.asyncio
    async def test_stream_generator_with_history(self):
        """Test stream generation with conversation history."""
        from src.api.chat_streaming_router import _stream_response_generator

        history = [
            {"sender_type": "USER", "content": "Hello"},
            {"sender_type": "AI", "content": "Hi there!"},
        ]

        events = []
        async for event in _stream_response_generator(
            content="Show me my tasks",
            interaction_id=1,
            user_id=1,
            user_message_id=1,
            conversation_history=history,
        ):
            events.append(event)

        assert len(events) > 0
        assert events[-1].strip() == "data: [DONE]"


# ============================================================================
# Integration Tests
# ============================================================================


class TestStreamingChatEndpoint:
    """Test the /api/v1/chat/message/stream endpoint."""

    @pytest.mark.asyncio
    async def test_stream_endpoint_requires_auth(self, app):
        """Test that the stream endpoint requires authentication."""
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/v1/chat/message/stream",
                json={"content": "Hello", "session_id": "test"}
            )

            # Should fail without auth
            assert response.status_code == 401 or response.status_code == 403

    @pytest.mark.asyncio
    @pytest.mark.skip("Requires full auth setup")
    async def test_stream_endpoint_with_auth(self, app, mock_auth_headers):
        """Test the stream endpoint with authentication."""
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/v1/chat/message/stream",
                json={"content": "Show me my tasks", "session_id": "test_session"},
                headers=mock_auth_headers
            )

            # Should return streaming response
            assert response.status_code == 200
            assert response.headers["content-type"] == "text/event-stream; charset=utf-8"

    @pytest.mark.asyncio
    @pytest.mark.skip("Requires full auth setup")
    async def test_stream_response_format(self, app, mock_auth_headers):
        """Test that the stream returns properly formatted SSE events."""
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/v1/chat/message/stream",
                json={"content": "Hello", "session_id": "test_session"},
                headers=mock_auth_headers
            )

            content = response.content.decode()
            lines = content.split("\n")

            # Check for SSE format
            event_lines = [l for l in lines if l.startswith("event: ")]
            data_lines = [l for l in lines if l.startswith("data: ")]

            assert len(event_lines) > 0
            assert len(data_lines) > 0


# ============================================================================
# Tests for Chat Service Streaming Support
# ============================================================================


class TestChatServiceStreaming:
    """Test chat service streaming capabilities."""

    def test_chat_service_has_stream_method(self):
        """Test that chatService has the sendMessageStream method."""
        # This would be tested in the frontend
        pass


# ============================================================================
# Tests for useChat Hook Streaming Support
# ============================================================================


class TestUseChatStreaming:
    """Test useChat hook streaming support."""

    def test_use_chat_supports_streaming_option(self):
        """Test that useChat accepts an enableStreaming option."""
        # This would be tested in frontend unit tests
        pass


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
