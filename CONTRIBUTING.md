# Contributing to Todo AI

Thank you for your interest in contributing to the Todo AI project! This guide will help you make meaningful contributions to both the frontend and backend.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Submitting Changes](#submitting-changes)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please read and adhere to our Code of Conduct:

- Be respectful and inclusive
- Welcome feedback and criticism
- Focus on what's best for the community
- Report inappropriate behavior

### Expected Behavior

- Use welcoming and inclusive language
- Be respectful of differing opinions and experiences
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

**For All Contributors**:
- Git knowledge (basic commits, branches, pull requests)
- GitHub account
- Code editor (VS Code recommended)

**For Backend Contributors**:
- Python 3.11+
- PostgreSQL or SQLite
- Basic knowledge of REST APIs

**For Frontend Contributors**:
- Node.js 18+
- React and TypeScript basics
- Basic CSS/Tailwind knowledge

### Finding Issues

1. **Easy Issues** - Good for first-time contributors
   - Look for `good first issue` label
   - Start with small, well-defined tasks
   - Ask questions if unclear

2. **Active Areas**
   - Bug fixes and improvements
   - Documentation enhancements
   - Feature implementations
   - Test coverage

3. **Suggest New Ideas**
   - Open a discussion issue first
   - Explain the problem and solution
   - Wait for feedback before implementation

## Development Setup

### Clone the Repository

```bash
git clone https://github.com/yourusername/todo-ai.git
cd todo-ai

# Create your feature branch
git checkout -b feature/your-feature-name
```

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate environment
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements-dev.txt

# Create .env file
cp .env.example .env

# Run the server
uvicorn src.main:app --reload --port 8000

# Access API docs
# Visit http://localhost:8000/docs
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.local.example .env.local

# Run dev server
npm run dev

# Visit http://localhost:3000
```

## Making Changes

### Backend Changes

#### Step 1: Create or Modify Models

```python
# src/models/your_model.py
from sqlmodel import Field, SQLModel
from datetime import datetime
from uuid import UUID, uuid4

class YourModel(SQLModel, table=True):
    """Documentation for your model."""
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    # Add fields...
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

#### Step 2: Create Schemas

```python
# src/schemas/your_model.py
from pydantic import BaseModel

class YourModelResponse(BaseModel):
    """Response schema."""
    id: str
    # Add fields...
```

#### Step 3: Create Service

```python
# src/services/your_model_service.py
from sqlmodel import Session

class YourModelService:
    """Service for your model operations."""
    
    @staticmethod
    def create(session: Session, data: dict):
        # Implementation
        pass
```

#### Step 4: Create Router

```python
# src/api/your_model_router.py
from fastapi import APIRouter, Depends

router = APIRouter(prefix="/api/v1", tags=["your-model"])

@router.post("/your-models")
async def create_your_model(request, session = Depends(get_session)):
    # Implementation
    pass
```

#### Step 5: Register Router

```python
# In src/main.py
from src.api.your_model_router import router

app.include_router(router)
```

### Frontend Changes

#### Step 1: Create Component

```typescript
// src/components/YourComponent.tsx
'use client';

interface YourComponentProps {
  prop1: string;
  onAction: (value: string) => void;
}

export const YourComponent: React.FC<YourComponentProps> = ({
  prop1,
  onAction,
}) => {
  return <div>{prop1}</div>;
};

export default YourComponent;
```

#### Step 2: Create Service

```typescript
// src/services/yourService.ts
export async function performAction(data: any) {
  const response = await fetch(`${API_URL}/api/v1/endpoint`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
}
```

#### Step 3: Use in Page

```typescript
// src/app/your-page/page.tsx
import YourComponent from '@/components/YourComponent';

export default function YourPage() {
  return <YourComponent prop1="value" />;
}
```

## Submitting Changes

### Step 1: Commit Your Changes

```bash
# Stage your changes
git add .

# Commit with descriptive message
git commit -m "feat(scope): description of changes"

# Examples:
# git commit -m "feat(tasks): add advanced filtering"
# git commit -m "fix(auth): resolve token refresh bug"
# git commit -m "docs(api): update endpoint documentation"
```

### Step 2: Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### Step 3: Create Pull Request

1. Go to GitHub
2. Click "New Pull Request"
3. Select your branch
4. Fill in the PR template

## Code Standards

### Python (Backend)

**Type Hints**:
```python
def create_item(user_id: UUID, name: str) -> Item:
    """Always include type hints."""
    pass
```

**Docstrings**:
```python
def function(param: str) -> str:
    """
    Brief description.
    
    Args:
        param: Parameter description
        
    Returns:
        Return description
    """
    pass
```

**Naming**:
- Functions: `snake_case`
- Classes: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`

**Formatting**:
```bash
# Run before committing
black src/
isort src/
flake8 src/
```

### TypeScript (Frontend)

**Type Definitions**:
```typescript
interface ComponentProps {
  title: string;
  isActive?: boolean;
}

type Status = 'pending' | 'completed' | 'failed';
```

**Component Structure**:
```typescript
'use client';

interface MyComponentProps {
  // Props definition
}

/**
 * Description of component
 * @param props - Component props
 */
export const MyComponent: React.FC<MyComponentProps> = (props) => {
  // Implementation
};

export default MyComponent;
```

**Naming**:
- Components: `PascalCase`
- Hooks: `camelCase` with `use` prefix
- Services: `camelCase`
- Types: `PascalCase`

**Formatting**:
```bash
npm run lint
npm run format
```

## Testing

### Backend Tests

```python
# tests/test_new_feature.py
import pytest

def test_create_item():
    """Test creating an item."""
    # Setup
    # Execute
    # Assert
    pass
```

**Run Tests**:
```bash
pytest                           # All tests
pytest tests/test_file.py        # Specific file
pytest -k "test_function"        # Matching tests
pytest --cov=src tests/          # With coverage
```

### Frontend Tests

```typescript
// __tests__/Component.test.tsx
import { render, screen } from '@testing-library/react';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />);
    expect(screen.getByText('text')).toBeInTheDocument();
  });
});
```

**Run Tests**:
```bash
npm test                    # All tests
npm test -- Component.test  # Specific file
npm test -- --coverage      # With coverage
```

### Testing Guidelines

- **Write tests before implementing** (TDD)
- **Cover happy paths and edge cases**
- **Mock external dependencies**
- **Use descriptive test names**
- **Keep tests focused and small**

## Documentation

### When to Update Docs

1. **New Feature** - Add to relevant README
2. **API Change** - Update API documentation
3. **Architectural Change** - Update architecture docs
4. **Bug Fix** - Update if behavior changed
5. **Code Refactor** - Update if interface changed

### Updating Documentation

1. **README Files**
   - Update feature lists
   - Update setup instructions if changed
   - Add new sections if needed

2. **Architecture Docs**
   - Update diagrams if structure changed
   - Add new patterns if applicable
   - Update examples

3. **Development Guides**
   - Add new workflows
   - Update code examples
   - Add troubleshooting tips

4. **API Documentation**
   - Document new endpoints
   - Update request/response examples
   - Add error codes

### Documentation Format

```markdown
# Title

