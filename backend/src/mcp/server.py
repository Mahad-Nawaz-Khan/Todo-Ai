"""
MCP Server for Task Management using FastMCP

This module creates a Model Context Protocol server that exposes
task management tools to AI agents using the official MCP Python SDK.
"""

from mcp.server.fastmcp import FastMCP
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Create the MCP server instance
mcp_server = FastMCP(
    "Task Management Service",
    instructions="AI assistant for managing tasks. You can create, read, update, delete, and search tasks.",
)


class TaskManager:
    """
    Manager class that interfaces with the database for task operations.
    This will be injected with database session at runtime.
    """

    def __init__(self):
        self._db_session = None
        self._user_id = None

    def set_context(self, db_session, user_id: int):
        """Set the database session and user ID for operations."""
        self._db_session = db_session
        self._user_id = user_id

    def clear_context(self):
        """Clear the database context."""
        self._db_session = None
        self._user_id = None

    @property
    def task_service(self):
        """Lazy import of task service to avoid circular imports."""
        from ..services.task_service import task_service
        return task_service


# Global task manager instance
_task_manager = TaskManager()


def get_task_manager() -> TaskManager:
    """Get the global task manager instance."""
    return _task_manager


def set_task_context(db_session, user_id: int):
    """Set the task manager context for the current request."""
    _task_manager.set_context(db_session, user_id)


def clear_task_context():
    """Clear the task manager context."""
    _task_manager.clear_context()


# ============================================================================
# MCP Tool Definitions
# ============================================================================


@mcp_server.tool()
def create_task(title: str, description: Optional[str] = None,
                priority: Optional[str] = None,
                due_date: Optional[str] = None):
    """
    Create a new task for the user.

    Args:
        title: The task title (required)
        description: Optional task description
        priority: Optional priority level (HIGH, MEDIUM, LOW)
        due_date: Optional due date in ISO format (YYYY-MM-DD)

    Returns:
        Dictionary with created task information
    """
    try:
        manager = get_task_manager()
        if not manager._db_session or not manager._user_id:
            return {
                "success": False,
                "error": "Database context not set",
                "message": "Internal server error"
            }

        from ..schemas.task import TaskCreateRequest

        # Build task data
        task_data = TaskCreateRequest(
            title=title,
            description=description,
            priority=priority,
            due_date=None
        )

        # Parse due_date if provided
        if due_date:
            try:
                task_data.due_date = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
            except ValueError:
                logger.warning(f"Failed to parse due_date: {due_date}")

        # Create task using task service
        task = manager.task_service.create_task(
            task_data,
            manager._user_id,
            manager._db_session
        )

        logger.info(f"Created task {task.id} for user {manager._user_id}")

        return {
            "success": True,
            "task": {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "completed": task.completed,
                "priority": task.priority,
                "due_date": task.due_date.isoformat() if task.due_date else None,
                "created_at": task.created_at.isoformat()
            },
            "message": f"Task '{task.title}' created successfully!"
        }
    except Exception as e:
        logger.error(f"Error creating task: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to create task. Please check your input."
        }


@mcp_server.tool()
def update_task(task_id: int,
                title: Optional[str] = None,
                description: Optional[str] = None,
                priority: Optional[str] = None,
                due_date: Optional[str] = None,
                completed: Optional[bool] = None):
    """
    Update an existing task.

    Args:
        task_id: The ID of the task to update (required)
        title: New task title
        description: New task description
        completed: Mark task as completed/uncompleted
        priority: New priority level (HIGH, MEDIUM, LOW)
        due_date: Due date in ISO format (YYYY-MM-DD)

    Returns:
        Dictionary with updated task information
    """
    try:
        manager = get_task_manager()
        if not manager._db_session or not manager._user_id:
            return {
                "success": False,
                "error": "Database context not set",
                "message": "Internal server error"
            }

        from ..schemas.task import TaskUpdateRequest

        # Get current task first
        current_task = manager.task_service.get_task_by_id(
            task_id, manager._user_id, manager._db_session
        )
        if not current_task:
            return {
                "success": False,
                "error": "Task not found",
                "message": "Could not find the task to update."
            }

        # Build update data
        update_data = {}
        if title is not None:
            update_data["title"] = title
        if description is not None:
            update_data["description"] = description
        if completed is not None:
            update_data["completed"] = completed
        if priority is not None:
            update_data["priority"] = priority

        # Create update request
        task_update = TaskUpdateRequest(**update_data)

        # Update task
        updated_task = manager.task_service.update_task(
            task_id,
            task_update,
            manager._user_id,
            manager._db_session
        )

        logger.info(f"Updated task {task_id} for user {manager._user_id}")

        return {
            "success": True,
            "task": {
                "id": updated_task.id,
                "title": updated_task.title,
                "description": updated_task.description,
                "completed": updated_task.completed,
                "priority": updated_task.priority,
                "due_date": updated_task.due_date.isoformat() if updated_task.due_date else None,
                "updated_at": updated_task.updated_at.isoformat()
            },
            "message": f"Task '{updated_task.title}' updated successfully!"
        }
    except Exception as e:
        logger.error(f"Error updating task: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to update task. Please check your input."
        }


