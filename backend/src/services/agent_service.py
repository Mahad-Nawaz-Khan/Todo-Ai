"""
OpenAI Agents SDK Integration Service

This service integrates the OpenAI Agents SDK for processing user messages
and managing task operations through natural language.

Uses Z.ai API via OpenAI-compatible endpoint.

Context is passed via global context to tools for database access.
"""

import logging
import os
import asyncio
import re
from typing import Dict, Any, Optional, List, AsyncIterator
from datetime import datetime, timedelta
from dataclasses import dataclass

from sqlmodel import Session, select

from ..models.chat_models import (
    IntentDetectionResult,
    IntentTypeEnum,
)


logger = logging.getLogger(__name__)


# ============================================================================
# Context Type for Tools
# ============================================================================

@dataclass
class ToolContext:
    """Context object passed to tools containing database session and user info."""
    db_session: Session
    user_id: int


# Global context (set during each agent run)
_tool_context: Optional[ToolContext] = None

# Track if any tool operation was performed during the current request
_operation_performed: Optional[Dict[str, Any]] = None


def _set_tool_context(db_session: Session, user_id: int):
    """Set the global tool context for the current request."""
    global _tool_context, _operation_performed
    _tool_context = ToolContext(db_session=db_session, user_id=user_id)
    _operation_performed = None  # Reset operations tracker


def _clear_tool_context():
    """Clear the global tool context."""
    global _tool_context, _operation_performed
    _tool_context = None
    _operation_performed = None


def _get_task_service():
    """Lazy import of task service to avoid circular imports."""
    from ..services.task_service import task_service
    return task_service


def _get_tag_service():
    """Lazy import of tag service to avoid circular imports."""
    from ..services.tag_service import tag_service
    return tag_service


def _mark_operation_performed(op_type: str, details: Optional[Dict[str, Any]] = None):
    """Mark that an operation was performed by a tool."""
    global _operation_performed
    _operation_performed = {"type": op_type}
    if details:
        _operation_performed.update(details)


def _get_operation_performed() -> Optional[Dict[str, Any]]:
    """Get the operation that was performed and reset the tracker."""
    global _operation_performed
    op = _operation_performed
    return op


# ============================================================================
# Function Tool Implementations
# ============================================================================

def agent_create_task(
    title: str,
    description: str = "",
    priority: str = "MEDIUM",
    due_date: str = "",
    recurrence: str = "",
    tags: str = ""
) -> str:
    """
    Create a new task or update existing task with same title.

    Args:
        title: The task title (required)
        description: Optional task description
        priority: Priority level (HIGH, MEDIUM, LOW) - default is MEDIUM
        due_date: Due date as relative text like 'tomorrow', 'next week', 'in 3 days' OR YYYY-MM-DD format
        recurrence: Recurrence rule - daily, weekly, monthly, or 'every X days/weeks'
        tags: Comma-separated tag names to attach (e.g., 'work, urgent')

    Returns:
        A message describing the result
    """
    global _tool_context
    if not _tool_context:
        return "I'm sorry, I couldn't create the task due to a server error."

    try:
        from ..schemas.task import TaskCreateRequest, TaskUpdateRequest
        from ..models.task import Task as TaskModel
        task_service = _get_task_service()

        # Check if task with same title already exists
        existing_tasks = _tool_context.db_session.exec(
            select(TaskModel).where(
                (TaskModel.user_id == _tool_context.user_id) &
                (TaskModel.title == title)
            )
        ).all()

        # Parse due date - handle relative dates
        parsed_due_date = None
        if due_date:
            parsed_due_date = _parse_relative_date(due_date)

        # Parse recurrence
        parsed_recurrence = None
        if recurrence:
            parsed_recurrence = _parse_recurrence(recurrence)

        # Find or resolve tag IDs
        tag_ids = _resolve_tags(tags) if tags else []

        if existing_tasks:
            # Update existing task instead of creating duplicate
            task = existing_tasks[0]
            update_data = {}

            if description and description != (task.description or ""):
                update_data["description"] = description

            if priority and priority != (task.priority or "MEDIUM"):
                update_data["priority"] = priority

            if parsed_due_date and parsed_due_date != (task.due_date):
                update_data["due_date"] = parsed_due_date

            if parsed_recurrence and parsed_recurrence != (task.recurrence_rule):
                update_data["recurrence_rule"] = parsed_recurrence

            if tag_ids:
                update_data["tag_ids"] = tag_ids

            if update_data:
                task_update = TaskUpdateRequest(**update_data)
                updated_task = task_service.update_task(
                    task.id, task_update, _tool_context.user_id, _tool_context.db_session
                )
                logger.info(f"Updated existing task {task.id} instead of creating duplicate")
                _mark_operation_performed("update_task", {"task_id": task.id})
                return f"✓ Updated existing task '{task.title}' instead of creating duplicate!"
            else:
                return f"Task '{title}' already exists with the same details."
        else:
            # Create new task
            task_data = TaskCreateRequest(
                title=title,
                description=description if description else None,
                priority=priority if priority else "MEDIUM",
                due_date=parsed_due_date,
                recurrence_rule=parsed_recurrence,
                tag_ids=tag_ids if tag_ids else None
            )

            task = task_service.create_task(
                task_data,
                _tool_context.user_id,
                _tool_context.db_session
            )

            logger.info(f"Created task {task.id} for user {_tool_context.user_id}")
            _mark_operation_performed("create_task", {"task_id": task.id})

            result = f"✓ Task '{task.title}' created!"
            if parsed_due_date:
                result += f" Due: {parsed_due_date.strftime('%Y-%m-%d')}"
            if parsed_recurrence:
                result += f" Recurs: {parsed_recurrence}"
            if tag_ids:
                result += f" Tags added."
            return result

    except Exception as e:
        logger.error(f"Error creating task: {str(e)}")
        return f"Sorry, I couldn't create that task. Error: {str(e)}"


