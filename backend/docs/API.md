# Backend API Documentation

Comprehensive REST API reference for the Todo AI backend service.

## Base URL

```
http://localhost:8000  (Development)
https://api.example.com (Production)
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Response Format

All responses are JSON:

```json
{
  "id": "uuid",
  "data": {},
  "error": null,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Authentication Endpoints

### Sign Up

Create a new user account.

```
POST /api/v1/auth/signup
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "full_name": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "full_name": "John Doe",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `400` - Validation error or email already exists
- `422` - Invalid request format

---

### Login

Authenticate with email and password.

```
POST /api/v1/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "full_name": "John Doe"
  }
}
```

**Error Responses:**
- `401` - Invalid credentials
- `404` - User not found

---

### Refresh Token

Get a new access token using the existing token.

```
POST /api/v1/auth/refresh
```

**Headers:**
```
Authorization: Bearer <expired_token>
```

**Response (200 OK):**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer"
}
```

---

### Google OAuth

Handle Google OAuth callback.

```
POST /api/v1/auth/google
```

**Request Body:**
```json
{
  "code": "google-auth-code",
  "redirect_uri": "http://localhost:3000/oauth-callback"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": { ... }
}
```

---

### GitHub OAuth

Handle GitHub OAuth callback.

```
POST /api/v1/auth/github
```

**Request Body:**
```json
{
  "code": "github-auth-code",
  "redirect_uri": "http://localhost:3000/oauth-callback"
}
```

**Response (200 OK):**
Similar to Google OAuth response.

---

### Logout

Invalidate the current session.

```
POST /api/v1/auth/logout
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Successfully logged out"
}
```

---

## Task Endpoints

### List Tasks

Get all tasks for the current user with optional filtering.

```
GET /api/v1/tasks
```

**Query Parameters:**
- `completed` (optional, boolean) - Filter by completion status
- `priority` (optional, string) - Filter by priority: HIGH, MEDIUM, LOW
- `due_date_from` (optional, string) - ISO date format (tasks due after this date)
- `due_date_to` (optional, string) - ISO date format (tasks due before this date)
- `tag_id` (optional, uuid) - Filter tasks with specific tag
- `search` (optional, string) - Search in title and description
- `sort_by` (optional, string) - Sort field: due_date, priority, created_at
- `sort_order` (optional, string) - asc or desc
- `limit` (optional, integer) - Default 50, max 100
- `offset` (optional, integer) - For pagination

**Example:**
```
GET /api/v1/tasks?priority=HIGH&completed=false&limit=10
```

**Response (200 OK):**
```json
{
  "total": 25,
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Complete project",
      "description": "Finish the AI implementation",
      "completed": false,
      "priority": "HIGH",
      "due_date": "2024-01-20T23:59:59Z",
      "recurrence_rule": "DAILY",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "tags": [
        {
          "id": "tag-uuid",
          "name": "Work",
          "color": "#FF5733"
        }
      ]
    }
  ]
}
```

**Error Responses:**
- `401` - Unauthorized
- `422` - Invalid query parameters

---

### Create Task

Create a new task.

```
POST /api/v1/tasks
```

**Request Body:**
```json
{
  "title": "Complete project",
  "description": "Finish the AI implementation",
  "priority": "HIGH",
  "due_date": "2024-01-20T23:59:59Z",
  "recurrence_rule": "DAILY",
  "tag_ids": ["tag-uuid-1", "tag-uuid-2"]
}
```

