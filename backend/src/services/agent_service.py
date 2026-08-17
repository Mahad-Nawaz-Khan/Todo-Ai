"""
OpenAI Agents SDK Integration Service

This service integrates the OpenAI Agents SDK for processing user messages
and managing task operations through natural language.

Uses Z.ai API via OpenAI-compatible endpoint.

Context is passed to tools via the SDK's RunContextWrapper (per-run
dependency injection), so concurrent requests can never mix users or
database sessions.
"""

import asyncio
import logging
import os
import re
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any, AsyncIterator, Dict, List, Optional, Tuple

from sqlmodel import Session, select

from ..models.chat_models import IntentDetectionResult, IntentTypeEnum

try:
    from agents import RunContextWrapper
except ImportError:  # SDK is optional at import time; initialize() degrades gracefully
    RunContextWrapper = Any

logger = logging.getLogger(__name__)


@dataclass
class ToolContext:
    db_session: Session
    user_id: int
    operation_performed: Optional[Dict[str, Any]] = field(default=None)


def _get_task_service():
    from ..services.task_service import task_service
    return task_service


def _get_tag_service():
    from ..services.tag_service import tag_service
    return tag_service


def _utc_now_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _mark_operation_performed(context: ToolContext, op_type: str, details: Optional[Dict[str, Any]] = None):
    context.operation_performed = {"type": op_type}
    if details:
        context.operation_performed.update(details)


def _get_task_by_id(context: ToolContext, task_id: int):
    return _get_task_service().get_task_by_id(task_id, context.user_id, context.db_session)


def agent_create_task(
    ctx: RunContextWrapper,
    title: str,
    description: str = "",
    priority: str = "MEDIUM",
    due_date: str = "",
    recurrence: str = "",
    tags: str = "",
) -> str:
    """Create a new task. Always send every schema field when calling this tool. Send title as the task title string. Send description as a short, concrete description and never leave it blank; infer one from the user's wording if needed. Send priority as HIGH, MEDIUM, or LOW, and send MEDIUM when the user does not specify a priority. Send due_date as a string, using an empty string when unused; this tool accepts relative phrases like 'tomorrow', 'in 2 days', 'next monday', or an ISO date. Send recurrence as a string, using an empty string when unused; supported values include daily, weekly, and monthly. Send tags as a comma-separated string like 'Coding,Work', or an empty string when unused. If a task with the same title already exists, this tool updates it instead of creating a duplicate."""
    context = ctx.context
    try:
        from ..models.task import Task as TaskModel
        from ..schemas.task import TaskCreateRequest, TaskUpdateRequest

        task_service = _get_task_service()
        existing_tasks = context.db_session.exec(
            select(TaskModel).where(
                (TaskModel.user_id == context.user_id) & (TaskModel.title == title)
            )
        ).all()

        parsed_due_date = _parse_relative_date(due_date) if due_date else None
        parsed_recurrence = _parse_recurrence(recurrence) if recurrence else None
        tag_ids = _resolve_tags(context, tags) if tags else []
        normalized_description = description.strip() if description else ""
        if not normalized_description:
            normalized_description = f"Task: {title.strip()}"

        if existing_tasks:
            task = existing_tasks[0]
            update_data = {}
            if normalized_description and normalized_description != (task.description or ""):
                update_data["description"] = normalized_description
            if priority and priority != (task.priority or "MEDIUM"):
                update_data["priority"] = priority
            if parsed_due_date and parsed_due_date != task.due_date:
                update_data["due_date"] = parsed_due_date
            if parsed_recurrence and parsed_recurrence != task.recurrence_rule:
                update_data["recurrence_rule"] = parsed_recurrence
            if tag_ids:
                update_data["tag_ids"] = tag_ids

            if update_data:
                task_update = TaskUpdateRequest(**update_data)
                updated_task = task_service.update_task(
                    task.id, task_update, context.user_id, context.db_session
                )
                _mark_operation_performed(context, "update_task", {"task_id": task.id})
                return f"✓ Updated existing task '{updated_task.title}' instead of creating duplicate!"
            return f"Task '{title}' already exists with the same details."

        task_data = TaskCreateRequest(
            title=title,
            description=normalized_description,
            priority=priority if priority else "MEDIUM",
            due_date=parsed_due_date,
            recurrence_rule=parsed_recurrence,
            tag_ids=tag_ids if tag_ids else None,
        )
        task = task_service.create_task(task_data, context.user_id, context.db_session)
        _mark_operation_performed(context, "create_task", {"task_id": task.id})
        result = f"✓ Task '{task.title}' created!"
        if parsed_due_date:
            result += f" Due: {parsed_due_date.strftime('%Y-%m-%d')}"
        if parsed_recurrence:
            result += f" Recurs: {parsed_recurrence}"
        if tag_ids:
            result += " Tags added."
        return result
    except Exception:
        logger.exception("Error creating task")
        return "Sorry, I couldn't create that task. Please try again."


def _parse_relative_date(date_str: str) -> Optional[datetime]:
    if not date_str:
        return None
    date_str = date_str.strip().lower()
    try:
        # Stored due dates are naive UTC; strip any offset to keep comparisons consistent.
        return datetime.fromisoformat(date_str).replace(tzinfo=None)
    except Exception:
        pass

    today = _utc_now_naive().replace(hour=0, minute=0, second=0, microsecond=0)
    if date_str == "today":
        return today
    if date_str == "tomorrow":
        return today + timedelta(days=1)
    if date_str == "yesterday":
        return today - timedelta(days=1)

    match = re.search(r"in (\d+) days?", date_str)
    if match:
        return today + timedelta(days=int(match.group(1)))

    match = re.search(r"(\d+) days? from now", date_str)
    if match:
        return today + timedelta(days=int(match.group(1)))

    if "next week" in date_str:
        return today + timedelta(weeks=1)
    if "next month" in date_str:
        return today + timedelta(days=30)

    weekdays = {
        "monday": 0,
        "tuesday": 1,
        "wednesday": 2,
        "thursday": 3,
        "friday": 4,
        "saturday": 5,
        "sunday": 6,
    }
    for day, target_weekday in weekdays.items():
        if day in date_str:
            current_weekday = today.weekday()
            days_ahead = (target_weekday - current_weekday + 7) % 7
            if days_ahead == 0:
                days_ahead = 7
            return today + timedelta(days=days_ahead)
    return None


