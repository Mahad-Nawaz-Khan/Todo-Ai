# Backend Database Schema & Operations

Complete reference for the Todo AI backend database design and operations.

## Database Overview

### Supported Databases

| Database | Recommended For | Connection String |
|----------|-----------------|-------------------|
| PostgreSQL | Production | `postgresql://user:password@host:5432/todo_ai` |
| SQLite | Development | `sqlite:///./test.db` |

**Note**: PostgreSQL is recommended for production due to better concurrency and enum support.

## Database Models

### 1. User

Represents application users.

```python
class User(SQLModel, table=True):
    __tablename__ = "user"
    
    # Primary Key
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    # Basic Info
    email: str = Field(unique=True, index=True, max_length=255)
    full_name: str = Field(max_length=255)
    password_hash: str
    
    # Profile
    profile_image_url: Optional[str] = None
    profile_image_data: Optional[bytes] = None
    profile_image_content_type: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    tasks: List["Task"] = Relationship(back_populates="user", cascade_delete=True)
    tags: List["Tag"] = Relationship(back_populates="user", cascade_delete=True)
    auth_identities: List["AuthIdentity"] = Relationship(back_populates="user", cascade_delete=True)
    credential: Optional["Credential"] = Relationship(back_populates="user", cascade_delete=True)
```

**Indexes**:
- `email` - Fast lookup by email
- `created_at` - For sorting users

**Sample Data**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "full_name": "John Doe",
  "password_hash": "$2b$12$...",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

---

### 2. Task

Represents todo items.

```python
class Task(SQLModel, table=True):
    __tablename__ = "task"
    
    # Primary Key
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    # Content
    title: str = Field(max_length=255, index=True)
    description: Optional[str] = None
    
    # Status & Priority
    completed: bool = Field(default=False, index=True)
    priority: str = Field(default="MEDIUM")  # HIGH, MEDIUM, LOW
    
    # Dates
    due_date: Optional[datetime] = Field(default=None, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Recurrence
    recurrence_rule: Optional[str] = None  # DAILY, WEEKLY, MONTHLY
    
    # Foreign Key
    user_id: UUID = Field(foreign_key="user.id", index=True)
    
    # Relationships
    user: Optional[User] = Relationship(back_populates="tasks")
    tags: List["Tag"] = Relationship(
        back_populates="tasks",
        link_model=TaskTag,
        cascade_delete=True
    )
```

**Indexes**:
- `user_id` - Fast lookup by user
- `completed` - Filter completed tasks
- `due_date` - Sort by due date
- `created_at` - Timeline queries

**Sample Data**:
```json
{
  "id": "task-uuid",
  "title": "Complete project",
  "description": "Finish AI implementation",
  "completed": false,
  "priority": "HIGH",
  "due_date": "2024-01-20T23:59:59Z",
  "recurrence_rule": "DAILY",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "user_id": "user-uuid"
}
```

---

### 3. Tag

Represents task categories/labels.

```python
class Tag(SQLModel, table=True):
    __tablename__ = "tag"
    
    # Primary Key
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    # Content
    name: str = Field(max_length=100, index=True)
    color: str = Field(default="#6366F1")  # Hex color
    priority: int = Field(default=0)  # Sort order
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Foreign Key
    user_id: UUID = Field(foreign_key="user.id", index=True)
    
    # Relationships
    user: Optional[User] = Relationship(back_populates="tags")
    tasks: List[Task] = Relationship(
        back_populates="tags",
        link_model=TaskTag,
        cascade_delete=True
    )
```

**Indexes**:
- `user_id` - Fast lookup by user
- `name` - Search tags by name

**Sample Data**:
```json
{
  "id": "tag-uuid",
  "name": "Work",
  "color": "#FF5733",
  "priority": 1,
  "created_at": "2024-01-15T10:30:00Z",
  "user_id": "user-uuid"
}
```

---

### 4. TaskTag

Junction table for Task-Tag M2M relationship.

```python
class TaskTag(SQLModel, table=True):
    __tablename__ = "tasktag"
    
    # Foreign Keys (Composite Primary Key)
    task_id: UUID = Field(foreign_key="task.id", primary_key=True)
    tag_id: UUID = Field(foreign_key="tag.id", primary_key=True)
```

**Relationships**:
- Links tasks to tags (many-to-many)
- Enables filtering tasks by tag
- Supports tasks with multiple tags

---

### 5. AuthIdentity

Represents OAuth provider identities.

```python
class AuthIdentity(SQLModel, table=True):
    __tablename__ = "authidentity"
    
    # Primary Key
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    # OAuth Info
    provider: str = Field(index=True)  # google, github
    provider_user_id: str = Field(unique=True, index=True)
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Foreign Key
    user_id: UUID = Field(foreign_key="user.id", index=True)
    
    # Relationships
    user: Optional[User] = Relationship(back_populates="auth_identities")
```

