"""
Task CRUD Tools for AI Chatbot Operations

These tools provide a controlled interface for the AI to perform
task operations through the existing task service.
"""

import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
from sqlmodel import Session
from ..services.task_service import task_service
from ..schemas.task import TaskCreateRequest, TaskUpdateRequest
from pydantic import BaseModel, Field
from enum import Enum


logger = logging.getLogger(__name__)


class PriorityEnum(str, Enum):
    """Enum for task priority levels"""
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class TaskCreationParams(BaseModel):
    """Parameters for creating a task via AI"""
    title: str = Field(..., description="Task title")
    description: Optional[str] = Field(None, description="Task description")
    priority: Optional[PriorityEnum] = Field(None, description="Task priority")
    due_date: Optional[str] = Field(None, description="Task due date (ISO format)")


class TaskUpdateParams(BaseModel):
    """Parameters for updating a task via AI"""
    task_id: int = Field(..., description="ID of the task to update")
    title: Optional[str] = Field(None, description="New task title")
    description: Optional[str] = Field(None, description="New task description")
    completed: Optional[bool] = Field(None, description="Mark task as completed/uncompleted")
    priority: Optional[PriorityEnum] = Field(None, description="New task priority")


class TaskSearchParams(BaseModel):
    """Parameters for searching tasks via AI"""
    search: Optional[str] = Field(None, description="Search term")
    completed: Optional[bool] = Field(None, description="Filter by completion status")
    priority: Optional[PriorityEnum] = Field(None, description="Filter by priority")
    limit: Optional[int] = Field(10, description="Maximum results to return")


