# Backend — Todo AI

FastAPI service providing a REST API for task management, authentication, tags, and an AI-powered chat interface.

## Quick Start

```bash
python -m venv venv
source venv/bin/activate        # Linux/macOS
venv\Scripts\activate           # Windows

pip install -r requirements.txt

# Create .env (see Environment Variables below)
cp .env.example .env

uvicorn src.main:app --reload --port 8000
```

API available at `http://localhost:8000`. Interactive docs at `/docs` (Swagger) and `/redoc`.

## Project Structure

```
src/
├── main.py                 # FastAPI app, lifespan, CORS, routes
├── database.py             # SQLModel engine & session (PostgreSQL/SQLite)
├── api/                    # Route handlers
│   ├── auth_router.py      # Authentication endpoints
│   ├── task_router.py      # Task CRUD endpoints
│   ├── tag_router.py       # Tag CRUD endpoints
│   ├── chat_router.py      # Chat message endpoint
│   └── chat_streaming_router.py  # SSE streaming chat
├── models/                 # SQLModel ORM models
│   ├── user.py             # User model
│   ├── auth_identity.py    # OAuth identity linking
│   ├── credential.py       # Email/password credentials
│   ├── task.py             # Task model (priority, due date, recurrence)
│   ├── tag.py              # Tag model
│   ├── task_tag.py         # Task-Tag many-to-many link
│   └── chat_models.py      # Chat interaction & message models
├── schemas/                # Pydantic request/response schemas
├── services/               # Business logic layer
│   ├── auth_service.py     # JWT creation, password hashing, OAuth
│   ├── task_service.py     # Task CRUD operations
│   ├── tag_service.py      # Tag CRUD operations
│   ├── chat_service.py     # Chat message processing
│   └── agent_service.py    # OpenAI Agents SDK integration
├── tools/                  # AI agent tools
│   └── task_crud_tools.py  # Task operations exposed to the AI agent
├── mcp/                    # Model Context Protocol
│   └── server.py           # MCP server for AI tool orchestration
├── middleware/
│   └── auth.py             # JWT verification middleware
├── config/                 # Configuration module
└── media/                  # File upload handling
tests/
├── unit/                   # Unit tests
├── integration/            # Integration tests
├── test_api_integration.py
├── test_auth_service.py
├── test_intent_classification.py
├── test_mcp_server.py
├── test_natural_language_operations.py
├── test_streaming_chat.py
├── test_tag_service.py
└── test_task_service.py
```

## API Endpoints

### Authentication

| Method | Endpoint                      | Description                     | Auth |
|--------|-------------------------------|---------------------------------|------|
| POST   | `/api/auth/email/signup`      | Register with email/password    | No   |
| POST   | `/api/auth/email/login`       | Login with email/password       | No   |
| GET    | `/api/auth/google`            | Initiate Google OAuth           | No   |
| GET    | `/api/auth/google/callback`   | Google OAuth callback           | No   |
| GET    | `/api/auth/github`            | Initiate GitHub OAuth           | No   |
| GET    | `/api/auth/github/callback`   | GitHub OAuth callback           | No   |
| GET    | `/api/auth/me`                | Get current user                | Yes  |

### Tasks

| Method | Endpoint              | Description                     | Auth |
|--------|-----------------------|---------------------------------|------|
| GET    | `/api/tasks`          | List tasks for current user     | Yes  |
| POST   | `/api/tasks`          | Create a new task               | Yes  |
| GET    | `/api/tasks/{id}`     | Get a specific task             | Yes  |
| PUT    | `/api/tasks/{id}`     | Update a task                   | Yes  |
| DELETE | `/api/tasks/{id}`     | Delete a task                   | Yes  |

### Tags

| Method | Endpoint              | Description                     | Auth |
|--------|-----------------------|---------------------------------|------|
| GET    | `/api/tags`           | List tags for current user      | Yes  |
| POST   | `/api/tags`           | Create a tag                    | Yes  |
| DELETE | `/api/tags/{id}`      | Delete a tag                    | Yes  |

### Chat

