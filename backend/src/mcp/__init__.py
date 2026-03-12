"""
MCP Server Module for Task Management

This module provides a Model Context Protocol server using the official MCP Python SDK.
It exposes task management tools that can be used by AI agents.
"""

from .server import mcp_server

__all__ = ["mcp_server"]