def _parse_relative_date(date_str: str) -> Optional[datetime]:
    """Parse relative date strings like 'tomorrow', 'next week', 'in 3 days'."""
    if not date_str:
        return None

    date_str = date_str.strip().lower()

    # Try YYYY-MM-DD format first
    try:
        return datetime.fromisoformat(date_str)
    except:
        pass

    from datetime import timedelta

    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    # Relative date mappings
    if date_str == "today":
        return today
    elif date_str == "tomorrow":
        return today + timedelta(days=1)
    elif date_str == "yesterday":
        return today - timedelta(days=1)

    # "in X days" or "X days from now"
    import re
    match = re.search(r'in (\d+) days?', date_str)
    if match:
        days = int(match.group(1))
        return today + timedelta(days=days)

    match = re.search(r'(\d+) days? from now', date_str)
    if match:
        days = int(match.group(1))
        return today + timedelta(days=days)

    # "next week"
    if "next week" in date_str:
        return today + timedelta(weeks=1)

    # "next month"
    if "next month" in date_str:
        return today + timedelta(days=30)

    # Day of week
    weekdays = {"monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3, "friday": 4, "saturday": 5, "sunday": 6}
    for day, target_weekday in weekdays.items():
        if day in date_str:
            current_weekday = today.weekday()
            days_ahead = (target_weekday - current_weekday + 7) % 7
            if days_ahead == 0:
                days_ahead = 7  # Next week, not today
            return today + timedelta(days=days_ahead)

    return None


def _parse_recurrence(recurrence_str: str) -> Optional[str]:
    """Parse recurrence string to standard format."""
    if not recurrence_str:
        return None

    recurrence_str = recurrence_str.strip().lower()

    # Direct mappings
    if recurrence_str == "daily":
        return "DAILY"
    elif recurrence_str == "weekly":
        return "WEEKLY"
    elif recurrence_str == "monthly":
        return "MONTHLY"

    # "every X days/weeks"
    import re
    match = re.search(r'every (\d+) days?', recurrence_str)
    if match:
        return f"every {match.group(1)} days"

    match = re.search(r'every (\d+) weeks?', recurrence_str)
    if match:
        return f"every {match.group(1)} weeks"

    # If already in correct format
    if recurrence_str.upper() in ["DAILY", "WEEKLY", "MONTHLY"]:
        return recurrence_str.upper()

    return recurrence_str.upper()


def _resolve_tags(tags_str: str) -> List[int]:
    """Resolve tag names to tag IDs, creating new tags if needed."""
    if not tags_str:
        return []

    from ..models.tag import Tag
    tag_service = _get_tag_service()

    tag_names = [t.strip() for t in tags_str.split(",") if t.strip()]
    tag_ids = []

    for tag_name in tag_names:
        # Try to find existing tag
        existing = _tool_context.db_session.exec(
            select(Tag).where(
                (Tag.user_id == _tool_context.user_id) &
                (Tag.name == tag_name)
            )
        ).first()

        if existing:
            tag_ids.append(existing.id)
        else:
            # Create new tag
            try:
                new_tag = tag_service.create_tag(
                    {"name": tag_name, "color": "#94A3B8"},
                    _tool_context.user_id,
                    _tool_context.db_session
                )
                tag_ids.append(new_tag.id)
                logger.info(f"Auto-created tag '{tag_name}' (ID: {new_tag.id})")
            except Exception as e:
                logger.warning(f"Could not auto-create tag '{tag_name}': {e}")

    return tag_ids


def agent_get_current_date() -> str:
    """
    Get the current date.

    Returns:
        Current date in YYYY-MM-DD format
    """
    try:
        today = datetime.utcnow()
        return f"Today is {today.strftime('%Y-%m-%d (%A)')}. "
    except:
        return "Could not get current date."


def agent_create_tag(name: str, color: str = "#94A3B8") -> str:
    """
    Create a new tag.

    Args:
        name: The tag name (required)
        color: Optional color hex code (default: #94A3B8)

    Returns:
        A message describing the result
    """
    global _tool_context
    if not _tool_context:
        return "I'm sorry, I couldn't create the tag due to a server error."

    try:
        tag_service = _get_tag_service()

        # Check if tag already exists
        from ..models.tag import Tag
        existing = _tool_context.db_session.exec(
            select(Tag).where(
                (Tag.user_id == _tool_context.user_id) &
                (Tag.name == name)
            )
        ).first()

        if existing:
            return f"Tag '{name}' already exists (ID: {existing.id})."

        new_tag = tag_service.create_tag(
            {"name": name, "color": color},
            _tool_context.user_id,
            _tool_context.db_session
        )

        return f"✓ Created tag '{name}' (ID: {new_tag.id})"

    except Exception as e:
        logger.error(f"Error creating tag: {str(e)}")
        return f"Sorry, I couldn't create that tag. Error: {str(e)}"


def agent_list_tags() -> str:
    """
    List all tags for the user.

    Returns:
        A list of all tags
    """
    global _tool_context
    if not _tool_context:
        return "I'm sorry, I couldn't retrieve tags due to a server error."

    try:
        tag_service = _get_tag_service()

        tags = tag_service.get_tags(
            user_id=_tool_context.user_id,
            db_session=_tool_context.db_session,
            limit=100
        )

        if not tags:
            return "You have no tags yet. Create one with create_tag."

        result_lines = [f"Your tags ({len(tags)}):"]
        for tag in tags:
            result_lines.append(f"- {tag.name} (ID: {tag.id})")

        return "\n".join(result_lines)

    except Exception as e:
        logger.error(f"Error listing tags: {str(e)}")
        return f"Sorry, I couldn't retrieve tags. Error: {str(e)}"


def agent_update_task(task_id: int, title: str = "", description: str = "", priority: str = "", completed: bool = None, tags: str = "") -> str:
    """
    Update an existing task.

    Args:
        task_id: The ID of the task to update
        title: New task title (optional)
        description: New task description (optional)
        priority: New priority level - HIGH, MEDIUM, or LOW (optional)
        completed: Mark task as completed/uncompleted (optional)
        tags: Comma-separated tag names to attach (optional)

    Returns:
        A message describing the result
    """
    global _tool_context
    if not _tool_context:
        return "I'm sorry, I couldn't update the task due to a server error."

    try:
        from ..schemas.task import TaskUpdateRequest
        task_service = _get_task_service()

        update_data = {}
        if title:
            update_data["title"] = title
        if description:
            update_data["description"] = description
        if priority:
            update_data["priority"] = priority
        if completed is not None:
            update_data["completed"] = completed

        # Handle tags
        if tags:
            tag_ids = _resolve_tags(tags)
            if tag_ids:
                update_data["tag_ids"] = tag_ids

        if not update_data:
            return "Please provide at least one field to update."

        task_update = TaskUpdateRequest(**update_data)
        updated_task = task_service.update_task(
            task_id, task_update, _tool_context.user_id, _tool_context.db_session
        )

        if not updated_task:
            return f"Sorry, I couldn't find task #{task_id} to update."

        logger.info(f"Updated task {task_id} for user {_tool_context.user_id}")
        _mark_operation_performed("update_task", {"task_id": task_id})
        return f"✓ Updated task '{updated_task.title}' successfully!"
    except Exception as e:
        logger.error(f"Error updating task: {str(e)}")
        return f"Sorry, I couldn't update that task. Error: {str(e)}"
        return f"✓ Task '{updated_task.title}' updated successfully!"
    except Exception as e:
        logger.error(f"Error updating task: {str(e)}")
        return f"Sorry, I couldn't update that task. Error: {str(e)}"


def agent_toggle_task(task_id: int) -> str:
    """
    Toggle the completion status of a task.

    Args:
        task_id: The ID of the task to toggle

    Returns:
        A message describing the result
    """
    global _tool_context
    if not _tool_context:
        return "I'm sorry, I couldn't update the task due to a server error."

    try:
        task_service = _get_task_service()
        task = task_service.toggle_task_completion(
            task_id, _tool_context.user_id, _tool_context.db_session
        )

        if not task:
            return f"Sorry, I couldn't find task #{task_id}."

        status = "completed" if task.completed else "not completed"
        logger.info(f"Toggled task {task_id} to {status} for user {_tool_context.user_id}")
        # Mark operation for frontend refresh
        _mark_operation_performed("toggle_task", {"task_id": task_id})
        return f"✓ Task '{task.title}' is now {status}!"
    except Exception as e:
        logger.error(f"Error toggling task completion: {str(e)}")
        return f"Sorry, I couldn't update that task. Error: {str(e)}"


def agent_delete_task(task_id: int) -> str:
    """
    Delete a task.

    Args:
        task_id: The ID of the task to delete

    Returns:
        A message describing the result
    """
    global _tool_context
    if not _tool_context:
        return "I'm sorry, I couldn't delete the task due to a server error."

    try:
        task_service = _get_task_service()

        from ..models.task import Task
        task = _tool_context.db_session.get(Task, task_id)
        if task and task.user_id != _tool_context.user_id:
            task = None

        if not task:
            return f"Sorry, I couldn't find task #{task_id} to delete."

        success = task_service.delete_task(
            task_id, _tool_context.user_id, _tool_context.db_session
        )

        if success:
            logger.info(f"Deleted task {task_id} for user {_tool_context.user_id}")
            # Mark operation for frontend refresh
            _mark_operation_performed("delete_task", {"task_id": task_id})
            return f"✓ Task '{task.title}' deleted successfully!"
        else:
            return f"Sorry, I couldn't delete task #{task_id}."
    except Exception as e:
        logger.error(f"Error deleting task: {str(e)}")
        return f"Sorry, I couldn't delete that task. Error: {str(e)}"


def agent_delete_by_search(search_term: str) -> str:
    """
    Delete tasks that match a search term using fuzzy matching.

    Args:
        search_term: The search term to match against task titles

    Returns:
        A message describing which tasks were deleted
    """
    global _tool_context
    if not _tool_context:
        return "I'm sorry, I couldn't delete tasks due to a server error."

    try:
        task_service = _get_task_service()

        # Get ALL tasks to find matches
        all_tasks = task_service.get_tasks(
            user_id=_tool_context.user_id,
            db_session=_tool_context.db_session,
            limit=100
        )

        # Find all matching tasks (score > 0)
        matching_tasks = []
        search_lower = search_term.lower().strip()

        for task in all_tasks:
            title_lower = (task.title or "").lower()
            desc_lower = (task.description or "").lower()

            # Check if search term matches
            if (search_lower in title_lower or search_lower in desc_lower or
                any(word in title_lower or word in desc_lower for word in search_lower.split() if len(word) > 2)):
                matching_tasks.append(task)

        if not matching_tasks:
            return f"No tasks found matching '{search_term}'. Nothing was deleted."

        deleted_count = 0
        deleted_titles = []
        for task in matching_tasks:
            success = task_service.delete_task(
                task.id, _tool_context.user_id, _tool_context.db_session
            )
            if success:
                deleted_count += 1
                deleted_titles.append(f"'{task.title}'")

        if deleted_count > 0:
            logger.info(f"Deleted {deleted_count} tasks matching '{search_term}' for user {_tool_context.user_id}")
            _mark_operation_performed("delete_tasks", {"count": deleted_count})
            if deleted_count == 1:
                return f"✓ Deleted {deleted_titles[0]}!"
            else:
                return f"✓ Deleted {deleted_count} tasks: {', '.join(deleted_titles)}"
        else:
            return f"Found tasks but couldn't delete them. Please try again."

    except Exception as e:
        logger.error(f"Error deleting tasks by search: {str(e)}")
        return f"Sorry, I couldn't delete those tasks. Error: {str(e)}"


def agent_search_tasks(search: str = "", completed: bool = None, priority: str = "", limit: int = 10) -> str:
    """
    Search for tasks based on criteria.

    Args:
        search: Optional search term to match in title/description
        completed: Filter by completion status (true/false)
        priority: Filter by priority - HIGH, MEDIUM, or LOW
        limit: Maximum number of results to return

    Returns:
        A message with the search results
    """
    global _tool_context
    if not _tool_context:
        return "I'm sorry, I couldn't search tasks due to a server error."

    try:
        task_service = _get_task_service()

        tasks = task_service.get_tasks(
            user_id=_tool_context.user_id,
            db_session=_tool_context.db_session,
            search=search if search else None,
            completed=completed,
            priority=priority if priority else None,
            limit=limit
        )

        if not tasks:
            return "You don't have any matching tasks."

        result_lines = [f"Found {len(tasks)} task(s):"]
        for task in tasks:
            status = "✓" if task.completed else "○"
            priority_tag = f"[{task.priority}]" if task.priority else ""
            result_lines.append(f"{status} {task.title} {priority_tag}")
            if task.due_date:
                result_lines.append(f"  Due: {task.due_date.strftime('%Y-%m-%d')}")

        logger.info(f"Searched tasks for user {_tool_context.user_id}, found {len(tasks)} results")
        return "\n".join(result_lines)
    except Exception as e:
        logger.error(f"Error searching tasks: {str(e)}")
        return f"Sorry, I couldn't search tasks. Error: {str(e)}"


def agent_list_tasks(limit: int = 10) -> str:
    """
    List all pending tasks.

    Args:
        limit: Maximum number of tasks to return

    Returns:
        A message with the task list
    """
    global _tool_context
    if not _tool_context:
        return "I'm sorry, I couldn't retrieve tasks due to a server error."

    try:
        task_service = _get_task_service()

        tasks = task_service.get_tasks(
            user_id=_tool_context.user_id,
            db_session=_tool_context.db_session,
            completed=False,
            limit=limit
        )

        if not tasks:
            return "You don't have any pending tasks. Great job!"

        result_lines = [f"Here are your pending tasks ({len(tasks)}):"]
        for task in tasks:
            status = "✓" if task.completed else "○"
            priority_tag = f"[{task.priority}]" if task.priority else ""
            result_lines.append(f"{status} {task.title} {priority_tag}")

        logger.info(f"Listed tasks for user {_tool_context.user_id}")
        return "\n".join(result_lines)
    except Exception as e:
        logger.error(f"Error listing tasks: {str(e)}")
        return f"Sorry, I couldn't retrieve tasks. Error: {str(e)}"


def agent_get_task(task_id: int) -> str:
    """
    Get details of a specific task.

    Args:
        task_id: The ID of the task to retrieve

    Returns:
        A message with the task details
    """
    global _tool_context
    if not _tool_context:
        return "I'm sorry, I couldn't retrieve the task due to a server error."

    try:
        task_service = _get_task_service()

        task = task_service.get_task_by_id(
            task_id, _tool_context.user_id, _tool_context.db_session
        )

        if not task:
            return f"Sorry, I couldn't find task #{task_id}."

        status = "Completed" if task.completed else "Pending"
        result = f"Task: {task.title}\nStatus: {status}"
        if task.description:
            result += f"\nDescription: {task.description}"
        if task.due_date:
            result += f"\nDue: {task.due_date.strftime('%Y-%m-%d')}"
        if task.priority:
            result += f"\nPriority: {task.priority}"

        logger.info(f"Retrieved task {task_id} for user {_tool_context.user_id}")
        return result
    except Exception as e:
        logger.error(f"Error getting task: {str(e)}")
        return f"Sorry, I couldn't retrieve the task. Error: {str(e)}"


def agent_show_conversation_summary() -> str:
    """
    Show a summary of what has happened in our conversation so far.

    Returns:
        A summary of recent conversation activity
    """
    global _tool_context
    if not _tool_context:
        return "I'm sorry, I couldn't retrieve conversation history."

    try:
        from ..services.chat_service import chat_service

        # Get recent messages from all sessions for this user
        messages = chat_service.get_chat_history(
            user_id=_tool_context.user_id,
            session_id=None,
            db_session=_tool_context.db_session,
            limit=20
        )

        if not messages:
            return "This is the beginning of our conversation! How can I help you with your tasks today?"

        # Count message types
        user_msgs = [m for m in messages if m.sender_type == 'USER']
        ai_msgs = [m for m in messages if m.sender_type == 'AI']

        result_lines = [
            f"Here's what we've discussed ({len(messages)} messages):",
            f"- {len(user_msgs)} messages from you",
            f"- {len(ai_msgs)} responses from me",
            "",
            "Recent messages:"
        ]

        for msg in messages[-10:]:
            sender = "You" if msg.sender_type == 'USER' else "Me"
            content_preview = msg.content[:80] + "..." if len(msg.content) > 80 else msg.content
            result_lines.append(f"- {sender}: {content_preview}")

        return "\n".join(result_lines)

    except Exception as e:
        logger.error(f"Error getting conversation summary: {str(e)}")
        return "Sorry, I couldn't retrieve the conversation summary."


def agent_get_all_tasks() -> str:
    """
    Get all tasks for the user so you can find the right one to operate on.

    Returns:
        A list of all tasks with their IDs, titles, and status
    """
    global _tool_context
    if not _tool_context:
        return "I'm sorry, I couldn't retrieve tasks due to a server error."

    try:
        task_service = _get_task_service()

        # Get ALL tasks
        tasks = task_service.get_tasks(
            user_id=_tool_context.user_id,
            db_session=_tool_context.db_session,
            limit=100
        )

        if not tasks:
            return "You have no tasks."

        result_lines = [f"Your tasks ({len(tasks)} total):"]
        for task in tasks:
            status = "✓" if task.completed else "○"
            priority_tag = f"[{task.priority}]" if task.priority else ""
            result_lines.append(f"ID {task.id}: {status} {task.title} {priority_tag}")
            if task.description:
                result_lines.append(f"    Description: {task.description}")

        return "\n".join(result_lines)

    except Exception as e:
        logger.error(f"Error getting all tasks: {str(e)}")
        return f"Sorry, I couldn't retrieve tasks. Error: {str(e)}"


def agent_complete_by_search(search_term: str) -> str:
    """
    Mark a task as completed. Use this when user says they completed something.

    IMPORTANT: First call get_all_tasks to see all available tasks, then use
    the exact task ID to mark it complete.

    Args:
        search_term: Description of what the user completed (for context only)

    Returns:
        A message describing the result
    """
    global _tool_context
    if not _tool_context:
        return "I'm sorry, I couldn't update the task due to a server error."

    try:
        task_service = _get_task_service()

        # Get ALL incomplete tasks
        tasks = task_service.get_tasks(
            user_id=_tool_context.user_id,
            db_session=_tool_context.db_session,
            completed=False,
            limit=100
        )

        if not tasks:
            return f"No incomplete tasks found."

        # Return the list so LLM can decide
        result_lines = [f"Incomplete tasks ({len(tasks)}):"]
        for task in tasks:
            status = "○"
            priority_tag = f"[{task.priority}]" if task.priority else ""
            result_lines.append(f"ID {task.id}: {status} {task.title} {priority_tag}")
            if task.description:
                result_lines.append(f"    Description: {task.description}")

        # Add instruction for LLM
        result_lines.append("\nWhich task matches '" + search_term + "'? Call agent_toggle_task with the specific task ID.")

        return "\n".join(result_lines)

    except Exception as e:
        logger.error(f"Error getting incomplete tasks: {str(e)}")
        return f"Sorry, I couldn't retrieve tasks. Error: {str(e)}"


def agent_uncomplete_by_search(search_term: str) -> str:
    """
    Show completed tasks so the user can choose which one to mark incomplete.

    IMPORTANT: Returns the list of completed tasks. Then use toggle_task with the specific ID.

    Args:
        search_term: Description of what the user wants to uncomplete (for context only)

    Returns:
        A list of completed tasks
    """
    global _tool_context
    if not _tool_context:
        return "I'm sorry, I couldn't retrieve tasks due to a server error."

    try:
        task_service = _get_task_service()

        # Get ALL completed tasks
        tasks = task_service.get_tasks(
            user_id=_tool_context.user_id,
            db_session=_tool_context.db_session,
            completed=True,
            limit=100
        )

        if not tasks:
            return f"No completed tasks found."

        # Return the list so LLM can decide
        result_lines = [f"Completed tasks ({len(tasks)}):"]
        for task in tasks:
            status = "✓"
            priority_tag = f"[{task.priority}]" if task.priority else ""
            result_lines.append(f"ID {task.id}: {status} {task.title} {priority_tag}")
            if task.description:
                result_lines.append(f"    Description: {task.description}")

        # Add instruction for LLM
        result_lines.append("\nWhich task matches '" + search_term + "'? Call agent_toggle_task with the specific task ID.")

        return "\n".join(result_lines)

    except Exception as e:
        logger.error(f"Error getting completed tasks: {str(e)}")
        return f"Sorry, I couldn't retrieve tasks. Error: {str(e)}"


def agent_update_by_search(search_term: str, title: str = "", description: str = "", priority: str = "") -> str:
    """
    Show all tasks so the LLM can decide which one to update.

    IMPORTANT: Returns the list of all tasks. Then use update_task with the specific task ID.

    Args:
        search_term: Description of which task to update (for context only)
        title: New task title (optional)
        description: New task description (optional)
        priority: New priority level - HIGH, MEDIUM, or LOW (optional)

    Returns:
        A list of all tasks
    """
    global _tool_context
    if not _tool_context:
        return "I'm sorry, I couldn't retrieve tasks due to a server error."

    try:
        task_service = _get_task_service()

        # Get ALL tasks
        tasks = task_service.get_tasks(
            user_id=_tool_context.user_id,
            db_session=_tool_context.db_session,
            limit=100
        )

        if not tasks:
            return "You have no tasks to update."

        # Return the list so LLM can decide
        result_lines = [f"All tasks ({len(tasks)}):"]
        for task in tasks:
            status = "✓" if task.completed else "○"
            priority_tag = f"[{task.priority}]" if task.priority else ""
            result_lines.append(f"ID {task.id}: {status} {task.title} {priority_tag}")
            if task.description:
                result_lines.append(f"    Description: {task.description}")

        # Add instruction for LLM
        result_lines.append(f"\nWhich task matches '{search_term}'? Call agent_update_task with the specific task ID and new values.")

        return "\n".join(result_lines)

    except Exception as e:
        logger.error(f"Error getting tasks for update: {str(e)}")
        return f"Sorry, I couldn't retrieve tasks. Error: {str(e)}"


# ============================================================================
# Agent Service Class
# ============================================================================

class AgentService:
    """
    Service for managing OpenAI Agents SDK integration.

    Uses Gemini API (free tier) via OpenAI-compatible endpoint.
    """

    def __init__(self):
        self._initialized = False
        self._agent = None
        self._Runner = None
        self._run_config = None
        self._tools = []

        # Z.ai API configuration (also supports GEMINI_API_KEY as fallback)
        self._gemini_api_key = os.getenv("Z_AI_API_KEY") or os.getenv("GEMINI_API_KEY")
        self._model_name = os.getenv("Z_AI_MODEL", "gpt-4o")

    def initialize(self):
        """Initialize the OpenAI Agents SDK with Z.ai API."""
        if self._initialized:
            return

        try:
            from agents import Agent, Runner, RunConfig, OpenAIChatCompletionsModel, function_tool
            from openai import AsyncOpenAI

            # Use Z.AI_API_KEY for Z.ai (fallback to GEMINI_API_KEY for backward compatibility)
            api_key = os.getenv("Z_AI_API_KEY") or self._gemini_api_key

            if not api_key:
                logger.warning("Z_AI_API_KEY or GEMINI_API_KEY not found, OpenAI Agents SDK will not be available")
                return

            # Create external OpenAI client for Z.ai
            external_client = AsyncOpenAI(
                api_key=api_key,
                base_url="https://api.z.ai/api/paas/v4/"
            )

            # Create the model wrapper (use gpt-4o or compatible model)
            model = OpenAIChatCompletionsModel(
                model=os.getenv("Z_AI_MODEL", "gpt-4o"),
                openai_client=external_client
            )

            # Create run config
            self._run_config = RunConfig(
                model=model,
                model_provider=external_client,
                tracing_disabled=True
            )

            # Decorate the implementation functions as tools
            create_task_tool = function_tool(agent_create_task)
            create_tag_tool = function_tool(agent_create_tag)
            update_task_tool = function_tool(agent_update_task)
            update_by_search_tool = function_tool(agent_update_by_search)
            toggle_task_tool = function_tool(agent_toggle_task)
            complete_task_tool = function_tool(agent_complete_by_search)
            uncomplete_task_tool = function_tool(agent_uncomplete_by_search)
            delete_task_tool = function_tool(agent_delete_task)
            delete_by_search_tool = function_tool(agent_delete_by_search)
            get_all_tasks_tool = function_tool(agent_get_all_tasks)
            get_current_date_tool = function_tool(agent_get_current_date)
            list_tags_tool = function_tool(agent_list_tags)
            search_tasks_tool = function_tool(agent_search_tasks)
            list_tasks_tool = function_tool(agent_list_tasks)
            get_task_tool = function_tool(agent_get_task)
            show_conversation_tool = function_tool(agent_show_conversation_summary)

            self._tools = [
                create_task_tool,
                create_tag_tool,
                get_all_tasks_tool,
                get_current_date_tool,
                list_tags_tool,
                update_task_tool,
                update_by_search_tool,
                toggle_task_tool,
                complete_task_tool,
                uncomplete_task_tool,
                delete_task_tool,
                delete_by_search_tool,
                search_tasks_tool,
                list_tasks_tool,
                get_task_tool,
                show_conversation_tool,
            ]

            # Create the agent with tools
            self._agent = Agent(
                name="TaskManager",
                instructions=(
                    "You are a friendly task management assistant. Help users manage tasks efficiently.\n\n"
                    "DATE HANDLING:\n"
                    "- Use agent_get_current_date to know today's date\n"
                    "- For due dates, use relative terms like 'tomorrow', 'next week', 'in 3 days' or YYYY-MM-DD format\n"
                    "- Days of week work too: 'on friday', 'by monday'\n\n"
                    "TAGS:\n"
                    "- Use agent_list_tags to see all available tags\n"
                    "- Use agent_create_tag to create a new tag before using it in a task\n"
                    "- Tags are passed as comma-separated names: tags='work,urgent'\n"
                    "- NEVER put tag names in the title or description field!\n\n"
                    "TASK CREATION:\n"
                    "- Use agent_create_task with: title (required), description, priority, due_date, recurrence, tags\n"
                    "- Example: agent_create_task(title='Buy groceries', due_date='tomorrow', tags='shopping')\n"
                    "- If user says 'daily' or 'every day', set recurrence='daily'\n\n"
                    "TASK COMPLETION:\n"
                    "1. Call agent_get_all_tasks FIRST to see all tasks\n"
                    "2. Find the matching task yourself by reading the list\n"
                    "3. Call agent_toggle_task with the exact task ID\n\n"
                    "TASK UPDATES/DELETION:\n"
                    "- Call agent_get_all_tasks first, then use agent_update_task or agent_delete_task with the specific ID\n"
                    "- agent_update_task CAN add/remove tags with the tags parameter: tags='work,urgent'\n\n"
                    "CRITICAL RULES:\n"
                    "- NEVER put tags, recurrence, or priority in the description field!\n"
                    "- ALWAYS use the proper parameters: tags, recurrence, priority\n"
                    "- Always get the task list FIRST before trying to complete/update/delete\n"
                    "- YOU must decide which task matches - don't ask the user to pick if obvious\n\n"
                    "After completing any action, STOP and respond to the user."
                ),
                tools=self._tools
            )

            self._Runner = Runner
            self._initialized = True
            logger.info("OpenAI Agents SDK initialized successfully with Z.ai API")

        except ImportError as e:
            logger.warning(f"OpenAI Agents SDK not available: {e}")
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI Agents SDK: {e}")

    def is_available(self) -> bool:
        """Check if the OpenAI Agents SDK is available and initialized."""
        return self._initialized and self._agent is not None

    async def process_message(
        self,
        content: str,
        user_id: int,
        db_session: Session,
        conversation_history: Optional[List[Dict[str, Any]]] = None,
        user_info: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Process a user message using the OpenAI Agents SDK.

        Args:
            content: The user's message content
            user_id: The internal user ID
            db_session: Database session
            conversation_history: Optional conversation history for context
            user_info: Optional user information for personalization

        Returns:
            Dictionary with the response content and any operations performed
        """
        if not self.is_available():
            return {
                "success": False,
                "error": "OpenAI Agents SDK not available",
                "content": "I'm sorry, the AI service is not available right now. Please try again later."
            }

        try:
            # Set the tool context for this request
            _set_tool_context(db_session, user_id)

            # Get user name for personalization (only if we have a real name)
            user_name = None
            if user_info:
                name = user_info.get("name") or user_info.get("first_name")
                if name and name.lower() not in ("there", "friend"):
                    user_name = name

            # Build the input with user context and conversation history
            input_text = content

            # Prepend context if available
            context_parts = []
            if user_name:
                context_parts.append(f"User's name: {user_name}")

            if conversation_history and len(conversation_history) > 0:
                history_parts = []
                for msg in conversation_history[-5:]:
                    sender = "User" if msg.get("sender_type") == "USER" else "Assistant"
                    history_parts.append(f"{sender}: {msg.get('content', '')}")

                if history_parts:
                    context_parts.append("Recent conversation:")
                    context_parts.extend(history_parts)

            if context_parts:
                input_text = "\n".join(context_parts) + f"\n\nCurrent message: {content}"

            # Run the agent
            result = await self._Runner.run(
                self._agent,
                input=input_text,
                run_config=self._run_config
            )

            response_content = result.final_output if result.final_output else "I'm sorry, I couldn't process that request."
            operation_performed = self._extract_operations(result)

            logger.info(f"Agent processed message for user {user_id}")

            return {
                "success": True,
                "content": response_content,
                "operation_performed": operation_performed,
                "model_used": "OpenAI Agents SDK (Z.ai)"
            }

        except Exception as e:
            logger.error(f"Error processing message with OpenAI Agents SDK: {e}")
            return {
                "success": False,
                "error": str(e),
                "content": "I'm sorry, I encountered an error processing your request. Please try again."
            }
        finally:
            _clear_tool_context()

    async def process_message_streamed(
        self,
        content: str,
        user_id: int,
        db_session: Session,
        conversation_history: Optional[List[Dict[str, Any]]] = None,
        user_info: Optional[Dict[str, str]] = None
    ) -> AsyncIterator[Dict[str, Any]]:
        """
        Process a user message with streaming response.

        Args:
            content: The user's message content
            user_id: The internal user ID
            db_session: Database session
            conversation_history: Optional conversation history
            user_info: Optional user information for personalization

        Yields:
            Dictionary with streaming events
        """
        if not self.is_available():
            yield {
                "type": "error",
                "content": "I'm sorry, the AI service is not available right now. Please try again later."
            }
            return

        try:
            _set_tool_context(db_session, user_id)

            # Get user name for personalization (only if we have a real name)
            user_name = None
            if user_info:
                name = user_info.get("name") or user_info.get("first_name")
                if name and name.lower() not in ("there", "friend"):
                    user_name = name

            # Build the input with user context and conversation history
            input_text = content

            # Prepend context if available
            context_parts = []
            if user_name:
                context_parts.append(f"User's name: {user_name}")

            if conversation_history and len(conversation_history) > 0:
                history_parts = []
                for msg in conversation_history[-5:]:
                    sender = "User" if msg.get("sender_type") == "USER" else "Assistant"
                    history_parts.append(f"{sender}: {msg.get('content', '')}")

                if history_parts:
                    context_parts.append("Recent conversation:")
                    context_parts.extend(history_parts)

            if context_parts:
                input_text = "\n".join(context_parts) + f"\n\nCurrent message: {content}"

            result = await self._Runner.run(
                self._agent,
                input=input_text,
                run_config=self._run_config
            )

            final_output = result.final_output if result.final_output else "I'm sorry, I couldn't process that request."

            # Simulate streaming
            chunk_size = 10
            for i in range(0, len(final_output), chunk_size):
                chunk = final_output[i:i + chunk_size]
                yield {
                    "type": "content_delta",
                    "content": chunk
                }
                await asyncio.sleep(0.02)

            operation_performed = self._extract_operations(result)

            yield {
                "type": "final",
                "content": final_output,
                "operation_performed": operation_performed,
                "model_used": "OpenAI Agents SDK (Z.ai)"
            }

            logger.info(f"Agent processed message (streamed) for user {user_id}")

        except Exception as e:
            logger.error(f"Error processing message with OpenAI Agents SDK (streamed): {e}")
            yield {
                "type": "error",
                "content": "I'm sorry, I encountered an error processing your request. Please try again."
            }
        finally:
            _clear_tool_context()
        
    def _extract_operations(self, result) -> Optional[Dict[str, Any]]:
        """Extract information about operations performed from the agent result."""
        # First check if any tool marked an operation as performed
        global _operation_performed
        if _operation_performed:
            return _operation_performed

        try:
            # Check various possible structures from OpenAI Agents SDK
            # The result structure may vary depending on SDK version

            # Method 1: Check for new_items (older SDK versions)
            if hasattr(result, 'new_items') and result.new_items:
                for item in result.new_items:
                    if hasattr(item, 'type') and 'tool_call' in str(item.type):
                        return {
                            "type": "tool_call",
                            "tool_used": getattr(item, 'name', 'unknown')
                        }

            # Method 2: Check for raw_responses or context
            if hasattr(result, 'raw_responses') and result.raw_responses:
                # Tool calls were made
                return {"type": "tool_call", "count": len(result.raw_responses)}

            # Method 3: Check if final_output contains task operation keywords
            if hasattr(result, 'final_output') and result.final_output:
                output = result.final_output
                if any(keyword in output for keyword in ['✓ Task', 'created successfully!', 'updated successfully!', 'deleted successfully!', 'is now', 'Deleted']):
                    return {"type": "task_operation", "indicated_by": "response_content"}

            # Method 4: Check context for tool calls
            if hasattr(result, 'context') and result.context:
                context = result.context
                if hasattr(context, 'tool_calls') and context.tool_calls:
                    return {"type": "tool_call", "count": len(context.tool_calls)}
        except Exception as e:
            pass
        return None

    def classify_intent(self, message: str) -> IntentDetectionResult:
        """
        Classify the intent from a user message using keyword matching.

        This is a simplified fallback method.
        """
        import re
        message_lower = message.lower().strip()

        intent_patterns = {
            IntentTypeEnum.CREATE_TASK: [
                r'\b(create|add|make|new)\s+(a\s+)?task',
                r'\b(remind\s+me\s+(to|about))',
                r'\b(need\s+to|should|have\s+to|gotta)\s+',
            ],
            IntentTypeEnum.UPDATE_TASK: [
                r'\b(update|change|edit|modify)\s+(the\s+)?task',
                r'\b(mark|set|change)\s+(the\s+)?task\s*\d*\s+as\s+(completed|done|finished)',
                r'\b(complete|finish|done)\s+(the\s+)?task\s*\d*',
            ],
            IntentTypeEnum.DELETE_TASK: [
                r'\b(delete|remove)\s+(the\s+)?task',
            ],
            IntentTypeEnum.SEARCH_TASKS: [
                r'\b(search|find|look\s+for)\s+(tasks?)',
                r'\b(show\s+me)\s*(tasks?)\s*(with|containing)',
            ],
            IntentTypeEnum.LIST_TASKS: [
                r'\b(today|tomorrow|this\s+week)\s*',
                r'\b(show|list|display|what\s+are)\s*(all\s+)?(my\s+)?tasks?',
                r'\b(get|see|view)\s*(all\s+)?(my\s+)?tasks?',
            ],
            IntentTypeEnum.READ_TASK: [
                r'\b(show|get|tell\s+me\s+about)\s+(the\s+)?task\s*\d+',
            ],
        }

        for intent, patterns in intent_patterns.items():
            for pattern in patterns:
                if re.search(pattern, message_lower, re.IGNORECASE):
                    return IntentDetectionResult(
                        intent=intent,
                        confidence=0.7,
                        parameters={}
                    )

        return IntentDetectionResult(
            intent=IntentTypeEnum.UNKNOWN,
            confidence=0.0,
            parameters={}
        )


# Singleton instance
agent_service = AgentService()
