from fastapi import APIRouter, Depends, HTTPException, Query, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlmodel import Session
from typing import List, Optional
from ..middleware.auth import get_current_user
from ..database import get_session
from ..services.tag_service import tag_service
from pydantic import BaseModel
from typing import Dict, Any

# Initialize rate limiter for this router
limiter = Limiter(key_func=get_remote_address)


router = APIRouter(prefix="/api/v1", tags=["tags"])


class TagCreateRequest(BaseModel):
    name: str
    color: Optional[str] = None


class TagUpdateRequest(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None


class TagResponse(BaseModel):
    id: int
    name: str
    color: Optional[str]
    user_id: int


@router.get("/tags", response_model=List[TagResponse])
@limiter.limit("50/minute")  # 50 requests per minute for authenticated users
def get_tags(
    request: Request,  # Required for rate limiting
    limit: Optional[int] = Query(10, description="Number of results to return"),
    offset: Optional[int] = Query(0, description="Number of results to skip"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db_session: Session = Depends(get_session)
):
    """
    Get all tags for authenticated user
    """
    from ..services.auth_service import auth_service
    user = auth_service.get_user_by_clerk_id(auth_service.get_current_user_id(current_user), db_session)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    tags = tag_service.get_tags(
        user_id=user.id,
        db_session=db_session,
        limit=limit,
        offset=offset
    )

    return [TagResponse(
        id=tag.id,
        name=tag.name,
        color=tag.color,
        user_id=tag.user_id
    ) for tag in tags]


@router.post("/tags", response_model=TagResponse, status_code=201)
@limiter.limit("20/minute")  # 20 requests per minute for authenticated users
def create_tag(
    request: Request,  # Required for rate limiting
    tag_request: TagCreateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db_session: Session = Depends(get_session)
):
    """
    Create a new tag for the authenticated user
    """
    from ..services.auth_service import auth_service
    clerk_user_id = auth_service.get_current_user_id(current_user)
    
    # Get user by Clerk user ID to get the integer user_id
    user = auth_service.get_user_by_clerk_id(clerk_user_id, db_session)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_id = user.id

    try:
        tag = tag_service.create_tag(
            tag_data=tag_request.model_dump(),
            user_id=user_id,
            db_session=db_session
        )

        return TagResponse(
            id=tag.id,
            name=tag.name,
            color=tag.color,
            user_id=tag.user_id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.get("/tags/{tag_id}", response_model=TagResponse)
@limiter.limit("50/minute")  # 50 requests per minute for authenticated users
def get_tag_by_id(
    request: Request,  # Required for rate limiting
    tag_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db_session: Session = Depends(get_session)
):
    """
    Get a specific tag by ID for the authenticated user
    """
    from ..services.auth_service import auth_service
    clerk_user_id = auth_service.get_current_user_id(current_user)
    
    # Get user by Clerk user ID to get the integer user_id
    user = auth_service.get_user_by_clerk_id(clerk_user_id, db_session)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_id = user.id

    tag = tag_service.get_tag_by_id(
        tag_id=tag_id,
        user_id=user_id,
        db_session=db_session
    )

    if not tag:
        raise HTTPException(
            status_code=404,
            detail="Tag not found or access denied"
        )

    return TagResponse(
        id=tag.id,
        name=tag.name,
        color=tag.color,
        user_id=tag.user_id
    )


@router.put("/tags/{tag_id}", response_model=TagResponse)
@limiter.limit("30/minute")  # 30 requests per minute for authenticated users
def update_tag(
    request: Request,  # Required for rate limiting
    tag_id: int,
    tag_request: TagUpdateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db_session: Session = Depends(get_session)
):
    """
    Update a specific tag by ID for the authenticated user
    """
    from ..services.auth_service import auth_service
    clerk_user_id = auth_service.get_current_user_id(current_user)
    
    # Get user by Clerk user ID to get the integer user_id
    user = auth_service.get_user_by_clerk_id(clerk_user_id, db_session)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_id = user.id

    try:
        updated_tag = tag_service.update_tag(
            tag_id=tag_id,
            tag_data=tag_request.model_dump(exclude_unset=True),
            user_id=user_id,
            db_session=db_session
        )

        if not updated_tag:
            raise HTTPException(
                status_code=404,
                detail="Tag not found or access denied"
            )

        return TagResponse(
            id=updated_tag.id,
            name=updated_tag.name,
            color=updated_tag.color,
            user_id=updated_tag.user_id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.delete("/tags/{tag_id}", status_code=204)
@limiter.limit("30/minute")  # 30 requests per minute for authenticated users
def delete_tag(
    request: Request,  # Required for rate limiting
    tag_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db_session: Session = Depends(get_session)
):
    """
    Delete a specific tag by ID for the authenticated user
    """
    from ..services.auth_service import auth_service
    clerk_user_id = auth_service.get_current_user_id(current_user)
    
    # Get user by Clerk user ID to get the integer user_id
    user = auth_service.get_user_by_clerk_id(clerk_user_id, db_session)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_id = user.id

    success = tag_service.delete_tag(
        tag_id=tag_id,
        user_id=user_id,
        db_session=db_session
    )

    if not success:
        raise HTTPException(
            status_code=404,
            detail="Tag not found or access denied"
        )

    # Return 204 No Content
    return