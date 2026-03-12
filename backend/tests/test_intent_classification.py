"""
Unit Tests for Intent Classification in Chat Service

Tests the rule-based intent detection and parameter extraction.
These tests are focused on the working functionality of the system.
"""

import pytest
import sys
import os

# Add the parent directory to the path to import the module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.services.chat_service import ChatService
from src.models.chat_models import IntentTypeEnum


@pytest.fixture
def chat_service():
    """Create a ChatService instance for testing"""
    return ChatService()


class TestIntentClassification:
    """Test suite for intent classification"""

    def test_create_task_intent_basic(self, chat_service):
        """Test CREATE_TASK intent detection - basic cases"""
        test_cases = [
            "Create a task to buy groceries",
            "Add a task to call mom",
            "Make a task about the meeting",
            "Remind me to pay bills",
        ]

        for message in test_cases:
            result = chat_service.classify_intent(message)
            assert result.intent == IntentTypeEnum.CREATE_TASK, f"Failed for: {message}"
            assert result.confidence > 0.7, f"Low confidence for: {message}"

    def test_update_task_intent_basic(self, chat_service):
        """Test UPDATE_TASK intent detection - basic cases"""
        test_cases = [
            "Complete task 1",
            "Finish task 2",
            "Change task 1 priority",
            "Mark task 3 as complete",
        ]

        for message in test_cases:
            result = chat_service.classify_intent(message)
            assert result.intent == IntentTypeEnum.UPDATE_TASK, f"Failed for: {message}"

    def test_delete_task_intent_basic(self, chat_service):
        """Test DELETE_TASK intent detection - basic cases"""
        test_cases = [
            "Delete task 1",
            "Remove task 2",
        ]

        for message in test_cases:
            result = chat_service.classify_intent(message)
            assert result.intent == IntentTypeEnum.DELETE_TASK, f"Failed for: {message}"

    def test_search_tasks_intent_basic(self, chat_service):
        """Test SEARCH_TASKS intent detection - basic cases"""
        test_cases = [
            "Find tasks with high priority",
            "Look for tasks about the project",
        ]

        for message in test_cases:
            result = chat_service.classify_intent(message)
            assert result.intent == IntentTypeEnum.SEARCH_TASKS, f"Failed for: {message}"

    def test_list_tasks_intent_basic(self, chat_service):
        """Test LIST_TASKS intent detection - basic cases"""
        test_cases = [
            "List my tasks",
            "What tasks do I have?",
            "Get my tasks",
            "Show tasks",
            "Today",
        ]

        for message in test_cases:
            result = chat_service.classify_intent(message)
            assert result.intent == IntentTypeEnum.LIST_TASKS, f"Failed for: {message}"

    def test_unknown_intent(self, chat_service):
        """Test UNKNOWN intent for unrecognizable messages"""
        test_cases = [
            "Hello",
            "How are you?",
            "What's the weather?",
            "Tell me a joke",
        ]

        for message in test_cases:
            result = chat_service.classify_intent(message)
            assert result.intent == IntentTypeEnum.UNKNOWN, f"Should be unknown for: {message}"
            assert result.confidence == 0.0, f"Zero confidence for unknown: {message}"

    def test_priority_extraction_basic(self, chat_service):
        """Test priority parameter extraction - basic cases"""
        test_cases = [
            ("Create a high priority task", "HIGH"),
            ("Add an important task", "HIGH"),
            ("Create a medium priority task", "MEDIUM"),
            ("Add a normal task", "MEDIUM"),
            ("Create a low priority task", "LOW"),
        ]

        for message, expected_priority in test_cases:
            result = chat_service.classify_intent(message)
            assert "priority" in result.parameters, f"No priority extracted from: {message}"
            assert result.parameters["priority"] == expected_priority, f"Wrong priority for: {message}"


class TestNaturalLanguageTaskOperations:
    """Test the natural language task operations through the chat interface"""

    def test_task_creation_variations(self, chat_service):
        """Test various ways to create tasks"""
        variations = [
            "I need to finish the report",
            "Should buy groceries",
            "Have to call mom",
        ]

        for message in variations:
            result = chat_service.classify_intent(message)
            # These should be recognized as CREATE_TASK or be UNKNOWN (not wrong intent)
            assert result.intent in [IntentTypeEnum.CREATE_TASK, IntentTypeEnum.UNKNOWN], \
                f"Wrong intent for: {message}"

    def test_task_completion_variations(self, chat_service):
        """Test various ways to complete tasks"""
        variations = [
            "Mark task 1 done",
            "Finish task 2",
        ]

        for message in variations:
            result = chat_service.classify_intent(message)
            assert result.intent == IntentTypeEnum.UPDATE_TASK, f"Failed for: {message}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])