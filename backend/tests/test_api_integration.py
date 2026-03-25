import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi.testclient import TestClient

from src.database import get_session
from src.main import app
from src.middleware.auth import get_current_user
from src.models.auth_identity import AuthIdentity
from src.models.tag import Tag
from src.models.task import Task
from src.models.user import User


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def mock_session():
    session = MagicMock()
    yield session


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert response.json()["service"] == "TODO API"


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()


def test_create_task_endpoint(client, mock_session):
    app.dependency_overrides[get_current_user] = lambda: {"sub": "test_user_123", "provider": "google"}
    app.dependency_overrides[get_session] = lambda: mock_session

    mock_user = User(id=1, clerk_user_id="google:test_user_123", created_at=datetime.utcnow())
    mock_session.exec.return_value.all.return_value = []
    mock_session.refresh = MagicMock(side_effect=lambda obj: setattr(obj, "id", 1) if hasattr(obj, "title") else None)

    with patch("src.api.task_router.auth_service.get_or_create_user_from_auth_payload", new=AsyncMock(return_value=mock_user)):
        response = client.post(
            "/api/v1/tasks",
            json={
                "title": "Test Task",
                "description": "Test Description",
                "priority": "MEDIUM",
            },
            headers={"Authorization": "Bearer fake_token"},
        )

    app.dependency_overrides.clear()
    assert response.status_code == 201
    assert response.json()["title"] == "Test Task"


def test_get_tasks_endpoint(client, mock_session):
    app.dependency_overrides[get_current_user] = lambda: {"sub": "test_user_123", "provider": "google"}
    app.dependency_overrides[get_session] = lambda: mock_session

    mock_user = User(id=1, clerk_user_id="google:test_user_123", created_at=datetime.utcnow())
    mock_tasks = [
        Task(
            id=1,
            title="Task 1",
            description="Description 1",
            completed=False,
            priority="HIGH",
            user_id=1,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
    ]

    mock_session.exec.return_value.all.return_value = mock_tasks

    with patch("src.api.task_router.auth_service.get_or_create_user_from_auth_payload", new=AsyncMock(return_value=mock_user)):
        response = client.get("/api/v1/tasks", headers={"Authorization": "Bearer fake_token"})

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["title"] == "Task 1"


def test_update_task_endpoint(client, mock_session):
    app.dependency_overrides[get_current_user] = lambda: {"sub": "test_user_123", "provider": "google"}
    app.dependency_overrides[get_session] = lambda: mock_session

    mock_user = User(id=1, clerk_user_id="google:test_user_123", created_at=datetime.utcnow())
    mock_task = Task(
        id=1,
        title="Original Task",
        description="Original Description",
        completed=False,
        priority="MEDIUM",
        user_id=1,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    first_exec = MagicMock()
    first_exec.first.return_value = mock_task
    mock_session.exec.return_value = first_exec

    with patch("src.api.task_router.auth_service.get_or_create_user_from_auth_payload", new=AsyncMock(return_value=mock_user)):
        response = client.put(
            "/api/v1/tasks/1",
            json={"title": "Updated Task", "description": "Updated Description"},
            headers={"Authorization": "Bearer fake_token"},
        )

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["title"] == "Updated Task"


def test_delete_task_endpoint(client, mock_session):
    app.dependency_overrides[get_current_user] = lambda: {"sub": "test_user_123", "provider": "google"}
    app.dependency_overrides[get_session] = lambda: mock_session

    mock_user = User(id=1, clerk_user_id="google:test_user_123", created_at=datetime.utcnow())
    mock_task = Task(
        id=1,
        title="Task to Delete",
        description="Description",
        completed=False,
        priority="MEDIUM",
        user_id=1,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    first_exec = MagicMock()
    first_exec.first.return_value = mock_task
    mock_session.exec.return_value = first_exec

    with patch("src.api.task_router.auth_service.get_or_create_user_from_auth_payload", new=AsyncMock(return_value=mock_user)):
        response = client.delete("/api/v1/tasks/1", headers={"Authorization": "Bearer fake_token"})

    app.dependency_overrides.clear()
    assert response.status_code == 204


def test_get_current_user_info_endpoint(client, mock_session):
    app.dependency_overrides[get_current_user] = lambda: {"sub": "test_user_123", "provider": "google", "email": "test@example.com"}
    app.dependency_overrides[get_session] = lambda: mock_session

    mock_user = User(id=1, clerk_user_id="google:test_user_123", created_at=datetime.utcnow())
    mock_identity = AuthIdentity(
        id=1,
        user_id=1,
        provider="google",
        provider_subject="test_user_123",
        email="test@example.com",
        email_verified=True,
        first_name="Test",
        last_name="User",
    )

    with patch("src.api.auth_router.auth_service.get_or_create_user_from_auth_payload", new=AsyncMock(return_value=mock_user)), patch(
        "src.api.auth_router.auth_service.get_identity_by_auth_payload", return_value=mock_identity
    ):
        response = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer fake_token"})

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["auth_subject"] == "test_user_123"
    assert response.json()["provider"] == "google"
    assert response.json()["email"] == "test@example.com"


def test_create_tag_endpoint(client, mock_session):
    app.dependency_overrides[get_current_user] = lambda: {"sub": "test_user_123", "provider": "google"}
    app.dependency_overrides[get_session] = lambda: mock_session

    mock_user = User(id=1, clerk_user_id="google:test_user_123", created_at=datetime.utcnow())
    mock_session.exec.return_value.first.return_value = None
    mock_session.refresh = MagicMock(side_effect=lambda obj: setattr(obj, "id", 1) if hasattr(obj, "name") else None)

    with patch("src.api.tag_router.auth_service.get_or_create_user_from_auth_payload", new=AsyncMock(return_value=mock_user)):
        response = client.post(
            "/api/v1/tags",
            json={"name": "Test Tag", "color": "#FF0000"},
            headers={"Authorization": "Bearer fake_token"},
        )

    app.dependency_overrides.clear()
    assert response.status_code == 201
    assert response.json()["name"] == "Test Tag"


if __name__ == "__main__":
    pytest.main()