def _parse_recurrence(recurrence_str: str) -> Optional[str]:
    if not recurrence_str:
        return None
    recurrence_str = recurrence_str.strip().lower()
    if recurrence_str == "daily":
        return "DAILY"
    if recurrence_str == "weekly":
        return "WEEKLY"
    if recurrence_str == "monthly":
        return "MONTHLY"
    match = re.search(r"every (\d+) days?", recurrence_str)
    if match:
        return f"every {match.group(1)} days"
    match = re.search(r"every (\d+) weeks?", recurrence_str)
    if match:
        return f"every {match.group(1)} weeks"
    if recurrence_str.upper() in ["DAILY", "WEEKLY", "MONTHLY"]:
        return recurrence_str.upper()
    return recurrence_str.upper()


def _resolve_tags(context: ToolContext, tags_str: str) -> List[int]:
    if not tags_str:
        return []
    from ..models.tag import Tag

    tag_service = _get_tag_service()
    tag_names = [t.strip() for t in tags_str.split(",") if t.strip()]
    tag_ids = []
    for tag_name in tag_names:
        existing = context.db_session.exec(
            select(Tag).where((Tag.user_id == context.user_id) & (Tag.name == tag_name))
        ).first()
        if existing:
            tag_ids.append(existing.id)
        else:
            try:
                new_tag = tag_service.create_tag(
                    {"name": tag_name, "color": "#94A3B8"},
                    context.user_id,
                    context.db_session,
                )
                tag_ids.append(new_tag.id)
            except Exception as e:
                logger.warning(f"Could not auto-create tag '{tag_name}': {e}")
    return tag_ids


def agent_get_current_date(ctx: RunContextWrapper) -> str:
    """Return the current UTC date and day of week. Use this before interpreting relative dates like 'tomorrow', 'next week', or '2 days later'."""
    try:
        today = datetime.now(timezone.utc)
        return f"Today is {today.strftime('%Y-%m-%d (%A)')}. "
    except Exception:
        return "Could not get current date."


def agent_create_tag(ctx: RunContextWrapper, name: str, color: str = "#94A3B8") -> str:
    """Create a new tag. Always send every schema field when calling this tool. Send name as the tag name string. Send color as a hex color string like '#94A3B8'; use the default-style color when the user does not specify one. Returns an error if the tag already exists."""
    context = ctx.context
    try:
        from ..models.tag import Tag

        tag_service = _get_tag_service()
        existing = context.db_session.exec(
            select(Tag).where((Tag.user_id == context.user_id) & (Tag.name == name))
        ).first()
        if existing:
            return f"Tag '{name}' already exists (ID: {existing.id})."
        new_tag = tag_service.create_tag(
            {"name": name, "color": color}, context.user_id, context.db_session
        )
        return f"✓ Created tag '{name}' (ID: {new_tag.id})"
    except Exception:
        logger.exception("Error creating tag")
        return "Sorry, I couldn't create that tag. Please try again."


def agent_list_tags(ctx: RunContextWrapper) -> str:
    """List all tags belonging to the current user with their IDs and names."""
    context = ctx.context
    try:
        tag_service = _get_tag_service()
        tags = tag_service.get_tags(user_id=context.user_id, db_session=context.db_session, limit=100)
        if not tags:
            return "You have no tags yet. Create one with create_tag."
        return "\n".join([f"Your tags ({len(tags)}):", *[f"- {tag.name} (ID: {tag.id})" for tag in tags]])
    except Exception:
        logger.exception("Error listing tags")
        return "Sorry, I couldn't retrieve tags. Please try again."


def agent_update_task(ctx: RunContextWrapper, task_id: str, title: str = "", description: str = "", priority: str = "", due_date: str = "", tags: str = "") -> str:
    """Update an existing task by its ID without changing completion state. Always send every schema field when calling this tool. Send task_id as a string containing digits like '12'. Send title, description, priority, due_date, and tags as strings, using an empty string for fields you are not changing. Never use this tool to mark a task complete or incomplete; use agent_toggle_task, agent_complete_by_search, or agent_uncomplete_by_search instead. Send priority only as HIGH, MEDIUM, or LOW when provided. Send due_date as a string; this tool accepts relative phrases like 'tomorrow', 'in 2 days', 'next monday', or an ISO date. Send tags as a comma-separated string like 'Coding,Work', or an empty string when unused."""
    context = ctx.context
    try:
        from ..schemas.task import TaskUpdateRequest

        task_id_int = int(task_id)
        if not _get_task_by_id(context, task_id_int):
            return f"Sorry, I couldn't find task #{task_id_int} to update."

        task_service = _get_task_service()
        update_data = {}
        parsed_due_date = _parse_relative_date(due_date) if due_date else None
        if title:
            update_data["title"] = title
        if description:
            update_data["description"] = description
        if priority:
            update_data["priority"] = priority
        if parsed_due_date:
            update_data["due_date"] = parsed_due_date
        if tags:
            tag_ids = _resolve_tags(context, tags)
            if tag_ids:
                update_data["tag_ids"] = tag_ids
        if not update_data:
            return "Please provide at least one field to update."
        updated_task = task_service.update_task(task_id_int, TaskUpdateRequest(**update_data), context.user_id, context.db_session)
        if not updated_task:
            return f"Sorry, I couldn't find task #{task_id_int} to update."
        _mark_operation_performed(context, "update_task", {"task_id": task_id_int})
        return f"✓ Updated task '{updated_task.title}' successfully!"
    except Exception:
        logger.exception("Error updating task")
        return "Sorry, I couldn't update that task. Please try again."


def agent_toggle_task(ctx: RunContextWrapper, task_id: str) -> str:
    """Toggle a task between completed and not completed by its ID. Send task_id as a string containing digits like '12'. Use this only when the task ID is already known or verified."""
    context = ctx.context
    try:
        task_id_int = int(task_id)
        if not _get_task_by_id(context, task_id_int):
            return f"Sorry, I couldn't find task #{task_id_int}."
        task = _get_task_service().toggle_task_completion(task_id_int, context.user_id, context.db_session)
        if not task:
            return f"Sorry, I couldn't find task #{task_id_int}."
        status = "completed" if task.completed else "not completed"
        _mark_operation_performed(context, "toggle_task", {"task_id": task_id_int})
        return f"✓ Task '{task.title}' is now {status}!"
    except Exception:
        logger.exception("Error toggling task completion")
        return "Sorry, I couldn't update that task. Please try again."


