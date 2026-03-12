import pytest
from unittest.mock import Mock, patch, MagicMock
from sqlmodel import Session, select
from datetime import datetime
from src.models.task import Task
from src.schemas.task import PriorityEnum, TaskCreateRequest, TaskUpdateRequest
from src.services.task_service import TaskService


class TestTaskService:
    def setup_method(self):
        """Set up test fixtures before each test method."""
        self.task_service = TaskService()
        self.mock_session = Mock(spec=Session)

    def test_create_task_success(self):
        """Test successful task creation."""
        # Arrange
        user_id = 1
        task_data = TaskCreateRequest(
            title="Test Task",
            description="Test Description",
            priority=PriorityEnum.MEDIUM
        )

        # Mock the database session behavior
        mock_task = Task(
            id=1,
            title="Test Task",
            description="Test Description",
            priority="MEDIUM",
            user_id=user_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        self.mock_session.add = Mock()
        self.mock_session.commit = Mock()
        self.mock_session.refresh = Mock(return_value=mock_task)

        # Act
        with patch.object(self.mock_session, 'add'), \
             patch.object(self.mock_session, 'commit'), \
             patch.object(self.mock_session, 'refresh', side_effect=lambda obj: setattr(obj, 'id', 1)):
            result = self.task_service.create_task(task_data, user_id, self.mock_session)

        # Assert
        assert result is not None
        assert result.title == "Test Task"
        assert result.description == "Test Description"

    def test_create_task_missing_title(self):
        """Test task creation with missing title."""
        # Arrange
        user_id = 1
        task_data = TaskCreateRequest(
            title="",  # Empty title
            description="Test Description",
            priority=PriorityEnum.MEDIUM
        )

        # Act & Assert
        with pytest.raises(ValueError, match="Task title is required"):
            self.task_service.create_task(task_data, user_id, self.mock_session)

    def test_get_task_by_id_success(self):
        """Test getting a task by ID successfully."""
        # Arrange
        task_id = 1
        user_id = 1
        mock_task = Task(
            id=task_id,
            title="Test Task",
            user_id=user_id
        )

        # Mock the session execution
        mock_exec_result = Mock()
        mock_exec_result.first.return_value = mock_task
        self.mock_session.exec.return_value = mock_exec_result

        # Act
        result = self.task_service.get_task_by_id(task_id, user_id, self.mock_session)

        # Assert
        assert result is not None
        assert result.id == task_id
        assert result.title == "Test Task"

    def test_get_task_by_id_not_found(self):
        """Test getting a non-existent task."""
        # Arrange
        task_id = 999
        user_id = 1

        # Mock the session execution to return None
        mock_exec_result = Mock()
        mock_exec_result.first.return_value = None
        self.mock_session.exec.return_value = mock_exec_result

        # Act
        result = self.task_service.get_task_by_id(task_id, user_id, self.mock_session)

        # Assert
        assert result is None

    def test_update_task_success(self):
        """Test successful task update."""
        # Arrange
        task_id = 1
        user_id = 1
        existing_task = Task(
            id=task_id,
            title="Old Title",
            description="Old Description",
            user_id=user_id
        )

        update_data = TaskUpdateRequest(
            title="Updated Title",
            description="Updated Description"
        )

        # Mock the session execution for getting the task
        mock_exec_result = Mock()
        mock_exec_result.first.return_value = existing_task
        self.mock_session.exec.return_value = mock_exec_result

        # Mock the session for update operations
        self.mock_session.add = Mock()
        self.mock_session.commit = Mock()
        self.mock_session.refresh = Mock()

        # Act
        result = self.task_service.update_task(task_id, update_data, user_id, self.mock_session)

        # Assert
        assert result is not None
        assert result.title == "Updated Title"
        assert result.description == "Updated Description"

    def test_delete_task_success(self):
        """Test successful task deletion."""
        # Arrange
        task_id = 1
        user_id = 1
        mock_task = Task(
            id=task_id,
            title="Test Task",
            user_id=user_id
        )

        # Mock the session execution for getting the task
        mock_exec_result = Mock()
        mock_exec_result.first.return_value = mock_task
        self.mock_session.exec.return_value = mock_exec_result

        # Mock the session for delete operations
        self.mock_session.delete = Mock()
        self.mock_session.commit = Mock()

        # Act
        result = self.task_service.delete_task(task_id, user_id, self.mock_session)

        # Assert
        assert result is True
        self.mock_session.delete.assert_called_once_with(mock_task)
        self.mock_session.commit.assert_called_once()

    def test_delete_task_not_found(self):
        """Test deleting a non-existent task."""
        # Arrange
        task_id = 999
        user_id = 1

        # Mock the session execution to return None
        mock_exec_result = Mock()
        mock_exec_result.first.return_value = None
        self.mock_session.exec.return_value = mock_exec_result

        # Act
        result = self.task_service.delete_task(task_id, user_id, self.mock_session)

        # Assert
        assert result is False


if __name__ == "__main__":
    pytest.main()