**Field Details:**
- `title` (string, required) - Task title (max 255 chars)
- `description` (string, optional) - Detailed description
- `priority` (string, optional) - HIGH, MEDIUM, or LOW (default: MEDIUM)
- `due_date` (string, optional) - ISO 8601 datetime
- `recurrence_rule` (string, optional) - DAILY, WEEKLY, or MONTHLY
- `tag_ids` (array, optional) - Array of tag UUIDs

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Complete project",
  "description": "Finish the AI implementation",
  "completed": false,
  "priority": "HIGH",
  "due_date": "2024-01-20T23:59:59Z",
  "recurrence_rule": "DAILY",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "tags": []
}
```

**Error Responses:**
- `400` - Invalid data
- `401` - Unauthorized
- `422` - Validation error

---

### Get Task

Get a specific task by ID.

```
GET /api/v1/tasks/{task_id}
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Complete project",
  ...
}
```

**Error Responses:**
- `404` - Task not found
- `401` - Unauthorized

---

### Update Task

Update a task.

```
PUT /api/v1/tasks/{task_id}
```

**Request Body:**
```json
{
  "title": "Updated title",
  "priority": "MEDIUM",
  "completed": false,
  "tag_ids": ["tag-uuid-1"]
}
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Updated title",
  ...
}
```

**Error Responses:**
- `404` - Task not found
- `401` - Unauthorized
- `422` - Validation error

---

### Delete Task

Delete a task.

```
DELETE /api/v1/tasks/{task_id}
```

**Response (204 No Content)**

**Error Responses:**
- `404` - Task not found
- `401` - Unauthorized

---

### Complete Task

Mark a task as completed.

```
PUT /api/v1/tasks/{task_id}/complete
```

**Request Body:**
```json
{
  "completed": true
}
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "completed": true,
  ...
}
```

---

## Tag Endpoints

### List Tags

Get all tags for the current user.

```
GET /api/v1/tags
```

**Query Parameters:**
- `search` (optional, string) - Search tag names

**Response (200 OK):**
```json
{
  "items": [
    {
      "id": "tag-uuid-1",
      "name": "Work",
      "color": "#FF5733",
      "priority": 1,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### Create Tag

Create a new tag.

```
POST /api/v1/tags
```

**Request Body:**
```json
{
  "name": "Work",
  "color": "#FF5733",
  "priority": 1
}
```

**Response (201 Created):**
```json
{
  "id": "tag-uuid-1",
  "name": "Work",
  "color": "#FF5733",
  "priority": 1,
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

### Update Tag

Update a tag.

```
PUT /api/v1/tags/{tag_id}
```

**Request Body:**
```json
{
  "name": "Important Work",
  "color": "#00FF00"
}
```

**Response (200 OK):**
Similar to Create Tag response.

---

### Delete Tag

Delete a tag.

```
DELETE /api/v1/tags/{tag_id}
```

**Response (204 No Content)**

---

## Chat Endpoints

### Send Chat Message (Non-Streaming)

Send a message and get AI response.

```
POST /api/v1/chat
```

**Request Body:**
```json
{
  "message": "Create a task to buy groceries with high priority",
  "conversation_id": "optional-uuid"
}
```

**Response (200 OK):**
```json
{
  "id": "message-uuid",
  "conversation_id": "conversation-uuid",
  "message": "Create a task to buy groceries with high priority",
  "response": "I've created a task 'buy groceries' with high priority. It's now in your task list.",
  "actions_performed": [
    {
      "type": "create_task",
      "details": {
        "task_id": "task-uuid",
        "title": "buy groceries",
        "priority": "HIGH"
      }
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `400` - Invalid message
- `401` - Unauthorized

---

### Send Chat Message (Streaming)

Send a message with streaming response via Server-Sent Events.

```
POST /api/v1/chat/stream
```

**Request Body:**
```json
{
  "message": "Create a task to buy groceries",
  "conversation_id": "optional-uuid"
}
```

**Response (200 OK - text/event-stream):**
```
data: {"type":"start","conversation_id":"uuid"}
data: {"type":"chunk","content":"I've created "}
data: {"type":"chunk","content":"a task "}
data: {"type":"chunk","content":"for you."}
data: {"type":"action","action":{"type":"create_task","task_id":"uuid"}}
data: {"type":"end","timestamp":"2024-01-15T10:30:00Z"}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 204 | No Content - Request successful, no content to return |
| 400 | Bad Request - Invalid request format or data |
| 401 | Unauthorized - Missing or invalid authentication |
| 403 | Forbidden - Authenticated but not allowed |
| 404 | Not Found - Resource doesn't exist |
| 422 | Unprocessable Entity - Validation error |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

## Rate Limiting

API rate limits:
- **Default**: 100 requests/minute per IP
- **Headers included in response**:
  - `X-RateLimit-Limit`: Total allowed requests
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Time when limit resets

## Pagination

For list endpoints:
- Use `limit` and `offset` query parameters
- Default limit is 50, max is 100

```
GET /api/v1/tasks?limit=20&offset=40
```

## Timestamps

All timestamps are in ISO 8601 format with UTC timezone:
```
2024-01-15T10:30:00Z
```

## Data Types

- **UUID**: 36 characters (example: `550e8400-e29b-41d4-a716-446655440000`)
- **DateTime**: ISO 8601 format (example: `2024-01-15T10:30:00Z`)
- **Priority**: Enum - `HIGH`, `MEDIUM`, `LOW`
- **RecurrenceRule**: Enum - `DAILY`, `WEEKLY`, `MONTHLY`

## Examples

### Create a high-priority task for tomorrow

```bash
curl -X POST http://localhost:8000/api/v1/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Finish report",
    "priority": "HIGH",
    "due_date": "2024-01-16T17:00:00Z",
    "tag_ids": ["work-tag-id"]
  }'
```

### Get all pending high-priority tasks

```bash
curl "http://localhost:8000/api/v1/tasks?priority=HIGH&completed=false" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Use AI chat to manage tasks

```bash
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Create tasks for my morning routine"
  }'
```

## Support

For issues or questions about the API:
1. Check the [Backend README](../README.md)
2. Review the [Architecture Documentation](./ARCHITECTURE.md)
3. Visit the interactive docs at `/docs` when the server is running
4. Open an issue on the project repository
