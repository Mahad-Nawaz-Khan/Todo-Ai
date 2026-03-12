from fastapi import APIRouter, Depends, HTTPException, Query, Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from sqlmodel import Session
from typing import List, Optional
from ..middleware.auth import get_current_user
from ..database import get_session
from ..services.task_service import task_service
from ..services.auth_service import auth_service
from ..schemas.task import TaskResponse, TaskCreateRequest, TaskUpdateRequest, TagResponse
from typing import Dict, Any

# Initialize rate limiter for this router
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/api/v1", tags=["tasks"])


def _task_to_response(task) -> TaskResponse:
    return TaskResponse(
        id=task.id,
        title=task.title,
        description=task.description,
        completed=task.completed,
        priority=task.priority,
        due_date=task.due_date,
        recurrence_rule=task.recurrence_rule,
        created_at=task.created_at,
        updated_at=task.updated_at,
        tags=[
            TagResponse(
                id=tag.id,
                name=tag.name,
                color=tag.color,
                priority=tag.priority,
                user_id=tag.user_id,
                created_at=tag.created_at,
            )
            for tag in (getattr(task, "tags", None) or [])
        ],
    )


@router.get("/tasks", response_model=List[TaskResponse])
@limiter.limit("100/minute")  # 100 requests per minute for authenticated users
async def get_tasks(
    request: Request,  # Required for rate limiting
    completed: Optional[bool] = Query(None, description="Filter by completion status"),
    priority: Optional[str] = Query(None, description="Filter by priority level (HIGH, MEDIUM, LOW)"),
    due_date_from: Optional[str] = Query(None, description="Filter tasks with due date after this date"),
    due_date_to: Optional[str] = Query(None, description="Filter tasks with due date before this date"),
    search: Optional[str] = Query(None, description="Search in title and description"),
    sort_by: Optional[str] = Query("created_at", description="Sort by (created_at, updated_at, due_date, priority)"),
    order: Optional[str] = Query("desc", description="Sort order (asc, desc)"),
    limit: Optional[int] = Query(10, description="Number of results to return"),
    offset: Optional[int] = Query(0, description="Number of results to skip"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db_session: Session = Depends(get_session)
):
    """
    Get all tasks for the authenticated user
    """
    # Get or create user from Clerk payload
    user = await auth_service.get_or_create_user_from_clerk_payload(current_user, db_session)
    
    user_id = user.id

    tasks = task_service.get_tasks(
        user_id=user_id,
        db_session=db_session,
        completed=completed,
        priority=priority,
        due_date_from=due_date_from,
        due_date_to=due_date_to,
        search=search,
        sort_by=sort_by,
        order=order,
        limit=limit,
        offset=offset
    )

    # Convert tasks to response model format
    tasks_list = []
    for task in tasks:
        tasks_list.append(_task_to_response(task))

    return tasks_list


@router.post("/tasks", response_model=TaskResponse, status_code=201)
@limiter.limit("20/minute")  # 20 requests per minute for authenticated users
async def create_task(
    request: Request,  # Required for rate limiting
    task_request: TaskCreateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db_session: Session = Depends(get_session)
):
    """
    Create a new task for the authenticated user
    """
    # Get or create user from Clerk payload
    user = await auth_service.get_or_create_user_from_clerk_payload(current_user, db_session)
    
    user_id = user.id

    # Create the task using the service
    try:
        task = task_service.create_task(
            task_data=task_request,
            user_id=user_id,
            db_session=db_session
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Convert to response model
    return _task_to_response(task)


@router.get("/tasks/{task_id}", response_model=TaskResponse)
@limiter.limit("50/minute")  # 50 requests per minute for authenticated users
async def get_task_by_id(
    request: Request,  # Required for rate limiting
    task_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db_session: Session = Depends(get_session)
):
    """
    Get a specific task by ID for the authenticated user
    """
    # Get or create user from Clerk payload
    user = await auth_service.get_or_create_user_from_clerk_payload(current_user, db_session)
    
    user_id = user.id

    # Get the task using the service
    task = task_service.get_task_by_id(
        task_id=task_id,
        user_id=user_id,
        db_session=db_session
    )

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found or access denied"
        )

    # Convert to response model
    return _task_to_response(task)


@router.put("/tasks/{task_id}", response_model=TaskResponse)
@limiter.limit("30/minute")  # 30 requests per minute for authenticated users
async def update_task(
    request: Request,  # Required for rate limiting
    task_id: int,
    task_request: TaskUpdateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db_session: Session = Depends(get_session)
):
    """
    Update a specific task by ID for the authenticated user
    """
    # Get or create user from Clerk payload
    user = await auth_service.get_or_create_user_from_clerk_payload(current_user, db_session)
    
    user_id = user.id

    # Update the task using the service
    try:
        updated_task = task_service.update_task(
            task_id=task_id,
            task_data=task_request,
            user_id=user_id,
            db_session=db_session
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not updated_task:
        raise HTTPException(
            status_code=404,
            detail="Task not found or access denied"
        )

    # Convert to response model
    return _task_to_response(updated_task)


@router.delete("/tasks/{task_id}", status_code=204)
@limiter.limit("30/minute")  # 30 requests per minute for authenticated users
async def delete_task(
    request: Request,  # Required for rate limiting
    task_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db_session: Session = Depends(get_session)
):
    """
    Delete a specific task by ID for the authenticated user
    """
    # Get or create user from Clerk payload
    user = await auth_service.get_or_create_user_from_clerk_payload(current_user, db_session)
    
    user_id = user.id

    # Delete the task using the service
    success = task_service.delete_task(
        task_id=task_id,
        user_id=user_id,
        db_session=db_session
    )

    if not success:
        raise HTTPException(
            status_code=404,
            detail="Task not found or access denied"
        )

    # Return 204 No Content
    return


@router.patch("/tasks/{task_id}/toggle-completion", response_model=TaskResponse)
@limiter.limit("40/minute")  # 40 requests per minute for authenticated users
async def toggle_task_completion(
    request: Request,  # Required for rate limiting
    task_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db_session: Session = Depends(get_session)
):
    """
    Toggle the completion status of a task for the authenticated user
    """
    # Get or create user from Clerk payload
    user = await auth_service.get_or_create_user_from_clerk_payload(current_user, db_session)
    
    user_id = user.id

    # Toggle the task completion using the service
    task = task_service.toggle_task_completion(
        task_id=task_id,
        user_id=user_id,
        db_session=db_session
    )

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found or access denied"
        )

    # Convert to response model
    return _task_to_response(task)