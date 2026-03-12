"""
Test Suite for MCP Server and Tools

Tests the MCP server functionality including tool execution,
resources, and prompts.
"""

import pytest
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import create_engine, Session
from sqlmodel.pool import StaticPool

from src.models.chat_models import ChatInteraction, ChatMessage
from src.models.user import User
from src.models.task import Task
from src.mcp.server import (
    mcp_server,
    get_task_manager,
    set_task_context,
    clear_task_context,
)


# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def in_memory_db():
    """Create an in-memory SQLite database for testing."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    return engine


@pytest.fixture
def db_session(in_memory_db):
    """Create a database session for testing."""
    from sqlmodel import SQLModel

    # Create all tables
    SQLModel.metadata.create_all(in_memory_db)

    with Session(in_memory_db) as session:
        yield session


@pytest.fixture
def test_user(db_session: Session):
    """Create a test user."""
    user = User(
        clerk_id="test_clerk_id_123",
        email="test@example.com",
        username="testuser",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def sample_tasks(test_user, db_session: Session):
    """Create sample tasks for testing."""
    tasks = [
        Task(
            user_id=test_user.id,
            title="Buy groceries",
            description="Milk, eggs, bread",
            priority="HIGH",
            completed=False,
        ),
        Task(
            user_id=test_user.id,
            title="Walk the dog",
            description="Morning walk",
            priority="MEDIUM",
            completed=False,
        ),
        Task(
            user_id=test_user.id,
            title="Pay bills",
            description="Electricity and water",
            priority="HIGH",
            completed=True,
        ),
    ]
    for task in tasks:
        db_session.add(task)
    db_session.commit()
    return tasks


# ============================================================================
# MCP Server Tests
# ============================================================================


class TestMCPServer:
    """Test the MCP server initialization and configuration."""

    def test_mcp_server_exists(self):
        """Test that the MCP server is initialized."""
        assert mcp_server is not None
        assert hasattr(mcp_server, 'name')

    def test_task_manager_exists(self):
        """Test that the task manager can be retrieved."""
        manager = get_task_manager()
        assert manager is not None


class TestTaskManagerContext:
    """Test the task manager context setting."""

    def test_set_and_clear_context(self, db_session: Session, test_user: User):
        """Test setting and clearing task manager context."""
        manager = get_task_manager()

        # Initially, context should be None
        assert manager._db_session is None
        assert manager._user_id is None

        # Set context
        set_task_context(db_session, test_user.id)
        assert manager._db_session is db_session
        assert manager._user_id == test_user.id

        # Clear context
        clear_task_context()
        assert manager._db_session is None
        assert manager._user_id is None


# ============================================================================
# MCP Tool Tests
# ============================================================================


class TestCreateTaskTool:
    """Test the create_task MCP tool."""

    def test_create_task_basic(self, db_session: Session, test_user: User, sample_tasks):
        """Test creating a task with basic parameters."""
        set_task_context(db_session, test_user.id)

        # Import the tool function
        from src.mcp.server import create_task

        result = create_task(title="Test Task", description="Test description")

        assert result["success"] is True
        assert result["task"]["title"] == "Test Task"
        assert result["task"]["description"] == "Test description"
        assert result["task"]["completed"] is False

        # Verify task was created in database
        tasks = db_session.query(Task).filter(Task.user_id == test_user.id).all()
        assert len(tasks) == 4  # 3 sample + 1 new

        clear_task_context()

    def test_create_task_with_priority(self, db_session: Session, test_user: User):
        """Test creating a task with priority."""
        set_task_context(db_session, test_user.id)

        from src.mcp.server import create_task

        result = create_task(title="Important Task", priority="HIGH")

        assert result["success"] is True
        assert result["task"]["priority"] == "HIGH"

        clear_task_context()

    def test_create_task_no_context(self):
        """Test creating a task without database context."""
        clear_task_context()

        from src.mcp.server import create_task

        result = create_task(title="Test Task")

        assert result["success"] is False
        assert "Database context not set" in result["error"]


class TestSearchTasksTool:
    """Test the search_tasks MCP tool."""

    def test_search_all_tasks(self, db_session: Session, test_user: User, sample_tasks):
        """Test searching for all tasks."""
        set_task_context(db_session, test_user.id)

        from src.mcp.server import search_tasks

        result = search_tasks()

        assert result["success"] is True
        assert result["count"] == 3
        assert len(result["tasks"]) == 3

        clear_task_context()

    def test_search_pending_tasks(self, db_session: Session, test_user: User, sample_tasks):
        """Test searching for pending tasks only."""
        set_task_context(db_session, test_user.id)

        from src.mcp.server import search_tasks

        result = search_tasks(completed=False)

        assert result["success"] is True
        assert result["count"] == 2
        for task in result["tasks"]:
            assert task["completed"] is False

        clear_task_context()

    def test_search_with_term(self, db_session: Session, test_user: User, sample_tasks):
        """Test searching with a search term."""
        set_task_context(db_session, test_user.id)

        from src.mcp.server import search_tasks

        result = search_tasks(search="groceries")

        assert result["success"] is True
        assert result["count"] == 1
        assert result["tasks"][0]["title"] == "Buy groceries"

        clear_task_context()


class TestToggleTaskCompletionTool:
    """Test the toggle_task_completion MCP tool."""

    def test_toggle_to_completed(self, db_session: Session, test_user: User, sample_tasks):
        """Test toggling a task to completed."""
        set_task_context(db_session, test_user.id)

        from src.mcp.server import toggle_task_completion

        # Get first pending task
        pending_task = [t for t in sample_tasks if not t.completed][0]

        result = toggle_task_completion(task_id=pending_task.id)

        assert result["success"] is True
        assert result["task"]["completed"] is True
        assert "completed" in result["message"].lower()

        clear_task_context()

    def test_toggle_to_incomplete(self, db_session: Session, test_user: User, sample_tasks):
        """Test toggling a completed task to incomplete."""
        set_task_context(db_session, test_user.id)

        from src.mcp.server import toggle_task_completion

        # Get completed task
        completed_task = [t for t in sample_tasks if t.completed][0]

        result = toggle_task_completion(task_id=completed_task.id)

        assert result["success"] is True
        assert result["task"]["completed"] is False

        clear_task_context()


class TestDeleteTaskTool:
    """Test the delete_task MCP tool."""

    def test_delete_task(self, db_session: Session, test_user: User, sample_tasks):
        """Test deleting a task."""
        set_task_context(db_session, test_user.id)

        from src.mcp.server import delete_task

        task_to_delete = sample_tasks[0]
        result = delete_task(task_id=task_to_delete.id)

        assert result["success"] is True
        assert "deleted" in result["message"].lower()

        # Verify task was deleted
        remaining = db_session.query(Task).filter(Task.user_id == test_user.id).all()
        assert len(remaining) == 2

        clear_task_context()

    def test_delete_nonexistent_task(self, db_session: Session, test_user: User, sample_tasks):
        """Test deleting a task that doesn't exist."""
        set_task_context(db_session, test_user.id)

        from src.mcp.server import delete_task

        result = delete_task(task_id=99999)

        assert result["success"] is False
        assert "not found" in result["message"].lower()

        clear_task_context()


