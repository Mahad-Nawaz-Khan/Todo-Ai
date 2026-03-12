"""
Test Natural Language Task Operations

This script tests the natural language task management functionality
through the chat interface.

Usage:
    python tests/test_natural_language_operations.py
"""

import asyncio
import httpx
import json
import os
from typing import Dict, Any


class ChatTester:
    """Test the chat interface with natural language commands"""

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=30.0)
        self.session_id = "test_session_natural_language"
        self.auth_token = None

    async def setup(self):
        """Setup authentication token"""
        # In a real scenario, this would use Clerk
        # For testing, we'll use a test token
        # You'll need to set this from your Clerk session
        self.auth_token = os.getenv("TEST_AUTH_TOKEN")
        if not self.auth_token:
            print("Warning: No TEST_AUTH_TOKEN set. Tests may fail.")
            print("Get a token from Clerk and set it as TEST_AUTH_TOKEN environment variable.")

    async def send_message(self, content: str) -> Dict[str, Any]:
        """Send a message to the chatbot"""
        headers = {}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"

        try:
            response = await self.client.post(
                f"{self.base_url}/api/v1/chat/message",
                json={
                    "content": content,
                    "session_id": self.session_id
                },
                headers=headers
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            print(f"Error sending message: {e}")
            if hasattr(e, "response") and e.response is not None:
                print(f"Response: {e.response.text}")
            return {"error": str(e)}

    async def get_chat_history(self) -> Dict[str, Any]:
        """Get chat history"""
        headers = {}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"

        try:
            response = await self.client.get(
                f"{self.base_url}/api/v1/chat/history",
                params={"session_id": self.session_id},
                headers=headers
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            print(f"Error getting chat history: {e}")
            return {"error": str(e)}

    async def test_create_task(self) -> bool:
        """Test T041: Natural language task creation"""
        print("\n=== Test T041: Create Task ===")
        result = await self.send_message("Add a task to buy groceries")
        print(f"User: Add a task to buy groceries")
        print(f"AI: {result.get('message', {}).get('content', 'No response')}")
        print(f"Operation: {result.get('operation_performed')}")
        success = "created" in result.get('message', {}).get('content', '').lower()
        print(f"Status: {'PASS' if success else 'FAIL'}")
        return success

    async def test_list_tasks(self) -> bool:
        """Test T042: Natural language task listing"""
        print("\n=== Test T042: List Tasks ===")
        result = await self.send_message("Show me all my tasks")
        print(f"User: Show me all my tasks")
        print(f"AI: {result.get('message', {}).get('content', 'No response')}")
        print(f"Operation: {result.get('operation_performed')}")
        success = "task" in result.get('message', {}).get('content', '').lower()
        print(f"Status: {'PASS' if success else 'FAIL'}")
        return success

    async def test_complete_task(self) -> bool:
        """Test T043: Natural language task completion"""
        print("\n=== Test T043: Complete Task ===")
        # First, try to get a task ID from history
        history = await self.get_chat_history()
        task_id = None
        if "messages" in history and history["messages"]:
            # Find the most recent create operation
            for msg in reversed(history["messages"]):
                content = msg.get("content", "").lower()
                if "created" in content or "add" in content:
                    # Try to extract a task number
                    import re
                    numbers = re.findall(r'\d+', content)
                    if numbers:
                        task_id = numbers[0]
                        break

        # Use a generic completion command
        result = await self.send_message("Complete task 1")
        print(f"User: Complete task 1")
        print(f"AI: {result.get('message', {}).get('content', 'No response')}")
        print(f"Operation: {result.get('operation_performed')}")
        success = "complete" in result.get('message', {}).get('content', '').lower() or "couldn't find" in result.get('message', {}).get('content', '').lower()
        print(f"Status: {'PASS' if success else 'FAIL'}")
        return success

    async def test_delete_task(self) -> bool:
        """Test T044: Natural language task deletion"""
        print("\n=== Test T044: Delete Task ===")
        result = await self.send_message("Delete the meeting task")
        print(f"User: Delete the meeting task")
        print(f"AI: {result.get('message', {}).get('content', 'No response')}")
        print(f"Operation: {result.get('operation_performed')}")
        success = "delete" in result.get('message', {}).get('content', '').lower() or "couldn't find" in result.get('message', {}).get('content', '').lower()
        print(f"Status: {'PASS' if success else 'FAIL'}")
        return success

    async def test_today_tasks(self) -> bool:
        """Test listing today's tasks"""
        print("\n=== Test: Today's Tasks ===")
        result = await self.send_message("What do I have today?")
        print(f"User: What do I have today?")
        print(f"AI: {result.get('message', {}).get('content', 'No response')}")
        print(f"Operation: {result.get('operation_performed')}")
        success = "task" in result.get('message', {}).get('content', '').lower()
        print(f"Status: {'PASS' if success else 'FAIL'}")
        return success

    async def test_search_tasks(self) -> bool:
        """Test searching tasks"""
        print("\n=== Test: Search Tasks ===")
        result = await self.send_message("Search for grocery tasks")
        print(f"User: Search for grocery tasks")
        print(f"AI: {result.get('message', {}).get('content', 'No response')}")
        print(f"Operation: {result.get('operation_performed')}")
        success = "found" in result.get('message', {}).get('content', '').lower() or "couldn't find" in result.get('message', {}).get('content', '').lower()
        print(f"Status: {'PASS' if success else 'FAIL'}")
        return success

    async def run_all_tests(self):
        """Run all natural language operation tests"""
        print("=" * 60)
        print("Natural Language Task Operations Test Suite")
        print("=" * 60)

        await self.setup()

        if not self.auth_token:
            print("\nWarning: Running without authentication. Tests may fail.")
            print("Set TEST_AUTH_TOKEN environment variable for proper testing.")

        results = {
            "T041_Create_Task": await self.test_create_task(),
            "T042_List_Tasks": await self.test_list_tasks(),
            "T043_Complete_Task": await self.test_complete_task(),
            "T044_Delete_Task": await self.test_delete_task(),
            "Today_Tasks": await self.test_today_tasks(),
            "Search_Tasks": await self.test_search_tasks(),
        }

        print("\n" + "=" * 60)
        print("Test Summary")
        print("=" * 60)
        for test_name, result in results.items():
            status = "PASS" if result else "FAIL"
            print(f"{test_name}: {status}")

        total = len(results)
        passed = sum(results.values())
        print(f"\nTotal: {passed}/{total} tests passed")

        await self.client.aclose()

        return results


async def main():
    """Main entry point"""
    tester = ChatTester()
    results = await tester.run_all_tests()

    # Exit with appropriate code
    all_passed = all(results.values())
    return 0 if all_passed else 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)