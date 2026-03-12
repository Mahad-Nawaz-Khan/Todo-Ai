from typing import List, Optional
from sqlmodel import Session, select
from ..models.tag import Tag
from ..models.task_tag import TaskTagLink
from ..models.user import User
from fastapi import HTTPException
import logging


class TagService:
    def create_tag(self, tag_data: dict, user_id: int, db_session: Session) -> Tag:
        """
        Create a new tag for a user
        """
        try:
            # Validate parameters
            if user_id <= 0:
                raise ValueError("User ID must be positive")
            if not tag_data.get("name") or len(tag_data["name"].strip()) == 0:
                raise ValueError("Tag name is required")
            if len(tag_data["name"].strip()) > 100:
                raise ValueError("Tag name must be less than 100 characters")

            # Check if tag already exists for this user
            existing_tag = db_session.exec(
                select(Tag).where(
                    Tag.name == tag_data["name"],
                    Tag.user_id == user_id
                )
            ).first()

            if existing_tag:
                raise ValueError("Tag with this name already exists for the user")

            color = tag_data.get("color")
            if not isinstance(color, str) or len(color.strip()) == 0:
                color = "#94A3B8"

            tag = Tag(
                name=tag_data["name"],
                color=color,
                user_id=user_id
            )
            db_session.add(tag)
            db_session.commit()
            db_session.refresh(tag)

            logging.info(f"Tag created successfully with ID: {tag.id} for user: {user_id}")
            return tag
        except ValueError as ve:
            logging.error(f"Validation error creating tag for user {user_id}: {str(ve)}")
            raise ve
        except Exception as e:
            logging.error(f"Error creating tag for user {user_id}: {str(e)}")
            db_session.rollback()
            raise HTTPException(status_code=500, detail="Failed to create tag")

    def get_tag_by_id(self, tag_id: int, user_id: int, db_session: Session) -> Optional[Tag]:
        """
        Get a tag by ID for a specific user
        """
        try:
            # Validate parameters
            if tag_id <= 0:
                raise ValueError("Tag ID must be positive")
            if user_id <= 0:
                raise ValueError("User ID must be positive")

            tag = db_session.exec(
                select(Tag).where(
                    Tag.id == tag_id,
                    Tag.user_id == user_id
                )
            ).first()
            return tag
        except ValueError as ve:
            logging.error(f"Validation error getting tag {tag_id} for user {user_id}: {str(ve)}")
            raise ve
        except Exception as e:
            logging.error(f"Error getting tag {tag_id} for user {user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to retrieve tag")

    def get_tags(self, user_id: int, db_session: Session,
                 limit: Optional[int] = None, offset: Optional[int] = None) -> List[Tag]:
        """
        Get all tags for a user with optional pagination
        """
        try:
            # Validate parameters
            if user_id <= 0:
                raise ValueError("User ID must be positive")
            if limit is not None and limit > 100:
                raise ValueError("Limit cannot exceed 100")
            if offset is not None and offset < 0:
                raise ValueError("Offset cannot be negative")

            query = select(Tag).where(Tag.user_id == user_id)

            if limit is not None:
                query = query.limit(limit)
            if offset is not None:
                query = query.offset(offset)

            tags = db_session.exec(query).all()
            logging.info(f"Retrieved {len(tags)} tags for user: {user_id}")
            return tags
        except ValueError as ve:
            logging.error(f"Validation error getting tags for user {user_id}: {str(ve)}")
            raise ve
        except Exception as e:
            logging.error(f"Error getting tags for user {user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to retrieve tags")

    def update_tag(self, tag_id: int, tag_data: dict, user_id: int, db_session: Session) -> Optional[Tag]:
        """
        Update a tag for a user
        """
        try:
            # Validate parameters
            if tag_id <= 0:
                raise ValueError("Tag ID must be positive")
            if user_id <= 0:
                raise ValueError("User ID must be positive")
            if "name" in tag_data:
                if tag_data["name"] is None or len(str(tag_data["name"]).strip()) == 0:
                    raise ValueError("Tag name is required")
                if len(str(tag_data["name"]).strip()) > 100:
                    raise ValueError("Tag name must be less than 100 characters")

            tag = self.get_tag_by_id(tag_id, user_id, db_session)
            if not tag:
                return None

            # Check if the new name already exists for this user (excluding current tag)
            if "name" in tag_data:
                existing_tag = db_session.exec(
                    select(Tag).where(
                        Tag.name == tag_data["name"],
                        Tag.user_id == user_id,
                        Tag.id != tag_id
                    )
                ).first()

                if existing_tag:
                    raise ValueError("Tag with this name already exists for the user")

            # Update fields
            for field, value in tag_data.items():
                if value is None:
                    continue
                if hasattr(tag, field):
                    setattr(tag, field, value)

            db_session.add(tag)
            db_session.commit()
            db_session.refresh(tag)

            logging.info(f"Tag updated successfully with ID: {tag.id} for user: {user_id}")
            return tag
        except ValueError as ve:
            logging.error(f"Validation error updating tag {tag_id} for user {user_id}: {str(ve)}")
            raise ve
        except Exception as e:
            logging.error(f"Error updating tag {tag_id} for user {user_id}: {str(e)}")
            db_session.rollback()
            raise HTTPException(status_code=500, detail="Failed to update tag")

    def delete_tag(self, tag_id: int, user_id: int, db_session: Session) -> bool:
        """
        Delete a tag for a user
        """
        try:
            # Validate parameters
            if tag_id <= 0:
                raise ValueError("Tag ID must be positive")
            if user_id <= 0:
                raise ValueError("User ID must be positive")

            tag = self.get_tag_by_id(tag_id, user_id, db_session)
            if not tag:
                return False

            links = db_session.exec(
                select(TaskTagLink).where(TaskTagLink.tag_id == tag_id)
            ).all()
            for link in links:
                db_session.delete(link)

            db_session.delete(tag)
            db_session.commit()

            logging.info(f"Tag deleted successfully with ID: {tag_id} for user: {user_id}")
            return True
        except ValueError as ve:
            logging.error(f"Validation error deleting tag {tag_id} for user {user_id}: {str(ve)}")
            raise ve
        except Exception as e:
            logging.error(f"Error deleting tag {tag_id} for user {user_id}: {str(e)}")
            db_session.rollback()
            raise HTTPException(status_code=500, detail="Failed to delete tag")


# Create a global instance of the service
tag_service = TagService()