import pytest
import os
from fastapi.testclient import TestClient
from unittest.mock import MagicMock
from src.main import app
from src.database import get_session
from src.middleware.auth import get_current_user
from src.models.user import User
from src.models.task import Task
from src.models.tag import Tag
from src.services.auth_service import auth_service
from datetime import datetime


@pytest.fixture
def client():
    """Create a test client for the API."""
    with TestClient(app) as c:
        yield c


@pytest.fixture
def mock_session():
    """Mock database session."""
    session = MagicMock()
    yield session


def test_health_check(client):
    """Test the health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_root_endpoint(client):
    """Test the root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()


def test_create_task_endpoint(client, mock_session):
    """Test creating a task via the API endpoint."""
    # Mock the authentication
    app.dependency_overrides[get_current_user] = lambda: {"sub": "test_user_123"}

    # Mock the database session
    def mock_get_session():
        return mock_session

    # Create a mock user
    mock_user = User(id=1, clerk_user_id="test_user_123", created_at=datetime.utcnow())

    # Mock the session behavior
    mock_user_exec_result = MagicMock()
    mock_user_exec_result.first.return_value = mock_user

    mock_task_exec_result = MagicMock()
    mock_task_exec_result.first.return_value = None

    mock_session.exec.side_effect = [mock_user_exec_result, mock_task_exec_result]
    mock_session.add = MagicMock()
    mock_session.commit = MagicMock()

    # Mock task creation
    created_task = Task(
        id=1,
        title="Test Task",
        description="Test Description",
        completed=False,
        priority="MEDIUM",
        user_id=1,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    mock_session.refresh = MagicMock(side_effect=lambda obj: setattr(obj, 'id', 1) if hasattr(obj, 'title') else None)

    # Mock the dependency override
    app.dependency_overrides[get_session] = lambda: mock_session

    # Make the request
    response = client.post(
        "/api/v1/tasks",
        json={
            "title": "Test Task",
            "description": "Test Description",
            "priority": "MEDIUM"
        },
        headers={"Authorization": "Bearer fake_token"}
    )

    # Restore the dependency
    app.dependency_overrides.clear()

    # Check the response
    assert response.status_code == 201
    assert response.json()["title"] == "Test Task"


def test_get_tasks_endpoint(client, mock_session):
    """Test getting tasks via the API endpoint."""
    # Mock the authentication
    app.dependency_overrides[get_current_user] = lambda: {"sub": "test_user_123"}

    # Mock the database session
    def mock_get_session():
        return mock_session

    mock_user = User(id=1, clerk_user_id="test_user_123", created_at=datetime.utcnow())

    # Create mock tasks
    mock_tasks = [
        Task(
            id=1,
            title="Task 1",
            description="Description 1",
            completed=False,
            priority="HIGH",
            user_id=1,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
    ]

    # Mock the session behavior
    mock_user_exec_result = MagicMock()
    mock_user_exec_result.first.return_value = mock_user

    mock_tasks_exec_result = MagicMock()
    mock_tasks_exec_result.all.return_value = mock_tasks

    mock_session.exec.side_effect = [mock_user_exec_result, mock_tasks_exec_result]

    # Mock the dependency override
    app.dependency_overrides[get_session] = lambda: mock_session

    # Make the request
    response = client.get(
        "/api/v1/tasks",
        headers={"Authorization": "Bearer fake_token"}
    )

    # Restore the dependency
    app.dependency_overrides.clear()

    # Check the response
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["title"] == "Task 1"


def test_update_task_endpoint(client, mock_session):
    """Test updating a task via the API endpoint."""
    # Mock the authentication
    app.dependency_overrides[get_current_user] = lambda: {"sub": "test_user_123"}

    # Mock the database session
    def mock_get_session():
        return mock_session

    mock_user = User(id=1, clerk_user_id="test_user_123", created_at=datetime.utcnow())

    # Create a mock task
    mock_task = Task(
        id=1,
        title="Original Task",
        description="Original Description",
        completed=False,
        priority="MEDIUM",
        user_id=1,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    # Mock the session behavior
    mock_user_exec_result = MagicMock()
    mock_user_exec_result.first.return_value = mock_user

    mock_task_exec_result = MagicMock()
    mock_task_exec_result.first.return_value = mock_task

    mock_session.exec.side_effect = [mock_user_exec_result, mock_task_exec_result]
    mock_session.add = MagicMock()
    mock_session.commit = MagicMock()

    # Mock the dependency override
    app.dependency_overrides[get_session] = lambda: mock_session

    # Make the request
    response = client.put(
        "/api/v1/tasks/1",
        json={
            "title": "Updated Task",
            "description": "Updated Description"
        },
        headers={"Authorization": "Bearer fake_token"}
    )

    # Restore the dependency
    app.dependency_overrides.clear()

    # Check the response
    assert response.status_code == 200
    assert response.json()["title"] == "Updated Task"


def test_delete_task_endpoint(client, mock_session):
    """Test deleting a task via the API endpoint."""
    # Mock the authentication
    app.dependency_overrides[get_current_user] = lambda: {"sub": "test_user_123"}

    # Mock the database session
    def mock_get_session():
        return mock_session

    mock_user = User(id=1, clerk_user_id="test_user_123", created_at=datetime.utcnow())

    # Create a mock task
    mock_task = Task(
        id=1,
        title="Task to Delete",
        description="Description",
        completed=False,
        priority="MEDIUM",
        user_id=1,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    # Mock the session behavior
    mock_user_exec_result = MagicMock()
    mock_user_exec_result.first.return_value = mock_user

    mock_task_exec_result = MagicMock()
    mock_task_exec_result.first.return_value = mock_task

    mock_session.exec.side_effect = [mock_user_exec_result, mock_task_exec_result]
    mock_session.delete = MagicMock()
    mock_session.commit = MagicMock()

    # Mock the dependency override
    app.dependency_overrides[get_session] = lambda: mock_session

    # Make the request
    response = client.delete(
        "/api/v1/tasks/1",
        headers={"Authorization": "Bearer fake_token"}
    )

    # Restore the dependency
    app.dependency_overrides.clear()

    # Check the response
    assert response.status_code == 204


def test_get_current_user_info_endpoint(client, mock_session):
    """Test getting current user info via the API endpoint."""
    # Mock the authentication
    app.dependency_overrides[get_current_user] = lambda: {"sub": "test_user_123"}

    # Mock the database session
    def mock_get_session():
        return mock_session

    # Create a mock user
    mock_user = MagicMock()
    mock_user.id = 1
    mock_user.clerk_user_id = "test_user_123"
    mock_user.email = "test@example.com"
    mock_user.first_name = "Test"
    mock_user.last_name = "User"

    # Mock the session behavior
    mock_exec_result = MagicMock()
    mock_exec_result.first.return_value = mock_user

    mock_session.exec.return_value = mock_exec_result

    # Mock the dependency override
    app.dependency_overrides[get_session] = lambda: mock_session

    # Make the request
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer fake_token"}
    )

    # Restore the dependency
    app.dependency_overrides.clear()

    # Check the response
    assert response.status_code == 200
    assert response.json()["clerk_user_id"] == "test_user_123"
    assert response.json()["email"] == "test@example.com"


def test_create_tag_endpoint(client, mock_session):
    """Test creating a tag via the API endpoint."""
    # Mock the authentication
    app.dependency_overrides[get_current_user] = lambda: {"sub": "test_user_123"}

    # Mock the database session
    def mock_get_session():
        return mock_session

    # Create a mock user for the relationship check
    mock_user = User(id=1, clerk_user_id="test_user_123", created_at=datetime.utcnow())

    # Mock the session behavior
    mock_user_exec_result = MagicMock()
    mock_user_exec_result.first.return_value = mock_user  # For user existence check

    mock_tag_exists_exec_result = MagicMock()
    mock_tag_exists_exec_result.first.return_value = None

    mock_session.exec.side_effect = [mock_user_exec_result, mock_tag_exists_exec_result]
    mock_session.add = MagicMock()
    mock_session.commit = MagicMock()

    # Mock tag creation
    created_tag = Tag(
        id=1,
        name="Test Tag",
        color="#FF0000",
        priority=0,
        user_id=1,
        created_at=datetime.utcnow()
    )
    mock_session.refresh = MagicMock(side_effect=lambda obj: setattr(obj, 'id', 1) if hasattr(obj, 'name') else None)

    # Mock the dependency override
    app.dependency_overrides[get_session] = lambda: mock_session

    # Make the request
    response = client.post(
        "/api/v1/tags",
        json={
            "name": "Test Tag",
            "color": "#FF0000"
        },
        headers={"Authorization": "Bearer fake_token"}
    )

    # Restore the dependency
    app.dependency_overrides.clear()

    # Check the response
    assert response.status_code == 201
    assert response.json()["name"] == "Test Tag"


if __name__ == "__main__":
    pytest.main()