def agent_delete_task(ctx: RunContextWrapper, task_id: str) -> str:
    """Delete a task by its ID. Send task_id as a string containing digits like '12'. Use this only when the task ID is already known or verified. Permanently removes the task after verifying it belongs to the user."""
    context = ctx.context
    try:
        task_id_int = int(task_id)
        task = _get_task_by_id(context, task_id_int)
        if not task:
            return f"Sorry, I couldn't find task #{task_id_int} to delete."
        if _get_task_service().delete_task(task_id_int, context.user_id, context.db_session):
            _mark_operation_performed(context, "delete_task", {"task_id": task_id_int})
            return f"✓ Task '{task.title}' deleted successfully!"
        return f"Sorry, I couldn't delete task #{task_id_int}."
    except Exception:
        logger.exception("Error deleting task")
        return "Sorry, I couldn't delete that task. Please try again."


def _format_task_lines(tasks, heading: str, include_description: bool = False) -> str:
    result_lines = [heading]
    for task in tasks:
        status = "✓" if task.completed else "○"
        priority_tag = f"[{task.priority}]" if task.priority else ""
        result_lines.append(f"ID {task.id}: {status} {task.title} {priority_tag}".strip())
        if include_description and task.description:
            result_lines.append(f"    Description: {task.description}")
    return "\n".join(result_lines)


def _find_tasks_for_user_search(db_session: Session, user_id: int, search_term: str, completed: Optional[bool] = None, limit: int = 25):
    task_service = _get_task_service()
    normalized_search = search_term.strip()
    if not normalized_search:
        return task_service.get_tasks(user_id=user_id, db_session=db_session, completed=completed, sort_by="updated_at", order="desc", limit=min(limit, 10), include_tags=False)
    tasks = task_service.get_tasks(user_id=user_id, db_session=db_session, search=normalized_search, completed=completed, sort_by="updated_at", order="desc", limit=limit, include_tags=False)
    if tasks:
        return tasks
    for term in [term for term in normalized_search.split() if len(term) > 2][:3]:
        tasks = task_service.get_tasks(user_id=user_id, db_session=db_session, search=term, completed=completed, sort_by="updated_at", order="desc", limit=limit, include_tags=False)
        if tasks:
            return tasks
    return []


def _find_tasks_for_search(context: ToolContext, search_term: str, completed: Optional[bool] = None, limit: int = 25):
    return _find_tasks_for_user_search(context.db_session, context.user_id, search_term, completed, limit)


def agent_delete_by_search(ctx: RunContextWrapper, search_term: str, completed: Optional[bool] = None) -> str:
    """Find tasks matching a search term and delete them all. Always send every schema field when calling this tool. Send search_term as the task title or name fragment, not a task ID. Send completed=true to delete only completed matches, completed=false to delete only open matches, and completed=null when no completion filter is needed. Never send booleans as strings. Deletes up to 10 matching tasks in one call and should not be used if multiple ambiguous matches would be unsafe."""
    context = ctx.context
    try:
        matching_tasks = _find_tasks_for_search(context, search_term, completed=completed, limit=10)
        if not matching_tasks:
            return f"No tasks found matching '{search_term}'. Nothing was deleted."
        deleted_names = []
        for task in matching_tasks:
            try:
                _get_task_service().delete_task(task.id, context.user_id, context.db_session)
                deleted_names.append(task.title)
            except Exception:
                logger.exception(f"Failed to delete matching task '{task.title}'")
        if not deleted_names:
            return f"Found {len(matching_tasks)} matching task(s) but could not delete them."
        _mark_operation_performed(context, "delete_by_search", {"count": len(deleted_names)})
        if len(deleted_names) == 1:
            return f"✓ Deleted task '{deleted_names[0]}'."
        return f"✓ Deleted {len(deleted_names)} tasks: " + ", ".join(f"'{n}'" for n in deleted_names)
    except Exception:
        logger.exception("Error deleting tasks by search")
        return "Sorry, I couldn't delete that task. Please try again."


def agent_delete_completed_tasks(ctx: RunContextWrapper) -> str:
    """Delete all completed tasks for the user in one call. Returns the count deleted."""
    context = ctx.context
    try:
        task_service = _get_task_service()
        tasks = task_service.get_tasks(user_id=context.user_id, db_session=context.db_session, completed=True, sort_by="updated_at", order="desc", limit=100, include_tags=False)
        if not tasks:
            return "You have no completed tasks to delete."
        count = 0
        for task in tasks:
            try:
                task_service.delete_task(task.id, context.user_id, context.db_session)
                count += 1
            except Exception:
                logger.exception(f"Failed to delete completed task '{task.title}'")
        _mark_operation_performed(context, "delete_completed_tasks", {"count": count})
        return f"✓ Deleted {count} completed task(s)."
    except Exception:
        logger.exception("Error deleting completed tasks")
        return "Sorry, I couldn't delete completed tasks. Please try again."


def agent_delete_all_tasks(ctx: RunContextWrapper, confirm: bool = False) -> str:
    """Delete ALL tasks for the user. Always send every schema field when calling this tool. Send confirm as a real boolean. Send confirm=true only when the user clearly wants every task deleted; otherwise send confirm=false. Never send booleans as strings. Returns the count of deleted tasks."""
    context = ctx.context
    try:
        if not confirm:
            return "Are you sure you want to delete ALL your tasks? This cannot be undone. Call again with confirm=true to proceed."
        task_service = _get_task_service()
        tasks = task_service.get_tasks(user_id=context.user_id, db_session=context.db_session, limit=200, include_tags=False)
        if not tasks:
            return "You have no tasks to delete."
        count = 0
        for task in tasks:
            try:
                task_service.delete_task(task.id, context.user_id, context.db_session)
                count += 1
            except Exception:
                logger.exception(f"Failed to delete task '{task.title}' during delete-all")
        _mark_operation_performed(context, "delete_all_tasks", {"count": count})
        return f"✓ Deleted {count} task(s). All tasks have been removed."
    except Exception:
        logger.exception("Error deleting all tasks")
        return "Sorry, I couldn't delete all tasks. Please try again."


