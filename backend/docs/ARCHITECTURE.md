# Backend Architecture

Overview of the Todo AI backend system design and structure.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Client Layer                                 │
│                   (Next.js Frontend)                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  CORS Middleware│
                    └────────┬────────┘
                             │
        ┌────────────────────┴─────────────────────┐
        │                                          │
    ┌───▼──────────────┐             ┌────────────▼──────┐
    │  HTTP Request    │             │  Rate Limiting    │
    │  (FastAPI)       │             │  (SlowAPI)        │
    └───┬──────────────┘             └────────────┬──────┘
        │                                         │
        └──────────────────┬──────────────────────┘
                           │
        ┌──────────────────▼──────────────────┐
        │    Authentication Middleware        │
        │    (JWT Token Validation)           │
        └──────────────────┬──────────────────┘
                           │
        ┌──────────────────▼──────────────────┐
        │         API Routers Layer           │
        │  ┌─────────────────────────────┐   │
        │  │ • Auth Router               │   │
        │  │ • Task Router               │   │
        │  │ • Tag Router                │   │
        │  │ • Chat Router               │   │
        │  │ • Chat Streaming Router     │   │
        │  └─────────────────────────────┘   │
        └──────────────────┬──────────────────┘
                           │
        ┌──────────────────▼──────────────────┐
        │       Services Layer                │
        │  ┌─────────────────────────────┐   │
        │  │ • Auth Service              │   │
        │  │ • Task Service              │   │
        │  │ • Tag Service               │   │
        │  │ • Chat Service              │   │
        │  │ • Agent Service (AI)        │   │
        │  └─────────────────────────────┘   │
        └──────────────────┬──────────────────┘
                           │
        ┌──────────────────▼──────────────────┐
        │      Database Layer                 │
        │  ┌─────────────────────────────┐   │
        │  │ SQLModel ORM                │   │
        │  │ Models & Schemas            │   │
        │  └──────┬──────────────────────┘   │
        └─────────┼──────────────────────────┘
                  │
    ┌─────────────▼────────────┐
    │  PostgreSQL / SQLite     │
    └──────────────────────────┘
```

## Layered Architecture

### 1. **API Layer** (`api/`)
Defines HTTP endpoints using FastAPI routers.

**Responsibility**:
- Define route handlers
- Handle HTTP request/response
- Apply route-specific decorators (rate limiting, auth checks)
- Parse query parameters and request bodies
- Return appropriate HTTP status codes

**Files**:
- `auth_router.py` - Authentication endpoints
- `task_router.py` - Task CRUD endpoints
- `tag_router.py` - Tag management endpoints
- `chat_router.py` - Non-streaming chat endpoint
- `chat_streaming_router.py` - Streaming chat via SSE

**Example Flow**:
```
HTTP Request → Route Handler → Validate Input → Call Service → Return Response
```

### 2. **Service Layer** (`services/`)
Contains business logic and orchestration.

**Responsibility**:
- Implement business rules
- Coordinate between different components
- Handle data transformation
- Manage transactions
- Connect AI services

**Files**:
- `auth_service.py` - User authentication logic
- `task_service.py` - Task operations
- `tag_service.py` - Tag operations
- `chat_service.py` - Chat message handling
- `agent_service.py` - AI agent operations

**Example Service**:
```python
class TaskService:
    def create_task(self, user_id, title, priority, due_date):
        # Validate inputs
        # Create task model
        # Save to database
        # Return response
        pass
    
    def get_user_tasks(self, user_id, filters):
        # Build query
        # Apply filters
        # Execute query
        # Return results
        pass
