# Backend Development Guide

Complete guide for developing and contributing to the Todo AI backend.

## Getting Started

### Prerequisites

```bash
# Minimum requirements
- Python 3.11+
- pip or poetry
- PostgreSQL 14+ OR SQLite
- Git
- Code editor (VS Code recommended)
```

### Initial Setup

```bash
# Clone repository
git clone https://github.com/yourusername/todo-ai.git
cd todo-ai/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Linux/macOS
source venv/bin/activate

# Windows
venv\Scripts\activate

# Install dependencies
pip install -r requirements-dev.txt

# Create environment file
cp .env.example .env

# Run the server
uvicorn src.main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` to see API documentation.

## Development Workflow

### Project Commands

```bash
# Run development server with auto-reload
uvicorn src.main:app --reload --port 8000

# Run production server
uvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 4

# Run tests
pytest

# Run specific test file
pytest tests/test_task_service.py

# Run tests with coverage
pytest --cov=src tests/

# Lint code
flake8 src/
black --check src/
isort --check-only src/

# Format code
black src/
isort src/
```

### Creating a New Feature

1. **Create a feature branch**
```bash
git checkout -b feature/advanced-task-filtering
```

2. **Implement the feature**

3. **Add tests**
```bash
touch tests/test_new_feature.py
```

4. **Run tests to verify**
```bash
pytest tests/test_new_feature.py -v
```

5. **Format and lint code**
```bash
black src/
isort src/
flake8 src/
```

6. **Commit changes**
```bash
git add .
git commit -m "feat: implement advanced task filtering"
```

## Coding Standards

### Python Best Practices

**Use type hints**:
```python
# ✅ Good
def create_task(
    session: Session,
    user_id: UUID,
    title: str,
    priority: str = "MEDIUM",
) -> Task:
    """Create a new task for user."""
    # Implementation
    pass

# ❌ Bad
def create_task(session, user_id, title, priority="MEDIUM"):
    # Implementation
    pass
```

**Use docstrings**:
```python
# ✅ Good
def get_user_tasks(session: Session, user_id: UUID) -> List[Task]:
    """
    Retrieve all tasks for a specific user.
    
    Args:
        session: Database session
        user_id: UUID of the user
        
    Returns:
        List of Task objects
        
    Raises:
        ValueError: If user_id is invalid
    """
    # Implementation
    pass

# ❌ Bad
def get_user_tasks(session, user_id):
    # No docstring
    pass
```

**Use proper error handling**:
```python
# ✅ Good
try:
    task = session.exec(select(Task).where(Task.id == task_id)).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task
except Exception as e:
    logger.error(f"Error retrieving task: {e}")
    raise

# ❌ Bad
task = session.exec(select(Task).where(Task.id == task_id)).first()
return task  # No error handling
```

### Code Style

- Use **Black** for formatting (100-char line length)
- Use **isort** for import organization
- Use **flake8** for linting
- Follow **PEP 8** style guide
- Use meaningful variable names

### Project Organization

```
src/
├── api/
│   ├── __init__.py
│   ├── task_router.py     # All task endpoints
│   ├── auth_router.py     # All auth endpoints
│   └── ...
├── services/
│   ├── __init__.py
│   ├── task_service.py    # Task business logic
│   ├── auth_service.py    # Auth business logic
│   └── ...
├── models/
│   ├── __init__.py
│   ├── task.py            # Task SQLModel
│   ├── user.py            # User SQLModel
│   └── ...
└── schemas/
    ├── __init__.py
    └── task.py            # Task Pydantic schemas
```

## Working with Models

### Creating a New Model

**Step 1: Create SQLModel**
```python
# src/models/feature.py
from sqlmodel import Field, SQLModel
from datetime import datetime
from uuid import UUID, uuid4
from typing import Optional, List

class Feature(SQLModel, table=True):
    """Database model for Feature."""
    
    __tablename__ = "feature"
    
    # Primary Key
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    # Content
    name: str = Field(max_length=255, index=True)
    description: Optional[str] = None
    
    # Status
    enabled: bool = Field(default=True, index=True)
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Foreign Key
    user_id: UUID = Field(foreign_key="user.id", index=True)
    
    # Relationships
    user: Optional["User"] = Relationship(back_populates="features")
```

