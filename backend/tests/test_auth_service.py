import pytest
import asyncio
from unittest.mock import Mock, patch
from sqlmodel import Session
from src.models.user import User
from src.services.auth_service import AuthService


class TestAuthService:
    def setup_method(self):
        """Set up test fixtures before each test method."""
        self.auth_service = AuthService()
        self.mock_session = Mock(spec=Session)

    def test_get_or_create_user_existing(self):
        """Test getting an existing user."""
        # Arrange
        clerk_user_id = "user_123"
        clerk_payload = {"sub": clerk_user_id}

        existing_user = User(
            id=1,
            clerk_user_id=clerk_user_id
        )

        # Mock the session execution to return existing user
        mock_exec_result = Mock()
        mock_exec_result.first.return_value = existing_user
        self.mock_session.exec.return_value = mock_exec_result

        # Act
        result = asyncio.run(
            self.auth_service.get_or_create_user_from_clerk_payload(clerk_payload, self.mock_session)
        )

        # Assert
        assert result is not None
        assert result.id == 1
        assert result.clerk_user_id == clerk_user_id

    def test_get_or_create_user_new(self):
        """Test creating a new user."""
        # Arrange
        clerk_user_id = "user_456"
        clerk_payload = {"sub": clerk_user_id}

        # Mock the session execution to return None (no existing user)
        mock_exec_result = Mock()
        mock_exec_result.first.return_value = None
        self.mock_session.exec.return_value = mock_exec_result

        # Mock the session operations for creating new user
        self.mock_session.add = Mock()
        self.mock_session.commit = Mock()
        self.mock_session.refresh = Mock(side_effect=lambda obj: setattr(obj, 'id', 2))

        # Act
        result = asyncio.run(
            self.auth_service.get_or_create_user_from_clerk_payload(clerk_payload, self.mock_session)
        )

        # Assert
        assert result is not None
        assert result.clerk_user_id == clerk_user_id
        self.mock_session.add.assert_called_once()
        self.mock_session.commit.assert_called_once()

    def test_get_or_create_user_invalid_payload(self):
        """Test creating user with invalid payload."""
        # Arrange
        clerk_payload = {"invalid": "data"}  # Missing 'sub' field

        # Act & Assert
        with pytest.raises(Exception):  # HTTPException
            asyncio.run(
                self.auth_service.get_or_create_user_from_clerk_payload(clerk_payload, self.mock_session)
            )

    def test_get_current_user_id_success(self):
        """Test getting current user ID from payload."""
        # Arrange
        user_id = "user_789"
        clerk_payload = {"sub": user_id}

        # Act
        result = self.auth_service.get_current_user_id(clerk_payload)

        # Assert
        assert result == user_id

    def test_get_current_user_id_invalid_payload(self):
        """Test getting user ID from invalid payload."""
        # Arrange
        clerk_payload = {"invalid": "data"}  # Missing 'sub' field

        # Act & Assert
        with pytest.raises(Exception):  # HTTPException
            self.auth_service.get_current_user_id(clerk_payload)

    def test_get_user_by_id_success(self):
        """Test getting user by ID."""
        # Arrange
        user_id = 1
        expected_user = User(
            id=user_id,
            clerk_user_id="user_123"
        )

        # Mock the session execution
        mock_exec_result = Mock()
        mock_exec_result.first.return_value = expected_user
        self.mock_session.exec.return_value = mock_exec_result

        # Act
        result = self.auth_service.get_user_by_id(user_id, self.mock_session)

        # Assert
        assert result is not None
        assert result.id == user_id

    def test_get_user_by_id_not_found(self):
        """Test getting non-existent user by ID."""
        # Arrange
        user_id = 999

        # Mock the session execution to return None
        mock_exec_result = Mock()
        mock_exec_result.first.return_value = None
        self.mock_session.exec.return_value = mock_exec_result

        # Act
        result = self.auth_service.get_user_by_id(user_id, self.mock_session)

        # Assert
        assert result is None


if __name__ == "__main__":
    pytest.main()