**Providers**:
- `google` - Google OAuth
- `github` - GitHub OAuth

**Sample Data**:
```json
{
  "id": "auth-uuid",
  "provider": "google",
  "provider_user_id": "google-oauth-id",
  "user_id": "user-uuid",
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

### 6. Credential

Stores hashed user passwords.

```python
class Credential(SQLModel, table=True):
    __tablename__ = "credential"
    
    # Primary Key
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    # Password
    password_hash: str
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Foreign Key
    user_id: UUID = Field(foreign_key="user.id", unique=True, index=True)
    
    # Relationships
    user: Optional[User] = Relationship(back_populates="credential")
```

**Purpose**:
- Separate password storage
- Support passwordless login
- Password change tracking

---

## Entity Relationship Diagram

```
┌─────────────────────────┐
│         User            │
├─────────────────────────┤
│ id (PK)                 │
│ email (UNIQUE)          │
│ full_name               │
│ password_hash           │
│ created_at              │
│ updated_at              │
└────────┬────────────────┘
         │
    ┌────┴──────────────────────────┐
    │                               │
┌───▼──────────┐         ┌──────────▼──────────┐
│    Task      │         │   AuthIdentity      │
├──────────────┤         ├─────────────────────┤
│ id (PK)      │         │ id (PK)             │
│ title        │         │ provider            │
│ completed    │         │ provider_user_id    │
│ priority     │         │ user_id (FK)        │
│ due_date     │         └─────────────────────┘
│ user_id (FK) │
└────────┬─────┘
         │
    ┌────▼──────────────────┐
    │                       │
┌───▼────────┐      ┌──────▼──────┐
│  TaskTag   │      │     Tag     │
├────────────┤      ├─────────────┤
│ task_id(FK)│      │ id (PK)     │
│ tag_id (FK)│      │ name        │
└────────────┘      │ color       │
                    │ user_id(FK) │
                    └─────────────┘

    ┌──────────────────┐
    │   Credential     │
    ├──────────────────┤
    │ id (PK)          │
    │ password_hash    │
    │ user_id (FK,UNQ) │
    └──────────────────┘
```

## Database Initialization

### Automatic Table Creation

On application startup, the backend automatically:
1. Creates all tables if they don't exist
2. Creates PostgreSQL enum types (if using PostgreSQL)
3. Adds missing columns (profile images)

```python
# From main.py startup
SQLModel.metadata.create_all(bind=engine)
```

### PostgreSQL Enums

PostgreSQL automatically creates:
- `priorityenum` - HIGH, MEDIUM, LOW
- `recurrenceruleenum` - DAILY, WEEKLY, MONTHLY

### Migrations

For development, the application auto-creates tables. For production:

1. **Use Alembic** (recommended)
```bash
pip install alembic
alembic init migrations
alembic migrate --auto
alembic upgrade head
```

2. **Or manual SQL scripts**

## Querying Examples

### Get All User Tasks

```python
from sqlmodel import Session, select

def get_user_tasks(session: Session, user_id: UUID) -> List[Task]:
    statement = select(Task).where(Task.user_id == user_id)
    return session.exec(statement).all()
```

### Get High-Priority Tasks

```python
def get_high_priority_tasks(session: Session, user_id: UUID) -> List[Task]:
    statement = (
        select(Task)
        .where(Task.user_id == user_id)
        .where(Task.priority == "HIGH")
        .where(Task.completed == False)
    )
    return session.exec(statement).all()
```

### Get Overdue Tasks

```python
from datetime import datetime

def get_overdue_tasks(session: Session, user_id: UUID) -> List[Task]:
    statement = (
        select(Task)
        .where(Task.user_id == user_id)
        .where(Task.due_date < datetime.utcnow())
        .where(Task.completed == False)
    )
    return session.exec(statement).all()
```

### Get Tasks by Tag

```python
def get_tasks_by_tag(session: Session, user_id: UUID, tag_id: UUID) -> List[Task]:
    statement = (
        select(Task)
        .join(TaskTag)
        .join(Tag)
        .where(Task.user_id == user_id)
        .where(Tag.id == tag_id)
    )
    return session.exec(statement).all()
```

### Count Tasks by Priority

```python
from sqlalchemy import func

def count_tasks_by_priority(session: Session, user_id: UUID):
    statement = (
        select(Task.priority, func.count(Task.id))
        .where(Task.user_id == user_id)
        .group_by(Task.priority)
    )
    return session.exec(statement).all()
```

## Pagination

### Implement Pagination

```python
from sqlmodel import Session, select
from math import ceil

def get_paginated_tasks(
    session: Session,
    user_id: UUID,
    limit: int = 50,
    offset: int = 0
) -> dict:
    # Get total count
    count_statement = select(func.count(Task.id)).where(Task.user_id == user_id)
    total = session.exec(count_statement).one()
    
    # Get paginated results
    statement = (
        select(Task)
        .where(Task.user_id == user_id)
        .limit(limit)
        .offset(offset)
    )
    items = session.exec(statement).all()
    
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "pages": ceil(total / limit),
        "items": items,
    }
