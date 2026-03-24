import asyncio
from unittest.mock import Mock

import pytest
from sqlmodel import Session

from src.models.auth_identity import AuthIdentity
from src.models.user import User
from src.services.auth_service import AuthService


class TestAuthService:
    def setup_method(self):
        self.auth_service = AuthService()
        self.mock_session = Mock(spec=Session)

    def test_get_or_create_user_existing_identity(self):
        identity = AuthIdentity(
            id=10,
            user_id=1,
            provider="app",
            provider_subject="user_123",
            email="test@example.com",
            email_verified=True,
            first_name="Test",
            last_name="User",
        )
        existing_user = User(id=1, clerk_user_id=None)

        identity_exec = Mock()
        identity_exec.first.return_value = identity
        user_exec = Mock()
        user_exec.first.return_value = existing_user
        self.mock_session.exec.side_effect = [identity_exec, user_exec]

        result = asyncio.run(
            self.auth_service.get_or_create_user_from_auth_payload(
                {
                    "sub": "user_123",
                    "provider": "app",
                    "email": "test@example.com",
                    "email_verified": True,
                    "given_name": "Test",
                    "family_name": "User",
                },
                self.mock_session,
            )
        )

        assert result.id == 1

    def test_get_or_create_user_links_by_verified_email(self):
        existing_user = User(id=2, clerk_user_id=None)
        matching_identity = AuthIdentity(
            id=11,
            user_id=2,
            provider="clerk",
            provider_subject="legacy_user",
            email="linked@example.com",
            email_verified=True,
        )

        subject_exec = Mock()
        subject_exec.first.return_value = None
        email_exec = Mock()
        email_exec.first.return_value = matching_identity
        user_exec = Mock()
        user_exec.first.return_value = existing_user
        identity_recheck_exec = Mock()
        identity_recheck_exec.first.return_value = None

        self.mock_session.exec.side_effect = [subject_exec, email_exec, user_exec, identity_recheck_exec]
        self.mock_session.add = Mock()
        self.mock_session.commit = Mock()
        self.mock_session.refresh = Mock()

        result = asyncio.run(
            self.auth_service.get_or_create_user_from_auth_payload(
                {
                    "sub": "google-oauth2|abc",
                    "provider": "google",
                    "email": "linked@example.com",
                    "email_verified": True,
                    "given_name": "Linked",
                    "family_name": "User",
                },
                self.mock_session,
            )
        )

        assert result.id == 2
        self.mock_session.add.assert_called()
        self.mock_session.commit.assert_called()

    def test_get_or_create_user_new(self):
        subject_exec = Mock()
        subject_exec.first.return_value = None
        email_exec = Mock()
        email_exec.first.return_value = None
        identity_recheck_exec = Mock()
        identity_recheck_exec.first.return_value = None

        self.mock_session.exec.side_effect = [subject_exec, email_exec, identity_recheck_exec]
        self.mock_session.add = Mock()
        self.mock_session.commit = Mock()
        self.mock_session.refresh = Mock(side_effect=lambda obj: setattr(obj, "id", 3) if getattr(obj, "id", None) is None else None)

        result = asyncio.run(
            self.auth_service.get_or_create_user_from_auth_payload(
                {
                    "sub": "github|xyz",
                    "provider": "github",
                    "email": "new@example.com",
                    "email_verified": True,
                    "given_name": "New",
                    "family_name": "User",
                },
                self.mock_session,
            )
        )

        assert result.id == 3
        assert self.mock_session.add.call_count >= 2

    def test_get_current_user_id_success(self):
        result = self.auth_service.get_current_user_id({"sub": "user_789", "provider": "app"})
        assert result == "user_789"

    def test_get_current_user_id_invalid_payload(self):
        with pytest.raises(Exception):
            self.auth_service.get_current_user_id({"invalid": "data"})

    def test_get_user_by_id_success(self):
        expected_user = User(id=1, clerk_user_id=None)
        mock_exec_result = Mock()
        mock_exec_result.first.return_value = expected_user
        self.mock_session.exec.return_value = mock_exec_result

        result = self.auth_service.get_user_by_id(1, self.mock_session)
        assert result is not None
        assert result.id == 1

    def test_get_user_by_id_not_found(self):
        mock_exec_result = Mock()
        mock_exec_result.first.return_value = None
        self.mock_session.exec.return_value = mock_exec_result

        result = self.auth_service.get_user_by_id(999, self.mock_session)
        assert result is None


if __name__ == "__main__":
    pytest.main()