class TaskCRUDTools:
    """
    Tools for performing CRUD operations on tasks through AI chatbot.
    All operations respect user authentication and authorization.
    """

    def __init__(self):
        pass

    def create_task(
        self,
        params: Dict[str, Any],
        user_id: int,
        db_session: Session
    ) -> Dict[str, Any]:
        """
        Create a new task for the user.

        Args:
            params: Dictionary containing task parameters (title, description, priority, due_date)
            user_id: Internal user ID
            db_session: Database session

        Returns:
            Dictionary with created task information
        """
        try:
            # Validate and parse parameters
            validated_params = TaskCreationParams(**params)

            # Convert to TaskCreateRequest
            task_data = TaskCreateRequest(
                title=validated_params.title,
                description=validated_params.description,
                priority=validated_params.priority.value if validated_params.priority else None,
                due_date=None  # Parse from string if needed
            )

            # Parse due_date if provided
            if validated_params.due_date:
                try:
                    task_data.due_date = datetime.fromisoformat(validated_params.due_date.replace('Z', '+00:00'))
                except ValueError:
                    logger.warning(f"Failed to parse due_date: {validated_params.due_date}")

            # Create task using task service
            task = task_service.create_task(task_data, user_id, db_session)

            logger.info(f"AI created task {task.id} for user {user_id}")

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
            logger.error(f"Error creating task via AI: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to create task. Please check your input."
            }

    def update_task(
        self,
        params: Dict[str, Any],
        user_id: int,
        db_session: Session
    ) -> Dict[str, Any]:
        """
        Update an existing task.

        Args:
            params: Dictionary containing update parameters (task_id, and fields to update)
            user_id: Internal user ID
            db_session: Database session

        Returns:
            Dictionary with updated task information
        """
        try:
            # Validate and parse parameters
            validated_params = TaskUpdateParams(**params)

            # Get current task
            current_task = task_service.get_task_by_id(validated_params.task_id, user_id, db_session)
            if not current_task:
                return {
                    "success": False,
                    "error": "Task not found",
                    "message": "Could not find the task to update."
                }

            # Build update data
            update_data = {}
            if validated_params.title is not None:
                update_data["title"] = validated_params.title
            if validated_params.description is not None:
                update_data["description"] = validated_params.description
            if validated_params.completed is not None:
                update_data["completed"] = validated_params.completed
            if validated_params.priority is not None:
                update_data["priority"] = validated_params.priority.value

            # Create update request
            task_update = TaskUpdateRequest(**update_data)

            # Update task
            updated_task = task_service.update_task(
                validated_params.task_id,
                task_update,
                user_id,
                db_session
            )

            logger.info(f"AI updated task {validated_params.task_id} for user {user_id}")

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
            logger.error(f"Error updating task via AI: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to update task. Please check your input."
            }

    def toggle_task_completion(
        self,
        task_id: int,
        user_id: int,
        db_session: Session
    ) -> Dict[str, Any]:
        """
        Toggle the completion status of a task.

        Args:
            task_id: ID of the task to toggle
            user_id: Internal user ID
            db_session: Database session

        Returns:
            Dictionary with updated task information
        """
        try:
            task = task_service.toggle_task_completion(task_id, user_id, db_session)

            status = "completed" if task.completed else "not completed"
            logger.info(f"AI toggled task {task_id} completion to {status} for user {user_id}")

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
            logger.error(f"Error toggling task completion via AI: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to update task status."
            }

    def delete_task(
        self,
        task_id: int,
        user_id: int,
        db_session: Session
    ) -> Dict[str, Any]:
        """
        Delete a task.

        Args:
            task_id: ID of the task to delete
            user_id: Internal user ID
            db_session: Database session

        Returns:
            Dictionary with deletion result
        """
        try:
            # Get task first for confirmation message
            task = task_service.get_task_by_id(task_id, user_id, db_session)
            if not task:
                return {
                    "success": False,
                    "error": "Task not found",
                    "message": "Could not find the task to delete."
                }

            # Delete task
            success = task_service.delete_task(task_id, user_id, db_session)

            if success:
                logger.info(f"AI deleted task {task_id} for user {user_id}")
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
            logger.error(f"Error deleting task via AI: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to delete task."
            }

    def search_tasks(
        self,
        params: Dict[str, Any],
        user_id: int,
        db_session: Session
    ) -> Dict[str, Any]:
        """
        Search for tasks based on criteria.

        Args:
            params: Dictionary containing search parameters
            user_id: Internal user ID
            db_session: Database session

        Returns:
            Dictionary with search results
        """
        try:
            # Validate and parse parameters
            validated_params = TaskSearchParams(**params)

            # Search tasks using task service
            tasks = task_service.get_tasks(
                user_id=user_id,
                db_session=db_session,
                search=validated_params.search,
                completed=validated_params.completed,
                priority=validated_params.priority.value if validated_params.priority else None,
                limit=validated_params.limit
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

            logger.info(f"AI searched tasks for user {user_id}, found {len(task_list)} results")

            return {
                "success": True,
                "tasks": task_list,
                "count": len(task_list),
                "message": f"Found {len(task_list)} task(s)."
            }
        except Exception as e:
            logger.error(f"Error searching tasks via AI: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to search tasks."
            }

    def list_today_tasks(
        self,
        user_id: int,
        db_session: Session
    ) -> Dict[str, Any]:
        """
        List all tasks due today.

        Args:
            user_id: Internal user ID
            db_session: Database session

        Returns:
            Dictionary with today's tasks
        """
        try:
            today = datetime.now().strftime("%Y-%m-%d")

            tasks = task_service.get_tasks(
                user_id=user_id,
                db_session=db_session,
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

            logger.info(f"AI listed {len(today_tasks)} tasks for today for user {user_id}")

            return {
                "success": True,
                "tasks": today_tasks,
                "count": len(today_tasks),
                "message": f"You have {len(today_tasks)} task(s) due today."
            }
        except Exception as e:
            logger.error(f"Error listing today's tasks via AI: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to retrieve today's tasks."
            }

    def get_task_by_search_term(
        self,
        search_term: str,
        user_id: int,
        db_session: Session
    ) -> Optional[Dict[str, Any]]:
        """
        Find a task by searching for it in the title or description.

        Args:
            search_term: Term to search for
            user_id: Internal user ID
            db_session: Database session

        Returns:
            Dictionary with task information or None if not found
        """
        try:
            tasks = task_service.get_tasks(
                user_id=user_id,
                db_session=db_session,
                search=search_term,
                limit=5
            )

            if tasks:
                # Return the first matching task
                task = tasks[0]
                return {
                    "id": task.id,
                    "title": task.title,
                    "description": task.description,
                    "completed": task.completed,
                    "priority": task.priority,
                    "due_date": task.due_date.isoformat() if task.due_date else None,
                }

            return None
        except Exception as e:
            logger.error(f"Error finding task by search term: {str(e)}")
            return None


# Singleton instance
task_crud_tools = TaskCRUDTools()