def agent_search_tasks(ctx: RunContextWrapper, search: str = "", completed: Optional[bool] = None, priority: str = "", limit: int = 10) -> str:
    """Search the user's tasks by text, completion status, or priority. Always send every schema field when calling this tool. Send search as a task title, keyword, or name fragment, and send an empty string when the user wants a broad search. Send completed=true for completed-only results, completed=false for open-only results, and completed=null when no completion filter is needed. Send priority as HIGH, MEDIUM, or LOW, or an empty string when unused. Send limit as an integer. Never send booleans as strings. Returns matching tasks with their titles, statuses, and due dates."""
    context = ctx.context
    try:
        task_service = _get_task_service()
        tasks = task_service.get_tasks(user_id=context.user_id, db_session=context.db_session, search=search if search else None, completed=completed, priority=priority if priority else None, limit=limit, include_tags=False)
        if not tasks:
            return "You don't have any matching tasks."
        result_lines = [f"Found {len(tasks)} task(s):"]
        for task in tasks:
            status = "✓" if task.completed else "○"
            priority_tag = f"[{task.priority}]" if task.priority else ""
            result_lines.append(f"{status} {task.title} {priority_tag}")
            if task.due_date:
                result_lines.append(f"  Due: {task.due_date.strftime('%Y-%m-%d')}")
        return "\n".join(result_lines)
    except Exception:
        logger.exception("Error searching tasks")
        return "Sorry, I couldn't search tasks. Please try again."


def agent_list_tasks(ctx: RunContextWrapper, limit: int = 10) -> str:
    """List the user's pending tasks. Always send limit as an integer. Use this for open tasks only; this tool does not list completed tasks."""
    context = ctx.context
    try:
        task_service = _get_task_service()
        tasks = task_service.get_tasks(user_id=context.user_id, db_session=context.db_session, completed=False, limit=limit, include_tags=False)
        if not tasks:
            return "You don't have any pending tasks. Great job!"
        return "\n".join([f"Here are your pending tasks ({len(tasks)}):", *[f"{'✓' if task.completed else '○'} {task.title} {f'[{task.priority}]' if task.priority else ''}".strip() for task in tasks]])
    except Exception:
        logger.exception("Error listing tasks")
        return "Sorry, I couldn't retrieve tasks. Please try again."


def agent_get_task(ctx: RunContextWrapper, task_id: str) -> str:
    """Get full details of a single task by its ID. Send task_id as a string containing digits like '12'. Use this only when the task ID is already known or verified."""
    context = ctx.context
    try:
        task = _get_task_by_id(context, int(task_id))
        if not task:
            return f"Sorry, I couldn't find task #{task_id}."
        result = f"Task: {task.title}\nStatus: {'Completed' if task.completed else 'Pending'}"
        if task.description:
            result += f"\nDescription: {task.description}"
        if task.due_date:
            result += f"\nDue: {task.due_date.strftime('%Y-%m-%d')}"
        if task.priority:
            result += f"\nPriority: {task.priority}"
        return result
    except Exception:
        logger.exception("Error getting task")
        return "Sorry, I couldn't retrieve the task. Please try again."


def agent_show_conversation_summary(ctx: RunContextWrapper) -> str:
    """Show a summary of recent conversation messages between the user and assistant."""
    context = ctx.context
    try:
        from ..services.chat_service import chat_service
        messages = chat_service.get_recent_messages_for_user(user_id=context.user_id, db_session=context.db_session, limit=20)
        if not messages:
            return "This is the beginning of our conversation! How can I help you with your tasks today?"
        user_msgs = [m for m in messages if m.sender_type == 'USER']
        ai_msgs = [m for m in messages if m.sender_type == 'AI']
        result_lines = [f"Here's what we've discussed ({len(messages)} messages):", f"- {len(user_msgs)} messages from you", f"- {len(ai_msgs)} responses from me", "", "Recent messages:"]
        for msg in messages[-10:]:
            sender = "You" if msg.sender_type == 'USER' else "Me"
            preview = msg.content[:80] + "..." if len(msg.content) > 80 else msg.content
            result_lines.append(f"- {sender}: {preview}")
        return "\n".join(result_lines)
    except Exception:
        logger.exception("Error retrieving conversation summary")
        return "Sorry, I couldn't retrieve the conversation summary."


def agent_get_all_tasks(ctx: RunContextWrapper) -> str:
    """Get all tasks for the user, both completed and pending, up to 50. Use this only when the user explicitly asks for everything."""
    context = ctx.context
    try:
        tasks = _get_task_service().get_tasks(user_id=context.user_id, db_session=context.db_session, limit=50, include_tags=False)
        if not tasks:
            return "You have no tasks."
        return _format_task_lines(tasks, f"Your tasks ({len(tasks)} total):", include_description=False)
    except Exception:
        logger.exception("Error getting all tasks")
        return "Sorry, I couldn't retrieve tasks. Please try again."


def agent_complete_by_search(ctx: RunContextWrapper, search_term: str) -> str:
    """Find incomplete tasks matching a search term and mark them all as completed. Send search_term as the task title or name fragment, not a task ID. Prefer this when the user names a task instead of giving an exact ID. Completes up to 10 matching tasks in one call."""
    context = ctx.context
    try:
        tasks = _find_tasks_for_search(context, search_term, completed=False, limit=10)
        if not tasks:
            return "No incomplete tasks found matching that search."
        completed_names = []
        for task in tasks:
            try:
                _get_task_service().toggle_task_completion(task.id, context.user_id, context.db_session)
                completed_names.append(task.title)
            except Exception:
                logger.exception(f"Failed to complete task '{task.title}'")
        if not completed_names:
            return f"Found {len(tasks)} matching task(s) but could not complete them."
        _mark_operation_performed(context, "complete_by_search", {"count": len(completed_names)})
        if len(completed_names) == 1:
            return f"✓ Marked '{completed_names[0]}' as completed!"
        return f"✓ Completed {len(completed_names)} tasks: " + ", ".join(f"'{n}'" for n in completed_names)
    except Exception:
        logger.exception("Error completing tasks by search")
        return "Sorry, I couldn't complete those tasks. Please try again."