class TestUpdateTaskTool:
    """Test the update_task MCP tool."""

    def test_update_task_title(self, db_session: Session, test_user: User, sample_tasks):
        """Test updating a task's title."""
        set_task_context(db_session, test_user.id)

        from src.mcp.server import update_task

        task = sample_tasks[0]
        result = update_task(task_id=task.id, title="Updated Title")

        assert result["success"] is True
        assert result["task"]["title"] == "Updated Title"

        # Refresh from database
        db_session.refresh(task)
        assert task.title == "Updated Title"

        clear_task_context()

    def test_update_task_completion(self, db_session: Session, test_user: User, sample_tasks):
        """Test marking a task as complete via update."""
        set_task_context(db_session, test_user.id)

        from src.mcp.server import update_task

        task = sample_tasks[0]
        result = update_task(task_id=task.id, completed=True)

        assert result["success"] is True
        assert result["task"]["completed"] is True

        clear_task_context()


class TestGetTaskTool:
    """Test the get_task MCP tool."""

    def test_get_task_by_id(self, db_session: Session, test_user: User, sample_tasks):
        """Test retrieving a specific task."""
        set_task_context(db_session, test_user.id)

        from src.mcp.server import get_task

        task = sample_tasks[0]
        result = get_task(task_id=task.id)

        assert result["success"] is True
        assert result["task"]["id"] == task.id
        assert result["task"]["title"] == task.title

        clear_task_context()

    def test_get_nonexistent_task(self, db_session: Session, test_user: User, sample_tasks):
        """Test retrieving a task that doesn't exist."""
        set_task_context(db_session, test_user.id)

        from src.mcp.server import get_task

        result = get_task(task_id=99999)

        assert result["success"] is False
        assert "not found" in result["message"].lower()

        clear_task_context()


class TestListTodayTasksTool:
    """Test the list_today_tasks MCP tool."""

    def test_list_today_tasks_empty(self, db_session: Session, test_user: User):
        """Test listing today's tasks when none are due."""
        set_task_context(db_session, test_user.id)

        from src.mcp.server import list_today_tasks

        result = list_today_tasks()

        assert result["success"] is True
        assert result["count"] == 0
        assert result["tasks"] == []

        clear_task_context()


# ============================================================================
# Integration Tests
# ============================================================================


class TestMCPEndToEnd:
    """End-to-end tests for MCP tool workflows."""

    def test_complete_task_workflow(self, db_session: Session, test_user: User):
        """Test a complete workflow: create, search, update, complete, delete."""
        from src.mcp.server import create_task, search_tasks, update_task, toggle_task_completion, delete_task

        # Create a task
        set_task_context(db_session, test_user.id)
        create_result = create_task(title="Workflow Test Task", priority="HIGH")
        assert create_result["success"] is True
        task_id = create_result["task"]["id"]

        # Search for the task
        search_result = search_tasks(search="Workflow")
        assert search_result["success"] is True
        assert search_result["count"] == 1

        # Update the task
        update_result = update_task(task_id=task_id, description="Updated description")
        assert update_result["success"] is True

        # Complete the task
        toggle_result = toggle_task_completion(task_id=task_id)
        assert toggle_result["success"] is True
        assert toggle_result["task"]["completed"] is True

        # Delete the task
        delete_result = delete_task(task_id=task_id)
        assert delete_result["success"] is True

        # Verify it's gone
        final_search = search_tasks(search="Workflow")
        assert final_search["count"] == 0

        clear_task_context()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
