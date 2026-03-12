import pytest
from unittest.mock import Mock, MagicMock
from sqlmodel import Session
from datetime import datetime
from src.models.tag import Tag
from src.services.tag_service import TagService


class TestTagService:
    def setup_method(self):
        """Set up test fixtures before each test method."""
        self.tag_service = TagService()
        self.mock_session = Mock(spec=Session)

    def test_create_tag_success(self):
        """Test successful tag creation."""
        # Arrange
        user_id = 1
        tag_data = {"name": "Test Tag", "color": "#FF0000"}

        # Mock the database session behavior
        mock_tag = Tag(
            id=1,
            name="Test Tag",
            color="#FF0000",
            user_id=user_id,
            created_at=datetime.utcnow()
        )

        # Mock the session execution to check for existing tags
        mock_exec_result = Mock()
        mock_exec_result.first.return_value = None  # No existing tag
        self.mock_session.exec.return_value = mock_exec_result

        self.mock_session.add = Mock()
        self.mock_session.commit = Mock()
        self.mock_session.refresh = Mock(side_effect=lambda obj: setattr(obj, 'id', 1))

        # Act
        result = self.tag_service.create_tag(tag_data, user_id, self.mock_session)

        # Assert
        assert result is not None
        assert result.name == "Test Tag"
        assert result.color == "#FF0000"
        assert result.user_id == user_id

    def test_create_tag_duplicate_name(self):
        """Test creating a tag with duplicate name for the same user."""
        # Arrange
        user_id = 1
        tag_data = {"name": "Duplicate Tag", "color": "#FF0000"}

        # Mock an existing tag with the same name
        existing_tag = Tag(
            id=1,
            name="Duplicate Tag",
            color="#00FF00",
            user_id=user_id,
            created_at=datetime.utcnow()
        )

        # Mock the session execution to return existing tag
        mock_exec_result = Mock()
        mock_exec_result.first.return_value = existing_tag
        self.mock_session.exec.return_value = mock_exec_result

        # Act & Assert
        with pytest.raises(ValueError, match="Tag with this name already exists for the user"):
            self.tag_service.create_tag(tag_data, user_id, self.mock_session)

    def test_get_tag_by_id_success(self):
        """Test getting a tag by ID successfully."""
        # Arrange
        tag_id = 1
        user_id = 1
        mock_tag = Tag(
            id=tag_id,
            name="Test Tag",
            color="#FF0000",
            user_id=user_id,
            created_at=datetime.utcnow()
        )

        # Mock the session execution
        mock_exec_result = Mock()
        mock_exec_result.first.return_value = mock_tag
        self.mock_session.exec.return_value = mock_exec_result

        # Act
        result = self.tag_service.get_tag_by_id(tag_id, user_id, self.mock_session)

        # Assert
        assert result is not None
        assert result.id == tag_id
        assert result.name == "Test Tag"

    def test_get_tag_by_id_not_found(self):
        """Test getting a non-existent tag."""
        # Arrange
        tag_id = 999
        user_id = 1

        # Mock the session execution to return None
        mock_exec_result = Mock()
        mock_exec_result.first.return_value = None
        self.mock_session.exec.return_value = mock_exec_result

        # Act
        result = self.tag_service.get_tag_by_id(tag_id, user_id, self.mock_session)

        # Assert
        assert result is None

    def test_get_tags_success(self):
        """Test getting all tags for a user."""
        # Arrange
        user_id = 1
        mock_tags = [
            Tag(id=1, name="Tag 1", color="#FF0000", user_id=user_id, created_at=datetime.utcnow()),
            Tag(id=2, name="Tag 2", color="#00FF00", user_id=user_id, created_at=datetime.utcnow())
        ]

        # Mock the session execution
        mock_exec_result = Mock()
        mock_exec_result.all.return_value = mock_tags
        self.mock_session.exec.return_value = mock_exec_result

        # Act
        result = self.tag_service.get_tags(user_id, self.mock_session)

        # Assert
        assert len(result) == 2
        assert all(tag.user_id == user_id for tag in result)

    def test_update_tag_success(self):
        """Test successful tag update."""
        # Arrange
        tag_id = 1
        user_id = 1

        existing_tag = Tag(
            id=tag_id,
            name="Old Name",
            color="#FF0000",
            user_id=user_id,
            created_at=datetime.utcnow()
        )
        update_data = {"name": "New Name", "color": "#0000FF"}

        # Mock the session execution for getting the tag
        mock_get_tag_exec_result = Mock()
        mock_get_tag_exec_result.first.return_value = existing_tag

        mock_duplicate_check_exec_result = Mock()
        mock_duplicate_check_exec_result.first.return_value = None

        self.mock_session.exec.side_effect = [
            mock_get_tag_exec_result,
            mock_duplicate_check_exec_result,
        ]

        # Mock the session for update operations
        self.mock_session.add = Mock()
        self.mock_session.commit = Mock()
        self.mock_session.refresh = Mock()

        # Act
        result = self.tag_service.update_tag(tag_id, update_data, user_id, self.mock_session)

        # Assert
        assert result is not None
        assert result.name == "New Name"
        assert result.color == "#0000FF"

    def test_delete_tag_success(self):
        """Test successful tag deletion."""
        # Arrange
        tag_id = 1
        user_id = 1
        mock_tag = Tag(
            id=tag_id,
            name="Test Tag",
            color="#FF0000",
            user_id=user_id,
            created_at=datetime.utcnow()
        )

        # Mock the session execution for getting the tag
        mock_exec_result = Mock()
        mock_exec_result.first.return_value = mock_tag
        self.mock_session.exec.return_value = mock_exec_result

        # Mock the session for delete operations
        self.mock_session.delete = Mock()
        self.mock_session.commit = Mock()

        # Act
        result = self.tag_service.delete_tag(tag_id, user_id, self.mock_session)

        # Assert
        assert result is True
        self.mock_session.delete.assert_called_once_with(mock_tag)
        self.mock_session.commit.assert_called_once()

    def test_delete_tag_not_found(self):
        """Test deleting a non-existent tag."""
        # Arrange
        tag_id = 999
        user_id = 1

        # Mock the session execution to return None
        mock_exec_result = Mock()
        mock_exec_result.first.return_value = None
        self.mock_session.exec.return_value = mock_exec_result

        # Act
        result = self.tag_service.delete_tag(tag_id, user_id, self.mock_session)

        # Assert
        assert result is False


if __name__ == "__main__":
    pytest.main()