@mcp_server.tool()
def toggle_task_completion(task_id: int):
    """
    Toggle the completion status of a task.

    Args:
        task_id: The ID of the task to toggle

    Returns:
        Dictionary with updated task information
    """
    try:
        manager = get_task_manager()
        if not manager._db_session or not manager._user_id:
            return {
                "success": False,
                "error": "Database context not set",
                "message": "Internal server error"
            }

        task = manager.task_service.toggle_task_completion(
            task_id, manager._user_id, manager._db_session
        )

        status = "completed" if task.completed else "not completed"
        logger.info(f"Toggled task {task_id} completion to {status} for user {manager._user_id}")

        return {
            "success": True,
            "task": {
                "id": task.id,
                "title": task.title,
                "completed": task.completed,
            },
            "message": f"Task '{task.title}' is now {status}!"
        }
    except Exception as e:
        logger.error(f"Error toggling task completion: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to update task status."
        }


@mcp_server.tool()
def delete_task(task_id: int):
    """
    Delete a task.

    Args:
        task_id: The ID of the task to delete

    Returns:
        Dictionary with deletion result
    """
    try:
        manager = get_task_manager()
        if not manager._db_session or not manager._user_id:
            return {
                "success": False,
                "error": "Database context not set",
                "message": "Internal server error"
            }

        # Get task first for confirmation message
        task = manager.task_service.get_task_by_id(
            task_id, manager._user_id, manager._db_session
        )
        if not task:
            return {
                "success": False,
                "error": "Task not found",
                "message": "Could not find the task to delete."
            }

        # Delete task
        success = manager.task_service.delete_task(
            task_id, manager._user_id, manager._db_session
        )

        if success:
            logger.info(f"Deleted task {task_id} for user {manager._user_id}")
            return {
                "success": True,
                "message": f"Task '{task.title}' deleted successfully!"
            }
        else:
            return {
                "success": False,
                "error": "Failed to delete task",
                "message": "Could not delete the task."
            }
    except Exception as e:
        logger.error(f"Error deleting task: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to delete task."
        }


@mcp_server.tool()
def search_tasks(search: Optional[str] = None,
                 completed: Optional[bool] = None,
                 priority: Optional[str] = None,
                 limit: int = 10):
    """
    Search for tasks based on criteria.

    Args:
        search: Optional search term to match in title/description
        completed: Filter by completion status (true/false)
        priority: Filter by priority level (HIGH, MEDIUM, LOW)
        limit: Maximum number of results to return (default: 10)

    Returns:
        Dictionary with search results
    """
    try:
        manager = get_task_manager()
        if not manager._db_session or not manager._user_id:
            return {
                "success": False,
                "error": "Database context not set",
                "message": "Internal server error"
            }

        # Search tasks using task service
        tasks = manager.task_service.get_tasks(
            user_id=manager._user_id,
            db_session=manager._db_session,
            search=search,
            completed=completed,
            priority=priority,
            limit=limit
        )

        # Format results
        task_list = []
        for task in tasks:
            task_list.append({
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "completed": task.completed,
                "priority": task.priority,
                "due_date": task.due_date.isoformat() if task.due_date else None,
            })

        logger.info(f"Searched tasks for user {manager._user_id}, found {len(task_list)} results")

        return {
            "success": True,
            "tasks": task_list,
            "count": len(task_list),
            "message": f"Found {len(task_list)} task(s)."
        }
    except Exception as e:
        logger.error(f"Error searching tasks: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to search tasks."
        }


@mcp_server.tool()
def list_today_tasks():
    """
    List all tasks due today.

    Returns:
        Dictionary with today's tasks
    """
    try:
        manager = get_task_manager()
        if not manager._db_session or not manager._user_id:
            return {
                "success": False,
                "error": "Database context not set",
                "message": "Internal server error"
            }

        today = datetime.now().strftime("%Y-%m-%d")

        tasks = manager.task_service.get_tasks(
            user_id=manager._user_id,
            db_session=manager._db_session,
            completed=False,
            sort_by="priority",
            order="desc",
            limit=50
        )

        # Filter tasks due today
        today_tasks = []
        for task in tasks:
            if task.due_date and task.due_date.strftime("%Y-%m-%d") == today:
                today_tasks.append({
                    "id": task.id,
                    "title": task.title,
                    "description": task.description,
                    "priority": task.priority,
                    "due_date": task.due_date.isoformat(),
                })

        logger.info(f"Listed {len(today_tasks)} tasks for today for user {manager._user_id}")

        return {
            "success": True,
            "tasks": today_tasks,
            "count": len(today_tasks),
            "message": f"You have {len(today_tasks)} task(s) due today."
        }
    except Exception as e:
        logger.error(f"Error listing today's tasks: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to retrieve today's tasks."
        }


