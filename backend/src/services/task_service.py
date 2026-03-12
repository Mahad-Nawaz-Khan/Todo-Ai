from sqlmodel import Session, select, and_
from typing import List, Optional
from ..models.task import Task
from ..models.tag import Tag
from ..models.user import User
from fastapi import HTTPException
from ..schemas.task import TaskCreateRequest, TaskUpdateRequest
from pydantic import BaseModel
from datetime import datetime, timedelta
from sqlalchemy.orm import selectinload
import re
import logging


class TaskService:
    def __init__(self):
        pass

    def _get_tags_for_user(
        self,
        tag_ids: List[int],
        user_id: int,
        db_session: Session,
    ) -> List[Tag]:
        if not tag_ids:
            return []

        unique_ids = list(dict.fromkeys([int(tag_id) for tag_id in tag_ids]))
        tags = db_session.exec(
            select(Tag).where(and_(Tag.user_id == user_id, Tag.id.in_(unique_ids)))
        ).all()

        if len(tags) != len(unique_ids):
            raise ValueError("One or more tags not found for this user")

        return tags

    def create_task(
        self,
        task_data: TaskCreateRequest,
        user_id: int,
        db_session: Session
    ) -> Task:
        """
        Create a new task for a user
        """
        try:
            # Validate task data
            if not task_data.title or len(task_data.title.strip()) == 0:
                raise ValueError("Task title is required")

            if len(task_data.title.strip()) > 255:
                raise ValueError("Task title must be less than 255 characters")

            # Handle due_date conversion if provided as string
            due_date = task_data.due_date
            if due_date and isinstance(due_date, str):
                try:
                    from datetime import datetime
                    due_date = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
                except ValueError:
                    # If parsing fails, set to None
                    due_date = None

            # Create task object
            tags: List[Tag] = []
            if getattr(task_data, "tag_ids", None):
                tags = self._get_tags_for_user(task_data.tag_ids, user_id, db_session)

            task = Task(
                title=task_data.title,
                description=task_data.description,
                completed=False,  # New tasks are not completed by default
                priority=task_data.priority.value if task_data.priority else None,  # Convert enum to string
                due_date=due_date,
                recurrence_rule=task_data.recurrence_rule.value if task_data.recurrence_rule else None,
                user_id=user_id
            )

            task.tags = tags

            db_session.add(task)
            db_session.commit()
            db_session.refresh(task)

            logging.info(f"Task created successfully with ID: {task.id} for user: {user_id}")
            return task
        except ValueError as ve:
            logging.error(f"Validation error creating task for user {user_id}: {str(ve)}")
            raise ve
        except Exception as e:
            logging.exception(f"Error creating task for user {user_id}: {str(e)}")
            db_session.rollback()
            raise HTTPException(status_code=500, detail="Failed to create task")

    def get_tasks(
        self,
        user_id: int,
        db_session: Session,
        completed: Optional[bool] = None,
        priority: Optional[str] = None,
        due_date_from: Optional[str] = None,
        due_date_to: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: Optional[str] = "created_at",
        order: Optional[str] = "desc",
        limit: Optional[int] = 10,
        offset: Optional[int] = 0
    ) -> List[Task]:
        """
        Get all tasks for a user with optional filters
        """
        try:
            # Validate parameters
            if limit is not None and limit > 100:
                raise ValueError("Limit cannot exceed 100")
            if offset is not None and offset < 0:
                raise ValueError("Offset cannot be negative")
            if sort_by not in ["created_at", "updated_at", "due_date", "priority"]:
                raise ValueError(f"Invalid sort_by value: {sort_by}")
            if order not in ["asc", "desc"]:
                raise ValueError(f"Invalid order value: {order}")

            # Start with base query for user's tasks
            query = select(Task).where(Task.user_id == user_id).options(selectinload(Task.tags))

            # Apply filters
            if completed is not None:
                query = query.where(Task.completed == completed)

            if priority is not None:
                if priority not in ["LOW", "MEDIUM", "HIGH"]:
                    raise ValueError(f"Invalid priority value: {priority}")
                query = query.where(Task.priority == priority)

            if due_date_from is not None:
                date_from = datetime.fromisoformat(due_date_from)
                query = query.where(Task.due_date >= date_from)

            if due_date_to is not None:
                date_to = datetime.fromisoformat(due_date_to)
                query = query.where(Task.due_date <= date_to)

            if search is not None:
                query = query.where(
                    Task.title.contains(search) | Task.description.contains(search)
                )

            # Apply sorting
            if sort_by == "created_at":
                if order == "desc":
                    query = query.order_by(Task.created_at.desc())
                else:
                    query = query.order_by(Task.created_at.asc())
            elif sort_by == "updated_at":
                if order == "desc":
                    query = query.order_by(Task.updated_at.desc())
                else:
                    query = query.order_by(Task.updated_at.asc())
            elif sort_by == "due_date":
                if order == "desc":
                    query = query.order_by(Task.due_date.desc())
                else:
                    query = query.order_by(Task.due_date.asc())
            elif sort_by == "priority":
                if order == "desc":
                    query = query.order_by(Task.priority.desc())
                else:
                    query = query.order_by(Task.priority.asc())

            # Apply pagination
            query = query.offset(offset).limit(limit)

            tasks = db_session.exec(query).all()
            logging.info(f"Retrieved {len(tasks)} tasks for user: {user_id}")
            return tasks
        except ValueError as ve:
            logging.error(f"Validation error getting tasks for user {user_id}: {str(ve)}")
            raise ve
        except Exception as e:
            logging.error(f"Error getting tasks for user {user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to retrieve tasks")

    def get_task_by_id(
        self,
        task_id: int,
        user_id: int,
        db_session: Session
    ) -> Optional[Task]:
        """
        Get a specific task by ID for a user
        """
        try:
            # Validate parameters
            if task_id <= 0:
                raise ValueError("Task ID must be positive")
            if user_id <= 0:
                raise ValueError("User ID must be positive")

            statement = (
                select(Task)
                .where(and_(Task.id == task_id, Task.user_id == user_id))
                .options(selectinload(Task.tags))
            )
            task = db_session.exec(statement).first()
            return task
        except ValueError as ve:
            logging.error(f"Validation error getting task {task_id} for user {user_id}: {str(ve)}")
            raise ve
        except Exception as e:
            logging.error(f"Error getting task {task_id} for user {user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to retrieve task")

    def update_task(
        self,
        task_id: int,
        task_data: TaskUpdateRequest,
        user_id: int,
        db_session: Session
    ) -> Optional[Task]:
        """
        Update a task for a user
        """
        try:
            # Validate parameters
            if task_id <= 0:
                raise ValueError("Task ID must be positive")
            if user_id <= 0:
                raise ValueError("User ID must be positive")

            # Validate task data
            if task_data.title and len(task_data.title.strip()) > 255:
                raise ValueError("Task title must be less than 255 characters")

            task = self.get_task_by_id(task_id, user_id, db_session)
            if not task:
                return None

            # Update fields that are provided in task_data
            update_data = task_data.model_dump(exclude_unset=True)
            tag_ids = update_data.pop("tag_ids", None)
            for field, value in update_data.items():
                if hasattr(task, field) and field != "id":
                    # Convert enum to string if it's a priority field
                    if field == "priority" and hasattr(value, 'value'):
                        setattr(task, field, str(value.value))
                    elif field == "recurrence_rule" and hasattr(value, 'value'):
                        setattr(task, field, str(value.value))
                    elif field == "priority" and isinstance(value, str):
                        setattr(task, field, value)
                    else:
                        setattr(task, field, value)

            if tag_ids is not None:
                task.tags = self._get_tags_for_user(tag_ids, user_id, db_session)

            # Update the updated_at timestamp
            task.updated_at = datetime.utcnow()

            db_session.add(task)
            db_session.commit()
            db_session.refresh(task)

            logging.info(f"Task updated successfully with ID: {task.id} for user: {user_id}")
            return task
        except ValueError as ve:
            logging.error(f"Validation error updating task {task_id} for user {user_id}: {str(ve)}")
            raise ve
        except Exception as e:
            logging.exception(f"Error updating task {task_id} for user {user_id}: {str(e)}")
            db_session.rollback()
            raise HTTPException(status_code=500, detail="Failed to update task")

    def delete_task(
        self,
        task_id: int,
        user_id: int,
        db_session: Session
    ) -> bool:
        """
        Delete a task for a user
        """
        try:
            # Validate parameters
            if task_id <= 0:
                raise ValueError("Task ID must be positive")
            if user_id <= 0:
                raise ValueError("User ID must be positive")

            task = self.get_task_by_id(task_id, user_id, db_session)
            if not task:
                return False

            db_session.delete(task)
            db_session.commit()

            logging.info(f"Task deleted successfully with ID: {task_id} for user: {user_id}")
            return True
        except ValueError as ve:
            logging.error(f"Validation error deleting task {task_id} for user {user_id}: {str(ve)}")
            raise ve
        except Exception as e:
            logging.error(f"Error deleting task {task_id} for user {user_id}: {str(e)}")
            db_session.rollback()
            raise HTTPException(status_code=500, detail="Failed to delete task")

    def toggle_task_completion(
        self,
        task_id: int,
        user_id: int,
        db_session: Session
    ) -> Optional[Task]:
        """
        Toggle the completion status of a task.

        Returns:
            The toggled task. If the task has recurrence and is being marked complete,
            also creates a new recurring instance (which will be added to the database
            but not returned - the client should refresh to see it).

        Note: When a recurring task is completed, we:
        1. Mark the original task as completed
        2. Create a new uncompleted instance for the next period
        3. Return the original (now completed) task
        """
        try:
            # Validate parameters
            if task_id <= 0:
                raise ValueError("Task ID must be positive")
            if user_id <= 0:
                raise ValueError("User ID must be positive")

            task = self.get_task_by_id(task_id, user_id, db_session)
            if not task:
                return None

            # Toggle the completed status
            task.completed = not task.completed
            task.updated_at = datetime.utcnow()

            db_session.add(task)
            db_session.commit()
            db_session.refresh(task)

            # If marking as complete and task has recurrence, create the next instance
            if task.completed and task.recurrence_rule:
                new_task = self._handle_recurrence(task, db_session)
                logging.info(f"Task {task_id} completed with recurrence. Created new instance: {new_task.id}")
            else:
                logging.info(f"Task completion toggled for task ID: {task.id} for user: {user_id}")

            return task
        except ValueError as ve:
            logging.error(f"Validation error toggling task completion {task_id} for user {user_id}: {str(ve)}")
            raise ve
        except Exception as e:
            logging.error(f"Error toggling task completion {task_id} for user {user_id}: {str(e)}")
            db_session.rollback()
            raise HTTPException(status_code=500, detail="Failed to toggle task completion")

    def _handle_recurrence(self, task: Task, db_session: Session) -> Task:
        """
        Handle recurrence logic when a recurring task is completed
        Creates a new instance of the task based on recurrence rules
        """
        # Parse the recurrence rule (simple format: "daily", "weekly", "monthly", "yearly"
        # or more complex like "every 3 days", "every 2 weeks", etc.)
        next_due_date = self._calculate_next_due_date(task.due_date, task.recurrence_rule)

        # Create a new task with the same properties but reset completion
        new_task = Task(
            title=task.title,
            description=task.description,
            completed=False,  # New instance is not completed
            priority=task.priority,
            due_date=next_due_date,
            recurrence_rule=task.recurrence_rule,
            user_id=task.user_id
        )

        new_task.tags = list(task.tags) if getattr(task, "tags", None) else []

        db_session.add(new_task)
        db_session.commit()
        db_session.refresh(new_task)

        return new_task

    def _calculate_next_due_date(self, current_due_date: Optional[datetime], recurrence_rule: Optional[str]) -> Optional[datetime]:
        """
        Calculate the next due date based on the recurrence rule
        """
        if not current_due_date or not recurrence_rule:
            return current_due_date

        # Simple recurrence rule parsing
        recurrence_rule_lower = recurrence_rule.lower()

        if recurrence_rule_lower == "daily":
            return current_due_date + timedelta(days=1)
        elif recurrence_rule_lower == "weekly":
            return current_due_date + timedelta(weeks=1)
        elif recurrence_rule_lower == "monthly":
            # For monthly, add 1 month (approximately 30 days)
            return current_due_date + timedelta(days=30)
        elif recurrence_rule_lower == "yearly":
            return current_due_date + timedelta(days=365)
        elif recurrence_rule_lower.startswith("every"):
            # Handle "every X days/weeks/months" format
            match = re.search(r"every (\d+) (day|week|month|year)s?", recurrence_rule_lower)
            if match:
                number = int(match.group(1))
                unit = match.group(2)

                if unit == "day":
                    return current_due_date + timedelta(days=number)
                elif unit == "week":
                    return current_due_date + timedelta(weeks=number)
                elif unit == "month":
                    # Approximate month as 30 days
                    return current_due_date + timedelta(days=number * 30)
                elif unit == "year":
                    return current_due_date + timedelta(days=number * 365)

        # If we can't parse the rule, return the current due date
        return current_due_date


# Create a singleton instance
task_service = TaskService()