**Step 2: Create Pydantic Schema**
```python
# src/schemas/feature.py
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional

class FeatureResponse(BaseModel):
    """Response model for Feature."""
    
    id: UUID
    name: str
    description: Optional[str]
    enabled: bool
    created_at: datetime
    updated_at: datetime

class FeatureCreateRequest(BaseModel):
    """Request model for creating Feature."""
    
    name: str = Field(max_length=255)
    description: Optional[str] = None
    enabled: bool = Field(default=True)
```

**Step 3: Create Service**
```python
# src/services/feature_service.py
from sqlmodel import Session, select
from uuid import UUID
from datetime import datetime
from src.models.feature import Feature
from src.schemas.feature import FeatureCreateRequest

class FeatureService:
    """Service for Feature operations."""
    
    @staticmethod
    def create_feature(
        session: Session,
        user_id: UUID,
        request: FeatureCreateRequest,
    ) -> Feature:
        """Create a new feature."""
        feature = Feature(
            name=request.name,
            description=request.description,
            enabled=request.enabled,
            user_id=user_id,
        )
        session.add(feature)
        session.commit()
        session.refresh(feature)
        return feature
    
    @staticmethod
    def get_user_features(session: Session, user_id: UUID) -> List[Feature]:
        """Get all features for a user."""
        statement = select(Feature).where(Feature.user_id == user_id)
        return session.exec(statement).all()

feature_service = FeatureService()
```

## Working with Routers

### Creating a New Router

```python
# src/api/feature_router.py
from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlmodel import Session
from uuid import UUID

from src.database import get_session
from src.middleware.auth import get_current_user
from src.models.user import User
from src.models.feature import Feature
from src.schemas.feature import FeatureResponse, FeatureCreateRequest
from src.services.feature_service import feature_service

router = APIRouter(prefix="/api/v1", tags=["features"])
limiter = Limiter(key_func=get_remote_address)

@router.get("/features", response_model=List[FeatureResponse])
@limiter.limit("100/minute")
async def get_features(
    request: Request,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> List[FeatureResponse]:
    """Get all features for current user."""
    features = feature_service.get_user_features(session, current_user.id)
    return [
        FeatureResponse(
            id=f.id,
            name=f.name,
            description=f.description,
            enabled=f.enabled,
            created_at=f.created_at,
            updated_at=f.updated_at,
        )
        for f in features
    ]

@router.post("/features", response_model=FeatureResponse, status_code=201)
async def create_feature(
    request: FeatureCreateRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> FeatureResponse:
    """Create a new feature."""
    feature = feature_service.create_feature(session, current_user.id, request)
    return FeatureResponse(
        id=feature.id,
        name=feature.name,
        description=feature.description,
        enabled=feature.enabled,
        created_at=feature.created_at,
        updated_at=feature.updated_at,
    )
```

**Register the router in main.py**:
```python
from src.api.feature_router import router as feature_router

app.include_router(feature_router)
```

## Testing

### Unit Tests

```python
# tests/test_feature_service.py
import pytest
from sqlmodel import Session
from uuid import uuid4

from src.services.feature_service import feature_service
from src.schemas.feature import FeatureCreateRequest

def test_create_feature(session: Session):
    """Test creating a feature."""
    user_id = uuid4()
    request = FeatureCreateRequest(name="Test Feature")
    
    feature = feature_service.create_feature(session, user_id, request)
    
    assert feature.name == "Test Feature"
    assert feature.user_id == user_id
    assert feature.enabled is True

def test_get_user_features(session: Session):
    """Test getting user features."""
    user_id = uuid4()
    
    # Create features
    request1 = FeatureCreateRequest(name="Feature 1")
    request2 = FeatureCreateRequest(name="Feature 2")
    feature_service.create_feature(session, user_id, request1)
    feature_service.create_feature(session, user_id, request2)
    
    # Get features
    features = feature_service.get_user_features(session, user_id)
    
    assert len(features) == 2
```

### Integration Tests

```python
# tests/test_api_integration.py
import pytest
from fastapi.testclient import TestClient

from src.main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_create_feature_endpoint(client: TestClient):
    """Test creating feature via API."""
    # First create user and get token
    # ... auth setup ...
    
    response = client.post(
        "/api/v1/features",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Test Feature"},
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Feature"
```

### Test Fixtures

```python
# tests/conftest.py
import pytest
from sqlmodel import Session, create_engine, SQLModel
from sqlmodel.pool import StaticPool

from src.database import get_session
from src.main import app

@pytest.fixture(name="session")
def session_fixture():
    """Create test database session."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

@pytest.fixture(name="client")
def client_fixture(session: Session):
    """Create test client with test database."""
    def get_session_override():
        return session
    
    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()
```