def agent_uncomplete_by_search(ctx: RunContextWrapper, search_term: str) -> str:
    """Find completed tasks matching a search term and reopen them all. Send search_term as the task title or name fragment, not a task ID. Prefer this when the user names a task instead of giving an exact ID. Reopens up to 10 matching tasks in one call."""
    context = ctx.context
    try:
        tasks = _find_tasks_for_search(context, search_term, completed=True, limit=10)
        if not tasks:
            return "No completed tasks found matching that search."
        reopened_names = []
        for task in tasks:
            try:
                _get_task_service().toggle_task_completion(task.id, context.user_id, context.db_session)
                reopened_names.append(task.title)
            except Exception:
                logger.exception(f"Failed to reopen task '{task.title}'")
        if not reopened_names:
            return f"Found {len(tasks)} matching task(s) but could not reopen them."
        _mark_operation_performed(context, "uncomplete_by_search", {"count": len(reopened_names)})
        if len(reopened_names) == 1:
            return f"✓ Reopened '{reopened_names[0]}'!"
        return f"✓ Reopened {len(reopened_names)} tasks: " + ", ".join(f"'{n}'" for n in reopened_names)
    except Exception:
        logger.exception("Error reopening tasks by search")
        return "Sorry, I couldn't reopen those tasks. Please try again."


def agent_update_by_search(ctx: RunContextWrapper, search_term: str, title: str = "", description: str = "", priority: str = "", due_date: str = "", tags: str = "") -> str:
    """Find tasks matching a search term and update the first match with the provided fields. Always send every schema field when calling this tool. Send search_term as the task title or name fragment, not a task ID. Send title, description, priority, due_date, and tags as strings, using an empty string for fields you are not changing. Send priority only as HIGH, MEDIUM, or LOW when provided. Send due_date as a string; this tool accepts relative phrases like 'tomorrow', 'in 2 days', 'next monday', or an ISO date. Send tags as a comma-separated string like 'Coding,Work', or an empty string when unused. Use this when the user refers to a task by name instead of ID. If multiple tasks match, do not guess."""
    context = ctx.context
    try:
        tasks = _find_tasks_for_search(context, search_term, limit=10)
        if not tasks:
            return "You have no matching tasks to update."
        if len(tasks) > 1:
            return _format_task_lines(tasks, f"Multiple tasks match '{search_term}'. Please provide the exact task ID or a more specific task name:")
        from ..schemas.task import TaskUpdateRequest
        update_data = {}
        parsed_due_date = _parse_relative_date(due_date) if due_date else None
        if title:
            update_data["title"] = title
        if description:
            update_data["description"] = description
        if priority:
            update_data["priority"] = priority
        if parsed_due_date:
            update_data["due_date"] = parsed_due_date
        if tags:
            tag_ids = _resolve_tags(context, tags)
            if tag_ids:
                update_data["tag_ids"] = tag_ids
        if not update_data:
            return "Please provide at least one field to update (title, description, priority, due date, or tags)."
        task = tasks[0]
        updated = _get_task_service().update_task(task.id, TaskUpdateRequest(**update_data), context.user_id, context.db_session)
        _mark_operation_performed(context, "update_task", {"task_id": task.id})
        if not updated:
            return f"Sorry, I couldn't update '{task.title}'."
        return f"✓ Updated '{updated.title}' successfully!"
    except Exception:
        logger.exception("Error updating task by search")
        return "Sorry, I couldn't update that task. Please try again."


def _task_to_grounding_line(task, include_description: bool = False) -> str:
    status = "Completed" if task.completed else "Open"
    priority = task.priority or "Not available"
    due = task.due_date.strftime('%Y-%m-%d') if task.due_date else "No due date"
    line = f"ID {task.id} | {status} | Priority {priority} | Due {due} | {task.title}"
    if include_description and task.description:
        return f"{line} | Description: {task.description[:160]}"
    return line


def _response_mentions_unverified_task(response_text: str, grounded_tasks: List[Any]) -> bool:
    grounded_titles = {task.title.lower() for task in grounded_tasks if getattr(task, 'title', None)}
    for title in re.findall(r'"([^"]+)"', response_text or ""):
        if title.lower() not in grounded_titles:
            return True
    return False


def agent_verify_task_answer(ctx: RunContextWrapper, draft_response: str, grounded_task_snapshot: str = "") -> str:
    """Verify that a draft response does not reference task titles or details that do not exist in the user's actual tasks. Always send every schema field when calling this tool. Send draft_response as the candidate final reply. Send grounded_task_snapshot as a grounding summary string when available, or an empty string when unavailable. Returns VERIFIED or UNVERIFIED."""
    context = ctx.context
    grounded_tasks = _find_tasks_for_user_search(context.db_session, context.user_id, "", None, 15)
    if _response_mentions_unverified_task(draft_response, grounded_tasks):
        return "UNVERIFIED: The draft references a task title that is not present in verified task data."
    if "not available" not in draft_response.lower() and grounded_task_snapshot and "not available" in grounded_task_snapshot.lower():
        return "REVIEW: Ensure every field in the response is supported by grounded task data or tool output."
    return "VERIFIED: The draft does not mention any obviously unverified task title."


def agent_confirm_task_exists(ctx: RunContextWrapper, task_id: str) -> str:
    """Check whether a task with the given ID exists for this user. Send task_id as a string containing digits like '12'. Use this before update, delete, or toggle operations when the task ID must be verified."""
    context = ctx.context
    try:
        task = _get_task_by_id(context, int(task_id))
        if not task:
            return f"Task #{task_id} was not found for this user. Do not act on it."
        return f"Verified task #{task.id}: {task.title}"
    except Exception:
        logger.exception(f"Task verification failed for #{task_id}")
        return f"Task verification failed for #{task_id}."


def agent_get_grounded_task_context(ctx: RunContextWrapper, search_term: str = "") -> str:
    """Fetch verified task data for the current user. Always send search_term as a string, using an empty string for broad grounding or a task title/name fragment to narrow the result. Returns compact lines with ID, status, priority, due date, and title. Use this to ground your answer in real data before responding."""
    context = ctx.context
    tasks = _find_tasks_for_user_search(context.db_session, context.user_id, search_term, None, 8)
    if not tasks:
        return "No verified tasks found."
    return "\n".join(_task_to_grounding_line(task, include_description=True) for task in tasks)