Brief description.

## Section

Detailed explanation.

### Subsection

Code examples:
\`\`\`python
# code here
\`\`\`

## Related

- [Link](path/to/doc.md)
```

## Pull Request Process

### Before Submitting

- [ ] Code follows project style guide
- [ ] All tests pass locally
- [ ] Code is formatted correctly
- [ ] Documentation is updated
- [ ] No new warnings introduced
- [ ] Commits are clean and descriptive

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking)
- [ ] New feature (non-breaking)
- [ ] Breaking change
- [ ] Documentation update

## Testing
How to test the changes

## Screenshots
Include if UI changes

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Code formatted
```

### PR Review Process

1. **Automated Checks**
   - Tests must pass
   - No linting errors
   - Code coverage maintained

2. **Code Review**
   - At least one approval required
   - Address all comments
   - Follow up on questions

3. **Merge**
   - Squash or rebase commits
   - Ensure clean history
   - Delete feature branch

## Common Issues

### Backend

| Issue | Solution |
|-------|----------|
| Import errors | Check PYTHONPATH and virtual environment |
| Database errors | Verify DATABASE_URL and connection |
| Type errors | Use `mypy src/` to check |

### Frontend

| Issue | Solution |
|-------|----------|
| Module errors | Run `npm install` and clear cache |
| Type errors | Run `npx tsc --noEmit` |
| Build errors | Check for console errors and Next.js warnings |

### Git

| Issue | Solution |
|-------|----------|
| Merge conflicts | Resolve conflicts manually |
| Detached HEAD | `git checkout main` then rebase |
| Lost commits | `git reflog` to find them |

## Getting Help

### Resources

1. **Documentation**
   - [DOCUMENTATION.md](./DOCUMENTATION.md) - Complete guide index
   - [Backend Docs](./backend/docs/) - Backend documentation
   - [Frontend Docs](./frontend/docs/) - Frontend documentation

2. **Discussion**
   - Ask in issues
   - Mention maintainers with `@`
   - Tag with appropriate labels

3. **Examples**
   - Review existing code
   - Look at similar features
   - Check test files for patterns

## Recognition

### Contributors

All contributions are recognized:
- Code contributions
- Bug reports
- Feature suggestions
- Documentation improvements
- Community support

### Credit

Contributors are credited in:
- Commit messages
- Pull request descriptions
- Release notes (for significant contributions)

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

## Questions?

Don't hesitate to ask! Open an issue or discussion if you have any questions about contributing.

**Happy Contributing!** 🎉