```

## Filtering & Sorting

### Build Dynamic Queries

```python
def get_filtered_tasks(
    session: Session,
    user_id: UUID,
    filters: dict,
    sort_by: str = "created_at",
    sort_order: str = "desc",
) -> List[Task]:
    statement = select(Task).where(Task.user_id == user_id)
    
    # Apply filters
    if filters.get("completed") is not None:
        statement = statement.where(Task.completed == filters["completed"])
    
    if filters.get("priority"):
        statement = statement.where(Task.priority == filters["priority"])
    
    if filters.get("tag_id"):
        statement = (
            statement
            .join(TaskTag)
            .where(TaskTag.tag_id == filters["tag_id"])
        )
    
    # Apply sorting
    sort_column = getattr(Task, sort_by, Task.created_at)
    if sort_order == "asc":
        statement = statement.order_by(sort_column.asc())
    else:
        statement = statement.order_by(sort_column.desc())
    
    return session.exec(statement).all()
```

## Transactions

### Handle Transactions

```python
from sqlalchemy.orm import Session

def create_task_with_tags(
    session: Session,
    user_id: UUID,
    title: str,
    tag_ids: List[UUID],
) -> Task:
    try:
        # Create task
        task = Task(
            title=title,
            user_id=user_id,
        )
        session.add(task)
        session.flush()  # Get task ID
        
        # Add tags
        for tag_id in tag_ids:
            task_tag = TaskTag(task_id=task.id, tag_id=tag_id)
            session.add(task_tag)
        
        session.commit()
        return task
    except Exception as e:
        session.rollback()
        raise e
```

## Indexes

### Current Indexes

```sql
-- User table
CREATE INDEX idx_user_email ON user(email);
CREATE INDEX idx_user_created_at ON user(created_at);

-- Task table
CREATE INDEX idx_task_user_id ON task(user_id);
CREATE INDEX idx_task_completed ON task(completed);
CREATE INDEX idx_task_due_date ON task(due_date);
CREATE INDEX idx_task_created_at ON task(created_at);
CREATE INDEX idx_task_title ON task(title);

-- Tag table
CREATE INDEX idx_tag_user_id ON tag(user_id);
CREATE INDEX idx_tag_name ON tag(name);

-- AuthIdentity
CREATE INDEX idx_auth_identity_provider ON authidentity(provider);
CREATE INDEX idx_auth_identity_provider_user_id ON authidentity(provider_user_id);
CREATE INDEX idx_auth_identity_user_id ON authidentity(user_id);

-- Credential
CREATE INDEX idx_credential_user_id ON credential(user_id);
```

### Add Custom Indexes

```python
# In models, use Field with index=True
class Task(SQLModel, table=True):
    due_date: Optional[datetime] = Field(index=True)  # Creates index
```

## Database Maintenance

### Backup PostgreSQL

```bash
# Backup
pg_dump -U postgres -h localhost todo_ai > backup.sql

# Restore
psql -U postgres -h localhost < backup.sql
```

### Clean Up Deleted Items

```python
# Soft deletes with cascade
class Task(SQLModel, table=True):
    deleted_at: Optional[datetime] = None  # Soft delete
```

### Database Statistics

```python
def get_db_stats(session: Session):
    users_count = session.exec(select(func.count(User.id))).one()
    tasks_count = session.exec(select(func.count(Task.id))).one()
    tags_count = session.exec(select(func.count(Tag.id))).one()
    
    return {
        "users": users_count,
        "tasks": tasks_count,
        "tags": tags_count,
    }
```

## Performance Optimization

### 1. Connection Pooling

```python
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=0,
)
```

### 2. Query Optimization

```python
# Use selectinload for eager loading
from sqlalchemy.orm import selectinload

statement = (
    select(Task)
    .options(selectinload(Task.tags))
    .where(Task.user_id == user_id)
)
```

### 3. Read Replicas

```python
# Use replicas for read-heavy queries
replica_engine = create_engine(DATABASE_REPLICA_URL)
read_session = Session(replica_engine)
```

## Troubleshooting

### Connection Issues

```python
# Test connection
from sqlmodel import Session

try:
    with Session(engine) as session:
        session.exec(select(1))
    print("✓ Database connection successful")
except Exception as e:
    print(f"✗ Database connection failed: {e}")
```

### Migration Issues

```bash
# Reset database (development only!)
# SQLite
rm test.db

# PostgreSQL
dropdb todo_ai
createdb todo_ai
```

---

For more information:
- [Backend README](../README.md)
- [Backend Architecture](./ARCHITECTURE.md)
- [API Documentation](./API.md)