class AgentService:
    def __init__(self):
        self._initialized = False
        self._agent = None
        self._verifier_agent = None
        self._Runner = None
        self._Agent = None
        self._RunConfig = None
        self._OpenAIChatCompletionsModel = None
        self._AsyncOpenAI = None
        self._provider_configs = []
        self._tools = []
        self._last_task_context = ""
        self._z_ai_api_key = os.getenv("Z_AI_API_KEY")
        self._z_ai_model = os.getenv("Z_AI_MODEL", "glm-4.7-flash")
        self._groq_api_key = os.getenv("GROQ_API_KEY")
        self._groq_model = os.getenv("GROQ_MODEL", "qwen/qwen3.6-27b")
        self._provider_timeout_seconds = float(os.getenv("AI_PROVIDER_TIMEOUT_SECONDS", "30"))
        self._last_provider_used = None

    def _is_non_task_message(self, content: str) -> bool:
        normalized = content.strip().lower()
        return normalized in {"", "hi", "hello", "hey", "thanks", "thank you", "ok", "okay", "got it", "who are you"}

    def _needs_completed_context(self, content: str) -> bool:
        normalized = content.lower()
        return any(token in normalized for token in ["undo", "uncomplete", "reopen", "finished", "did i finish", "completed"])

    def _build_task_grounding_context(self, content: str, user_id: int, db_session: Session) -> str:
        if self._is_non_task_message(content):
            return ""
        task_service = _get_task_service()
        sections: List[str] = []
        recent_open = task_service.get_tasks(user_id=user_id, db_session=db_session, completed=False, sort_by="updated_at", order="desc", limit=6, include_tags=False)
        if recent_open:
            sections.append("[Recent open tasks]")
            sections.extend(_task_to_grounding_line(task) for task in recent_open)
        likely_matches = _find_tasks_for_user_search(db_session, user_id, content, None, 5)
        if likely_matches:
            sections.append("[Likely relevant tasks]")
            sections.extend(_task_to_grounding_line(task, include_description=True) for task in likely_matches)
        if self._needs_completed_context(content):
            recent_completed = task_service.get_tasks(user_id=user_id, db_session=db_session, completed=True, sort_by="updated_at", order="desc", limit=4, include_tags=False)
            if recent_completed:
                sections.append("[Recent completed tasks]")
                sections.extend(_task_to_grounding_line(task) for task in recent_completed)
        return "\n".join(sections)

    @staticmethod
    def _build_system_prompt(context, agent) -> str:
        return (
            "You are the single customer-facing orchestrator for a task app. Use grounded task context first, use tool output as the source of truth, never invent task fields, and never confirm update/delete/complete/uncomplete actions until the task has been verified to exist. When calling any tool, always provide every field defined in that tool's schema. For unused string fields, send an empty string. For nullable boolean filter fields, send null when the user is not filtering by that boolean. For required booleans like confirmation flags, send a real boolean. Never send booleans as strings. For task IDs, send digit strings like '12'. For named task operations, prefer search-based tools and send task title fragments rather than IDs. For tags fields, send a comma-separated string like 'Coding,Work' or an empty string. For priorities, use only HIGH, MEDIUM, or LOW. For create and update tools, reason about dates before calling tools, but send due_date as a string in the format that tool accepts; these tools can handle relative phrases like 'tomorrow', 'in 2 days', and 'next monday'. Do not use agent_update_task to change completion state. If the user wants to mark tasks complete or incomplete, use agent_toggle_task when you have a verified task ID, agent_complete_by_search when the user names an open task to complete, or agent_uncomplete_by_search when the user names a completed task to reopen. When creating a new task, always include a short useful description even if you must infer it from the user's request. Keep replies polished and concise. Use the verifier tool if you are unsure your final wording is fully supported."
        )

    def _build_input_text(self, content: str, conversation_history: Optional[List[Dict[str, Any]]] = None, user_info: Optional[Dict[str, str]] = None, task_context: str = "") -> str:
        context_parts = []
        if user_info:
            name = user_info.get("name") or user_info.get("first_name")
            if name and name.lower() not in ("there", "friend"):
                context_parts.append(f"[User context: Name is {name}]")
        if conversation_history:
            history_parts = []
            for msg in conversation_history[-5:]:
                sender = "User" if msg.get("sender_type") == "USER" else "Assistant"
                history_parts.append(f"{sender}: {msg.get('content', '')}")
            if history_parts:
                context_parts.append("[Conversation so far]")
                context_parts.extend(history_parts)
        if task_context:
            context_parts.append("[Grounded task context]")
            context_parts.append(task_context)
        if context_parts:
            return "\n".join(context_parts) + f"\n[New message]\n{content}"
        return content

    def _is_retryable_provider_error(self, error: Exception) -> bool:
        message = str(error).lower()
        return any(token in message for token in ["429", "404", "500", "502", "503", "rate limit", "quota", "too many requests", "timeout", "temporarily unavailable", "service unavailable", "connection", "no endpoints found", "not found", "model not found", "internal server error"])

    def _has_any_provider_key(self) -> bool:
        return bool(self._z_ai_api_key or self._groq_api_key)

    def _has_configured_providers(self) -> bool:
        return len(self._provider_configs) > 0

    def _get_model_used_label(self, provider_label: str) -> str:
        return f"OpenAI Agents SDK ({provider_label})"

    def _provider_unavailable_response(self) -> Dict[str, Any]:
        return {"success": False, "error": "OpenAI Agents SDK not available", "content": "I'm sorry, the AI service is not available right now. Please try again later."}

    def _provider_graceful_failure_response(self) -> Dict[str, Any]:
        return {"success": False, "error": "All configured AI providers failed", "content": "I'm sorry, all configured AI providers are temporarily unavailable. Please try again in a moment."}

    def _provider_unavailable_stream_event(self) -> Dict[str, Any]:
        return {"type": "error", "content": "I'm sorry, the AI service is not available right now. Please try again later."}

    def _provider_stream_error_event(self) -> Dict[str, Any]:
        return {"type": "error", "content": "I'm sorry, all configured AI providers are temporarily unavailable. Please try again in a moment."}

    def _provider_result_output_text(self, result) -> str:
        return result.final_output if result.final_output else "I'm sorry, I couldn't process that request."

    def _post_validate_response(self, response_text: str, operation_performed: Optional[Dict[str, Any]], context: ToolContext) -> str:
        if not response_text:
            return response_text
        grounded_tasks = _find_tasks_for_user_search(context.db_session, context.user_id, "", None, 20)
        if _response_mentions_unverified_task(response_text, grounded_tasks):
            return "I need to double-check that task before I answer so I don't act on the wrong one. Please ask me to search or specify the task more precisely."
        if operation_performed and operation_performed.get("task_id"):
            if not _get_task_by_id(context, operation_performed["task_id"]):
                return "I could not verify that task exists, so I'm not going to confirm an action on it. Please try again with the exact task or ask me to search first."
        return response_text

    async def _run_verifier_tool(self, provider: Dict[str, Any], draft_response: str) -> Optional[str]:
        if not self._verifier_agent:
            return None
        verifier_input = f"[Grounded task context]\n{self._last_task_context or 'No grounded task context provided.'}\n\n[Draft response]\n{draft_response}"
        result = await asyncio.wait_for(self._Runner.run(self._verifier_agent, input=verifier_input, run_config=provider["run_config"]), timeout=min(self._provider_timeout_seconds, 12))
        return result.final_output if getattr(result, "final_output", None) else None

    async def _run_verifier_with_fallback(self, draft_response: str) -> Optional[str]:
        if not self._verifier_agent or not self._has_configured_providers():
            return None
        for provider in self._provider_configs:
            try:
                return await self._run_verifier_tool(provider, draft_response)
            except Exception as error:
                logger.warning(f"Verifier agent failed on provider {provider['label']}: {error}")
        return None

    async def _finalize_response_text(self, response_text: str, operation_performed: Optional[Dict[str, Any]], context: ToolContext) -> str:
        if operation_performed:
            return response_text
        return self._post_validate_response(response_text, None, context)

    async def _build_final_response(self, result, provider_label: str, context: ToolContext) -> Dict[str, Any]:
        operation_performed = self._extract_operations(result, context)
        final_content = await self._finalize_response_text(self._provider_result_output_text(result), operation_performed, context)
        return {"success": True, "content": final_content, "operation_performed": operation_performed, "model_used": self._get_model_used_label(provider_label)}

    async def _build_stream_final(self, result, provider_label: str, context: ToolContext) -> Dict[str, Any]:
        operation_performed = self._extract_operations(result, context)
        final_content = self._provider_result_output_text(result)
        return {"type": "final", "content": final_content, "operation_performed": operation_performed, "model_used": self._get_model_used_label(provider_label)}

    async def _run_provider(self, provider: Dict[str, Any], input_text: str, context: ToolContext):
        return await asyncio.wait_for(self._Runner.run(self._agent, input=input_text, context=context, run_config=provider["run_config"]), timeout=self._provider_timeout_seconds)

    async def _run_provider_streamed(self, provider: Dict[str, Any], input_text: str, context: ToolContext):
        return self._Runner.run_streamed(self._agent, input=input_text, context=context, run_config=provider["run_config"])

    async def _run_with_provider_fallback(self, input_text: str, context: ToolContext):
        if not self._has_configured_providers():
            raise RuntimeError("No AI providers are configured")
        last_error = None
        for index, provider in enumerate(self._provider_configs):
            provider_label = provider["label"]
            try:
                result = await self._run_provider(provider, input_text, context)
                self._last_provider_used = provider_label
                return result, provider_label
            except Exception as error:
                last_error = error
                if index < len(self._provider_configs) - 1 and self._is_retryable_provider_error(error):
                    logger.warning(f"Provider {provider_label} failed, trying next provider: {error}")
                    continue
                raise
        raise last_error or RuntimeError("All AI providers failed")

    async def _run_streamed_with_provider_fallback(self, input_text: str, context: ToolContext) -> Tuple[Any, str]:
        if not self._has_configured_providers():
            raise RuntimeError("No AI providers are configured")
        last_error = None
        for index, provider in enumerate(self._provider_configs):
            provider_label = provider["label"]
            try:
                streamed_result = await self._run_provider_streamed(provider, input_text, context)
                self._last_provider_used = provider_label
                return streamed_result, provider_label
            except Exception as error:
                last_error = error
                if index < len(self._provider_configs) - 1 and self._is_retryable_provider_error(error):
                    logger.warning(f"Streaming provider {provider_label} failed, trying next provider: {error}")
                    continue
                raise
        raise last_error or RuntimeError("All AI providers failed")

    def _create_provider_configs(self):
        from agents import ModelSettings
        self._provider_configs = []
        response_settings = ModelSettings(max_tokens=4096)
        if self._groq_api_key:
            groq_client = self._AsyncOpenAI(api_key=self._groq_api_key, base_url="https://api.groq.com/openai/v1")
            groq_model = self._OpenAIChatCompletionsModel(model=self._groq_model, openai_client=groq_client)
            self._provider_configs.append({"label": "Groq", "run_config": self._RunConfig(model=groq_model, model_provider=groq_client, model_settings=response_settings, tracing_disabled=True)})
        if self._z_ai_api_key:
            z_client = self._AsyncOpenAI(api_key=self._z_ai_api_key, base_url="https://api.z.ai/api/paas/v4/")
            z_model = self._OpenAIChatCompletionsModel(model=self._z_ai_model, openai_client=z_client)
            self._provider_configs.append({"label": "Z.ai", "run_config": self._RunConfig(model=z_model, model_provider=z_client, model_settings=response_settings, tracing_disabled=True)})
        return self._provider_configs

    def initialize(self):
        if self._initialized:
            return
        try:
            from agents import Agent, OpenAIChatCompletionsModel, RunConfig, Runner, function_tool
            from openai import AsyncOpenAI
            self._Agent = Agent
            self._Runner = Runner
            self._RunConfig = RunConfig
            self._OpenAIChatCompletionsModel = OpenAIChatCompletionsModel
            self._AsyncOpenAI = AsyncOpenAI
            if not self._has_any_provider_key():
                logger.warning("No AI provider keys found, OpenAI Agents SDK will not be available")
                return
            self._create_provider_configs()
            if not self._has_configured_providers():
                logger.warning("No AI providers could be initialized")
                return
            self._verifier_agent = Agent(name="TaskAnswerVerifier", instructions="Return 'UNVERIFIED: ...' if the draft mentions unsupported task claims, otherwise return 'VERIFIED: ...'.")
            self._tools = [
                function_tool(agent_create_task), function_tool(agent_create_tag), function_tool(agent_get_all_tasks), function_tool(agent_get_current_date), function_tool(agent_list_tags),
                function_tool(agent_update_task), function_tool(agent_update_by_search), function_tool(agent_toggle_task), function_tool(agent_complete_by_search), function_tool(agent_uncomplete_by_search),
                function_tool(agent_delete_task), function_tool(agent_delete_by_search), function_tool(agent_delete_completed_tasks), function_tool(agent_delete_all_tasks), function_tool(agent_search_tasks), function_tool(agent_list_tasks), function_tool(agent_get_task),
                function_tool(agent_show_conversation_summary), function_tool(agent_get_grounded_task_context), function_tool(agent_confirm_task_exists), function_tool(agent_verify_task_answer),
                self._verifier_agent.as_tool(tool_name="task_answer_verifier", tool_description="Check whether a draft task response is supported by grounded task evidence before the final reply."),
            ]
            # Normalize tool schemas for providers that require strict object schemas.
            for tool in self._tools:
                schema = getattr(tool, "params_json_schema", None)
                if isinstance(schema, dict):
                    schema.pop("title", None)
                    if schema.get("type") == "object":
                        properties = schema.setdefault("properties", {})
                        if not isinstance(properties, dict):
                            properties = {}
                            schema["properties"] = properties
                        schema["required"] = list(properties.keys())
                        schema["additionalProperties"] = False
                    elif "required" in schema and schema["required"] is None:
                        schema.pop("required", None)
            self._agent = Agent(name="TaskManagerOrchestrator", instructions=self._build_system_prompt, tools=self._tools)
            self._initialized = True
        except ImportError as error:
            logger.warning(f"OpenAI Agents SDK not available: {error}")
        except Exception as error:
            logger.error(f"Failed to initialize OpenAI Agents SDK: {error}")

    def is_available(self) -> bool:
        return self._initialized and self._agent is not None and self._Runner is not None and self._has_configured_providers()

    async def process_message(self, content: str, user_id: int, db_session: Session, conversation_history: Optional[List[Dict[str, Any]]] = None, user_info: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        if not self.is_available():
            return self._provider_unavailable_response()
        tool_context = ToolContext(db_session=db_session, user_id=user_id)
        try:
            self._last_task_context = self._build_task_grounding_context(content, user_id, db_session)
            input_text = self._build_input_text(content, conversation_history, user_info, self._last_task_context)
            result, provider_label = await self._run_with_provider_fallback(input_text, tool_context)
            return await self._build_final_response(result, provider_label, tool_context)
        except Exception as error:
            logger.exception(f"Error processing message with OpenAI Agents SDK: {error}")
            return self._provider_graceful_failure_response()
        finally:
            self._last_task_context = ""

    async def process_message_streamed(self, content: str, user_id: int, db_session: Session, conversation_history: Optional[List[Dict[str, Any]]] = None, user_info: Optional[Dict[str, str]] = None) -> AsyncIterator[Dict[str, Any]]:
        if not self.is_available():
            yield self._provider_unavailable_stream_event()
            return
        tool_context = ToolContext(db_session=db_session, user_id=user_id)
        try:
            self._last_task_context = self._build_task_grounding_context(content, user_id, db_session)
            input_text = self._build_input_text(content, conversation_history, user_info, self._last_task_context)
            streamed_result, provider_label = await self._run_streamed_with_provider_fallback(input_text, tool_context)
            async for event in streamed_result.stream_events():
                if event.type == "raw_response_event":
                    data = getattr(event, "data", None)
                    # The SDK surfaces Responses-API style events; text deltas
                    # arrive as response.output_text.delta. Older paths expose
                    # raw chat completion chunks instead.
                    if getattr(data, "type", "") == "response.output_text.delta":
                        delta_text = getattr(data, "delta", None)
                        if delta_text:
                            yield {"type": "content_delta", "content": delta_text}
                    else:
                        choices = getattr(data, "choices", None)
                        if choices:
                            delta_text = getattr(getattr(choices[0], "delta", None), "content", None)
                            if delta_text:
                                yield {"type": "content_delta", "content": delta_text}
                elif event.type == "run_item_stream_event":
                    item = getattr(event, "item", None)
                    item_type = getattr(item, "type", "")
                    if item_type == "tool_call_item":
                        raw_item = getattr(item, "raw_item", None)
                        tool_name = getattr(raw_item, "name", "tool") or "tool"
                        tool_args = getattr(raw_item, "arguments", None)
                        yield {"type": "tool_call", "tool": tool_name, "args": tool_args}
                    elif item_type == "tool_call_output_item":
                        yield {"type": "tool_output", "output": getattr(item, "output", None)}
            yield await self._build_stream_final(streamed_result, provider_label, tool_context)
        except Exception as error:
            logger.exception(f"Error processing message with OpenAI Agents SDK (streamed): {error}")
            yield self._provider_stream_error_event()
        finally:
            self._last_task_context = ""

    def _extract_operations(self, result, context: ToolContext) -> Optional[Dict[str, Any]]:
        if context.operation_performed:
            return context.operation_performed
        try:
            if hasattr(result, 'new_items') and result.new_items:
                for item in result.new_items:
                    if hasattr(item, 'type') and 'tool_call' in str(item.type):
                        return {"type": "tool_call", "tool_used": getattr(item, 'name', 'unknown')}
            if hasattr(result, 'raw_responses') and result.raw_responses:
                return {"type": "tool_call", "count": len(result.raw_responses)}
            if hasattr(result, 'final_output') and result.final_output:
                output = result.final_output
                if any(keyword in output for keyword in ['✓ Task', 'created successfully!', 'updated successfully!', 'deleted successfully!', 'is now', 'Deleted']):
                    return {"type": "task_operation", "indicated_by": "response_content"}
            if hasattr(result, 'context') and result.context and hasattr(result.context, 'tool_calls') and result.context.tool_calls:
                return {"type": "tool_call", "count": len(result.context.tool_calls)}
        except Exception:
            pass
        return None


agent_service = AgentService()