## Debugging

### Using print statements

```python
import logging

logger = logging.getLogger(__name__)

def create_task(session: Session, user_id: UUID, title: str) -> Task:
    logger.info(f"Creating task for user {user_id}: {title}")
    
    task = Task(title=title, user_id=user_id)
    session.add(task)
    session.commit()
    
    logger.info(f"Task created: {task.id}")
    return task
```

### Using debugger

**VS Code Launch Configuration** (`.vscode/launch.json`):
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": ["src.main:app", "--reload", "--port", "8000"],
      "jinja": true,
      "cwd": "${workspaceFolder}/backend",
    }
  ]
}
```

Then set breakpoints and run debugger.

### Logging

```python
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

logger.debug("Debug message")
logger.info("Info message")
logger.warning("Warning message")
logger.error("Error message")
logger.critical("Critical message")
```

## Database Management

### Running Migrations (if using Alembic)

```bash
# Initialize migrations
alembic init migrations

# Create migration
alembic revision --autogenerate -m "Add feature table"

# Apply migration
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

### Manual Schema Changes

```bash
# Connect to PostgreSQL
psql -U postgres -d todo_ai

# Run SQL
CREATE TABLE new_table (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);
```

## Environment Management

### Development Environment

```env
DATABASE_URL=sqlite:///./test.db
SECRET_KEY=dev-secret-key-change-in-production
ENVIRONMENT=development
DEBUG=True
```

### Production Environment

```env
DATABASE_URL=postgresql://user:password@prod-host:5432/todo_ai
SECRET_KEY=<generate-with-secrets.token_urlsafe(32)>
ENVIRONMENT=production
DEBUG=False
OPENROUTER_API_KEY=<your-key>
```

## Performance Optimization

### Query Optimization

```python
# ❌ N+1 Query Problem
tasks = session.exec(select(Task)).all()
for task in tasks:
    print(task.tags)  # Query for each task!

# ✅ Eager Loading
from sqlalchemy.orm import selectinload

statement = select(Task).options(selectinload(Task.tags))
tasks = session.exec(statement).all()
for task in tasks:
    print(task.tags)  # Already loaded
```

### Caching

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def get_priority_levels() -> List[str]:
    """Cache static priority levels."""
    return ["HIGH", "MEDIUM", "LOW"]
```

## Git Workflow

### Commit Convention

```
type(scope): subject

body

footer
```

**Types**:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code formatting
- `refactor` - Code refactoring
- `perf` - Performance improvement
- `test` - Test addition/modification
- `chore` - Build/maintenance

**Examples**:
```bash
git commit -m "feat(tasks): implement advanced filtering"
git commit -m "fix(auth): resolve token expiration issue"
git commit -m "docs(api): add filter parameter documentation"
```

## PR Process

1. **Create descriptive PR title**
   - `feat: add advanced task filtering`
   - `fix: resolve chat streaming lag`

2. **Provide detailed description**
   ```
   ## Description
   Brief description
   
   ## Changes
   - Change 1
   - Change 2
   
   ## Testing
   How to test
   
   ## Checklist
   - [ ] Tests pass
   - [ ] Code formatted
   - [ ] Docstrings added
   ```

3. **Ensure all checks pass**
   - Tests: `pytest`
   - Linting: `flake8`
   - Formatting: `black --check`

4. **Request review**

5. **Address feedback and merge**

## Troubleshooting

### Common Issues

**ModuleNotFoundError**
```bash
# Add src to Python path
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Or use python -m
python -m pytest tests/
```

**Database Connection Error**
```bash
# Check connection string
echo $DATABASE_URL

# Test connection
python -c "from sqlmodel import create_engine; engine = create_engine(os.getenv('DATABASE_URL'))"
```

**Port Already in Use**
```bash
# Find and kill process
lsof -i :8000
kill -9 <PID>

# Or use different port
uvicorn src.main:app --reload --port 8001
```

## Useful Resources

- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **SQLModel Docs**: https://sqlmodel.tiangolo.com/
- **Pydantic Docs**: https://docs.pydantic.dev/
- **Python Best Practices**: https://www.python.org/dev/peps/pep-0020/

---

For more information:
- [Backend README](../README.md)
- [Architecture Guide](./ARCHITECTURE.md)
- [Database Documentation](./DATABASE.md)
- [API Documentation](./API.md)
