from sqlmodel import Session, select
from ..models.user import User
from typing import Optional
from ..middleware.auth import get_current_user
from fastapi import Depends, HTTPException
from typing import Dict, Any
import logging

# Configure logging for security events
security_logger = logging.getLogger("security")
security_logger.setLevel(logging.INFO)
# Add a handler if none exists
if not security_logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    security_logger.addHandler(handler)
    security_logger.propagate = False  # Prevent duplicate logs


class AuthService:
    def __init__(self):
        pass

    async def get_or_create_user_from_clerk_payload(
        self,
        clerk_payload: Dict[str, Any],
        db_session: Session
    ) -> User:
        """
        Get existing user by clerk_user_id or create a new one
        """
        clerk_user_id = clerk_payload.get("sub")  # Clerk's standard user ID field

        if not clerk_user_id:
            security_logger.warning(f"Invalid Clerk payload: missing user ID")
            raise HTTPException(
                status_code=400,
                detail="Invalid Clerk payload: missing user ID"
            )

        # Check if user already exists
        statement = select(User).where(User.clerk_user_id == clerk_user_id)
        user = db_session.exec(statement).first()

        if user:
            security_logger.info(f"User authenticated: {clerk_user_id}")
            return user

        # Create new user
        user = User(clerk_user_id=clerk_user_id)
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        security_logger.info(f"New user created: {clerk_user_id}")
        return user

    def get_current_user_id(self, clerk_payload: Dict[str, Any]) -> str:
        """
        Extract the current user ID from the Clerk payload
        """
        user_id = clerk_payload.get("sub")
        if not user_id:
            security_logger.warning(f"Invalid token: missing user ID")
            raise HTTPException(
                status_code=401,
                detail="Invalid token: missing user ID"
            )
        return user_id

    def get_user_by_id(self, user_id: int, db_session: Session) -> Optional[User]:
        """
        Get a user by ID with security logging
        """
        try:
            statement = select(User).where(User.id == user_id)
            user = db_session.exec(statement).first()

            if user:
                security_logger.info(f"User data accessed: {user.id}")
            else:
                security_logger.warning(f"Attempt to access non-existent user ID: {user_id}")

            return user
        except Exception as e:
            security_logger.error(f"Error accessing user data for ID {user_id}: {str(e)}")
            raise

    def get_user_by_clerk_id(self, clerk_user_id: str, db_session: Session) -> Optional[User]:
        """
        Get a user by Clerk user ID with security logging
        """
        try:
            statement = select(User).where(User.clerk_user_id == clerk_user_id)
            user = db_session.exec(statement).first()

            if user:
                security_logger.info(f"User data accessed: {user.clerk_user_id}")
            else:
                security_logger.warning(f"Attempt to access non-existent Clerk user ID: {clerk_user_id}")

            return user
        except Exception as e:
            security_logger.error(f"Error accessing user data for Clerk user ID {clerk_user_id}: {str(e)}")
            raise


# Create a singleton instance
auth_service = AuthService()