```

### 3. **Model Layer** (`models/`)
SQLModel ORM models for database abstraction.

**Responsibility**:
- Define database table structures
- Handle relationships between entities
- Provide type safety
- Manage database constraints

**Models**:
- `user.py` - User accounts
- `task.py` - Task items
- `tag.py` - Tag definitions
- `task_tag.py` - Task-Tag relationships (M2M)
- `chat_models.py` - Chat messages
- `auth_identity.py` - OAuth identities
- `credential.py` - User credentials

**Example Model**:
```python
class Task(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    title: str
    description: Optional[str] = None
    priority: str = Field(default="MEDIUM")
    due_date: Optional[datetime] = None
    completed: bool = False
    user_id: UUID = Field(foreign_key="user.id")
    
    # Relationships
    user: User = Relationship(back_populates="tasks")
    tags: List[Tag] = Relationship(back_populates="tasks", link_model=TaskTag)
```

### 4. **Schema Layer** (`schemas/`)
Pydantic models for request/response validation.

**Responsibility**:
- Define API request/response formats
- Validate input data
- Provide API documentation
- Serialize/deserialize JSON

**Files**:
- `task.py` - Task request/response schemas

**Example Schema**:
```python
class TaskResponse(BaseModel):
    id: UUID
    title: str
    priority: str
    completed: bool
    tags: List[TagResponse]

class TaskCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Optional[str] = "MEDIUM"
    tag_ids: Optional[List[UUID]] = None
```

### 5. **Middleware Layer** (`middleware/`)
HTTP middleware for cross-cutting concerns.

**Responsibility**:
- Authentication and authorization
- Request/response logging
- Error handling
- CORS handling

**Files**:
- `auth.py` - JWT authentication

**Example**:
```python
async def get_current_user(token: str = Depends(oauth2_scheme)):
    # Verify JWT token
    # Extract user ID
    # Return user
    pass
```

### 6. **Database Layer** (`database.py`)
Database connection and session management.

**Responsibility**:
- Manage database connections
- Provide session factory
- Handle connection pooling
- Database initialization

**Code**:
```python
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")
engine = create_engine(DATABASE_URL, echo=False, connect_args={...})

def get_session():
    with Session(engine) as session:
        yield session
```

## Data Flow

### Creating a Task via Chat

```
1. User sends message: "Create a task to buy groceries"
           ↓
2. Chat API receives request
           ↓
3. Chat Service processes message
           ↓
4. Agent Service (AI) interprets intent
           ↓
5. AI calls task_crud_tools.create_task()
           ↓
6. Task Service creates task in database
           ↓
7. Response flows back through services
           ↓
8. Chat response returned to user
```

### Filtering Tasks

```
1. User requests: GET /api/v1/tasks?priority=HIGH&completed=false
           ↓
2. Task Router receives query parameters
           ↓
3. Task Service builds SQLModel query:
   SELECT * FROM tasks 
   WHERE priority='HIGH' AND completed=false
           ↓
4. SQLModel executes query via SQLAlchemy
           ↓
5. Results mapped to TaskResponse schema
           ↓
6. JSON response returned to client
```

## Authentication Flow

```
1. User logs in with credentials
           ↓
2. Auth Router → Auth Service
           ↓
3. Password verified with bcrypt
           ↓
4. JWT token created (with user_id claim)
           ↓
5. Token returned to client
           ↓
6. Client includes token in Authorization header
           ↓
7. Auth Middleware decodes and validates token
           ↓
8. User ID injected into request context
```

## AI & Agent Integration

### OpenAI Agents SDK Integration

```
┌──────────────────────────────────┐
│   Chat Message from User         │
└────────────┬─────────────────────┘
             │
      ┌──────▼──────────┐
      │ Chat Service    │
      └────────┬────────┘
               │
      ┌────────▼────────────────┐
      │ Agent Service (AI)      │
      │ • Initialized on startup│
      │ • Calls OpenAI Agents   │
      └────────┬────────────────┘
               │
      ┌────────▼──────────────────┐
      │ MCP Server                │
      │ • Registers tools         │
      │ • Handles tool calls      │
      └────────┬──────────────────┘
               │
      ┌────────▼──────────────────────────┐
      │ Task CRUD Tools                   │
      │ • create_task                     │
      │ • update_task                     │
      │ • delete_task                     │
      │ • get_tasks                       │
      └────────┬──────────────────────────┘
               │
      ┌────────▼──────────────────┐
      │ Task Service              │
      │ Executes actual operations│
      └────────┬──────────────────┘
               │
      ┌────────▼──────────────────┐
      │ Database                  │
      │ Persists changes          │
      └───────────────────────────┘
```

**Flow**:
1. User sends message via chat endpoint
2. Chat Service receives and logs message
3. Agent Service processes message with OpenAI Agents
4. Agent interprets natural language intent
5. Agent calls registered tools (task CRUD)
6. MCP Server handles tool execution
7. Task Service performs actual database operations
8. Results returned through the chain
9. Response formatted and sent back to user

## Key Design Patterns

### 1. **Dependency Injection**
```python
@router.get("/tasks")
async def get_tasks(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    pass
```

### 2. **Service Pattern**
Separate business logic from route handlers:
```python
# In route
tasks = await task_service.get_user_tasks(user.id, filters)

# In service
def get_user_tasks(self, user_id, filters):
    # Business logic here
    pass
```

### 3. **Repository Pattern**
Database operations encapsulated in services:
```python
# Services act as repositories
session.query(Task).filter(Task.user_id == user_id).all()
```

### 4. **Schema Validation**
Pydantic handles all input/output validation:
```python
@router.post("/tasks", response_model=TaskResponse)
async def create_task(request: TaskCreateRequest):
    # Automatically validated
    pass
```

## Error Handling

```
┌─────────────────────────────────┐
│     Exception Occurs            │
└────────────┬────────────────────┘
             │
      ┌──────▼──────────────────┐
      │ Exception Handler       │
      │ (if registered)         │
      └────────┬────────────────┘
             │
      ┌──────▼──────────────────┐
      │ HTTPException raised    │
      │ with appropriate code   │
      └────────┬────────────────┘
             │
      ┌──────▼──────────────────┐
      │ FastAPI formats to JSON │
      │ error response          │
      └────────┬────────────────┘
             │
      └──────▼──────────────────┐
           HTTP Response
           (with error code)
       └─────────────────────────┘
```

## Database Schema

### Core Entities

```
┌─────────────────┐
│     User        │
├─────────────────┤
│ id (PK)         │
│ email           │
│ password_hash   │
│ full_name       │
│ created_at      │
└────────┬────────┘
         │
    ┌────┴─────────────────────┐
    │                          │
┌───▼────────────┐      ┌──────▼──────────┐
│     Task       │      │  AuthIdentity   │
├────────────────┤      ├─────────────────┤
│ id (PK)        │      │ id (PK)         │
│ title          │      │ provider        │
│ description    │      │ provider_user_id│
│ priority       │      │ user_id (FK)    │
│ due_date       │      └─────────────────┘
│ completed      │
│ recurrence_rule│
│ user_id (FK)   │
│ created_at     │
└────────────────┘
         │
    ┌────┴──────────────┐
    │                   │
┌───▼────────────┐  ┌───▼──────────┐
│   TaskTag      │  │     Tag      │
├────────────────┤  ├──────────────┤
│ task_id (FK)   │  │ id (PK)      │
│ tag_id (FK)    │  │ name         │
└────────────────┘  │ color        │
                    │ priority     │
                    │ user_id (FK) │
                    │ created_at   │
                    └──────────────┘
```

## External Dependencies

### Production Dependencies
- **FastAPI** - Web framework
- **Uvicorn** - ASGI server
- **SQLModel** - ORM
- **PostgreSQL** - Database
- **OpenAI Agents SDK** - AI operations
- **python-jose** - JWT handling
- **bcrypt** - Password hashing
- **SlowAPI** - Rate limiting

### Development Tools
- **pytest** - Testing
- **black** - Code formatting
- **flake8** - Linting
- **mypy** - Type checking

## Performance Considerations

### 1. **Database Indexing**
- User IDs on tasks and tags
- Email on user table
- Task creation dates for sorting

### 2. **Caching**
- Consider Redis for frequently accessed data
- Cache user sessions
- Cache tags

### 3. **Query Optimization**
- Eager load relationships when needed
- Use pagination for large result sets
- Add database indexes on filter columns

### 4. **Rate Limiting**
- 100 requests/minute per IP
- Prevents abuse
- Graceful handling

## Security Considerations

### 1. **Authentication**
- JWT tokens with expiration
- OAuth 2.0 integration
- Password hashing with bcrypt

### 2. **Authorization**
- User can only access their own data
- Verified in route handlers
- Middleware checks on every request

### 3. **Input Validation**
- Pydantic schemas validate all inputs
- Type checking prevents injection attacks
- Length limits on strings

### 4. **CORS**
- Configurable allowed origins
- Prevents cross-origin attacks

## Deployment Architecture

### Development
```
Client → FastAPI (reload) → SQLite
```

### Production
```
Client → Nginx → FastAPI (multiple workers) → PostgreSQL
                     ↓
              OpenAI Agents SDK
```

## Future Improvements

1. **Caching Layer** - Redis for performance
2. **Async Database** - AsyncPG for better concurrency
3. **Message Queue** - Celery for async tasks
4. **Monitoring** - Prometheus metrics
5. **Logging** - Structured logging with ELK
6. **Database Migrations** - Alembic for schema versioning
7. **API Versioning** - Multiple API versions
8. **WebSocket** - Real-time updates for chat

---

See [API.md](./API.md) for endpoint documentation and [../README.md](../README.md) for setup instructions.