| Method | Endpoint              | Description                          | Auth |
|--------|-----------------------|--------------------------------------|------|
| POST   | `/api/chat`           | Send message, get AI response        | Yes  |
| POST   | `/api/chat/stream`    | Send message, stream response (SSE)  | Yes  |
| GET    | `/api/chat/history`   | Get conversation history             | Yes  |

### System

| Method | Endpoint              | Description                     | Auth |
|--------|-----------------------|---------------------------------|------|
| GET    | `/`                   | Welcome message                 | No   |
| GET    | `/health`             | Basic health check              | No   |
| GET    | `/health/detailed`    | Detailed component status       | No   |

## Database Models

### User
- `id`, `email`, `first_name`, `last_name`
- `profile_image_url`, `profile_image_data`, `profile_image_content_type`
- Related: auth identities, credentials, tasks, tags, chat interactions

### Task
- `id`, `title`, `description`, `completed`
- `priority` — Enum: `HIGH`, `MEDIUM`, `LOW`
- `due_date`, `recurrence_rule` — Enum: `DAILY`, `WEEKLY`, `MONTHLY`
- `user_id` (foreign key)
- Many-to-many relationship with Tags via `TaskTagLink`

### Tag
- `id`, `name`, `color`
- `user_id` (foreign key)

### ChatInteraction / ChatMessage
- `ChatInteraction` — groups messages in a conversation session
- `ChatMessage` — individual message with role (`user`/`assistant`), content, and optional structured `OperationRequest`

### AuthIdentity / Credential
- `AuthIdentity` — links a user to an OAuth provider (Google/GitHub)
- `Credential` — stores hashed email/password for email auth

## AI Chat System

The chat system uses the OpenAI Agents SDK (via Groq) to process natural language and perform task operations.

### How it works
1. User sends a message through the chat interface
2. The backend classifies intent (create, update, delete, search, general query)
3. For task operations, the agent uses `task_crud_tools` to interact with the database
4. If the AI service is unavailable, it falls back to rule-based processing
5. Responses are streamed via Server-Sent Events for real-time display

### MCP (Model Context Protocol)
The `src/mcp/` directory contains an MCP server that exposes task CRUD operations as tools for AI agent orchestration.

## Authentication

- **JWT-based** — Tokens signed with `python-jose` (HS256), stored as HTTP-only cookies
- **OAuth** — Google and GitHub flows using `passport` strategies on the frontend, validated server-side
- **Password hashing** — `bcrypt` via `passlib`
- **Rate limiting** — Applied via `slowapi` middleware

## Testing

```bash
pip install -r requirements-dev.txt
pytest                          # Run all tests
pytest tests/unit/              # Unit tests only
pytest tests/integration/       # Integration tests only
pytest -v                       # Verbose output
```

## Environment Variables

| Variable              | Description                                   | Default                  |
|-----------------------|-----------------------------------------------|--------------------------|
| `DATABASE_URL`        | PostgreSQL or SQLite connection string         | `sqlite:///./todo_ai.db` |
| `SECRET_KEY`          | JWT signing key                               | *(required)*             |
| `FRONTEND_URL`        | Frontend URL for CORS                         | `http://localhost:3000`  |
| `PORT`                | Server port                                   | `8000`                   |
| `GROQ_API_KEY`        | Groq API key for AI features                  | *(optional)*             |
| `GOOGLE_CLIENT_ID`    | Google OAuth client ID                        | *(optional)*             |
| `GOOGLE_CLIENT_SECRET`| Google OAuth client secret                    | *(optional)*             |
| `GITHUB_CLIENT_ID`    | GitHub OAuth client ID                        | *(optional)*             |
| `GITHUB_CLIENT_SECRET`| GitHub OAuth client secret                    | *(optional)*             |
| `SQL_ECHO`            | Enable SQL query logging                      | Auto (SQLite only)       |

## Docker

```bash
docker build -t todo-ai-backend .
docker run -p 8000:8000 --env-file .env todo-ai-backend
```

The Dockerfile uses Python 3.11-slim, installs system dependencies (gcc, postgresql-client), and runs the app via uvicorn with a health check on `/health`.