@mcp_server.tool()
def get_task(task_id: int):
    """
    Get a specific task by ID.

    Args:
        task_id: The ID of the task to retrieve

    Returns:
        Dictionary with task information
    """
    try:
        manager = get_task_manager()
        if not manager._db_session or not manager._user_id:
            return {
                "success": False,
                "error": "Database context not set",
                "message": "Internal server error"
            }

        task = manager.task_service.get_task_by_id(
            task_id, manager._user_id, manager._db_session
        )

        if not task:
            return {
                "success": False,
                "error": "Task not found",
                "message": "Could not find the specified task."
            }

        return {
            "success": True,
            "task": {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "completed": task.completed,
                "priority": task.priority,
                "due_date": task.due_date.isoformat() if task.due_date else None,
                "created_at": task.created_at.isoformat(),
                "updated_at": task.updated_at.isoformat(),
            },
            "message": f"Found task: {task.title}"
        }
    except Exception as e:
        logger.error(f"Error getting task: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to retrieve task."
        }


# ============================================================================
# MCP Resources (Optional - for exposing data)
# ============================================================================


@mcp_server.resource("tasks://pending")
def get_pending_tasks() -> str:
    """
    Resource that exposes pending tasks as structured data.
    """
    manager = get_task_manager()
    if not manager._db_session or not manager._user_id:
        return "[]"

    tasks = manager.task_service.get_tasks(
        user_id=manager._user_id,
        db_session=manager._db_session,
        completed=False,
        limit=20
    )

    import json
    task_list = []
    for task in tasks:
        task_list.append({
            "id": task.id,
            "title": task.title,
            "priority": task.priority,
            "due_date": task.due_date.isoformat() if task.due_date else None,
        })

    return json.dumps(task_list, indent=2)


@mcp_server.resource("tasks://summary")
def get_tasks_summary() -> str:
    """
    Resource that provides a summary of all tasks.
    """
    manager = get_task_manager()
    if not manager._db_session or not manager._user_id:
        return json.dumps({"error": "No context"})

    all_tasks = manager.task_service.get_tasks(
        user_id=manager._user_id,
        db_session=manager._db_session,
        limit=1000
    )

    total = len(all_tasks)
    completed = sum(1 for t in all_tasks if t.completed)
    pending = total - completed

    high_priority = sum(1 for t in all_tasks if t.priority == "HIGH" and not t.completed)
    overdue = 0
    today = datetime.now().date()
    for t in all_tasks:
        if t.due_date and t.due_date.date() < today and not t.completed:
            overdue += 1

    import json
    return json.dumps({
        "total": total,
        "completed": completed,
        "pending": pending,
        "high_priority": high_priority,
        "overdue": overdue
    }, indent=2)


# ============================================================================
# MCP Prompts (Optional - for predefined prompt templates)
# ============================================================================


@mcp_server.prompt()
def task_review() -> str:
    """
    Generate a prompt for reviewing the user's tasks.
    """
    manager = get_task_manager()
    if not manager._db_session or not manager._user_id:
        return "Unable to retrieve tasks."

    tasks = manager.task_service.get_tasks(
        user_id=manager._user_id,
        db_session=manager._db_session,
        completed=False,
        limit=10
    )

    if not tasks:
        return "You have no pending tasks. Great job!"

    prompt = "Here are your pending tasks:\n\n"
    for task in tasks:
        status = "[HIGH]" if task.priority == "HIGH" else "[MED]" if task.priority == "MEDIUM" else "[LOW]"
        prompt += f"{status} {task.title}"
        if task.due_date:
            prompt += f" (Due: {task.due_date.strftime('%Y-%m-%d')})"
        prompt += "\n"

    prompt += "\nWhat would you like to do with these tasks?"
    return prompt


@mcp_server.prompt()
def daily_plan() -> str:
    """
    Generate a daily planning prompt.
    """
    manager = get_task_manager()
    if not manager._db_session or not manager._user_id:
        return "Unable to retrieve tasks."

    today = datetime.now().strftime("%Y-%m-%d")

    tasks = manager.task_service.get_tasks(
        user_id=manager._user_id,
        db_session=manager._db_session,
        completed=False,
        limit=50
    )

    today_tasks = []
    other_tasks = []

    for task in tasks:
        if task.due_date and task.due_date.strftime("%Y-%m-%d") == today:
            today_tasks.append(task)
        else:
            other_tasks.append(task)

    prompt = f"📅 Daily Plan for {today}\n\n"

    if today_tasks:
        prompt += "Today's Tasks:\n"
        for task in today_tasks:
            status = "🔴" if task.priority == "HIGH" else "🟡" if task.priority == "MEDIUM" else "🟢"
            prompt += f"{status} {task.title}\n"
        prompt += "\n"

    if other_tasks:
        prompt += "Other Pending Tasks:\n"
        for task in other_tasks[:5]:
            prompt += f"• {task.title}\n"

    return prompt


# For running the MCP server standalone (if needed)
if __name__ == "__main__":
    import sys
    import os

    # Add parent directory to path for imports
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

    # For standalone mode, we'd need to set up database connection
    # This is primarily for testing
    print("MCP Server for Task Management")
    print("This server should be integrated into the FastAPI application.")
    print("Use the streamable-http transport for production deployment.")
