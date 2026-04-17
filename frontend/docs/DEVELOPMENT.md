# Frontend Development Guide

Complete guide to developing and contributing to the Todo AI frontend.

## Getting Started

### Prerequisites

```bash
- Node.js 18+
- npm 9+ (or yarn, pnpm)
- Git
- Code editor (VS Code recommended)
```

### Initial Setup

```bash
# Clone repository
git clone https://github.com/yourusername/todo-ai.git
cd todo-ai/frontend

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local

# Start development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

## Development Workflow

### Project Commands

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Format code
npm run format    # if configured in package.json
```

### Creating a New Feature

1. **Create a feature branch**
```bash
git checkout -b feature/task-scheduling
```

2. **Create/modify components**
```bash
# New component
touch src/components/NewFeature.tsx
```

3. **Write code with TypeScript**
```typescript
'use client';

import React from 'react';

interface NewFeatureProps {
  title: string;
  onUpdate: (value: string) => void;
}

export const NewFeature: React.FC<NewFeatureProps> = ({ 
  title, 
  onUpdate 
}) => {
  const [input, setInput] = React.useState('');

  return (
    <div className="p-4">
      <h2>{title}</h2>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button onClick={() => onUpdate(input)}>
        Update
      </button>
    </div>
  );
};

export default NewFeature;
```

4. **Add tests**
```bash
touch src/__tests__/NewFeature.test.tsx
```

5. **Commit changes**
```bash
git add .
git commit -m "feat: add new feature for task scheduling"
```

6. **Push and create PR**
```bash
git push origin feature/task-scheduling
```

## Coding Standards

### TypeScript Guidelines

**Always use proper types**:
```typescript
// ✅ Good
interface TaskProps {
  id: string;
  title: string;
  onComplete: (id: string) => void;
}

export const Task: React.FC<TaskProps> = ({ id, title, onComplete }) => {
  // ...
};

// ❌ Bad
export const Task = ({ id, title, onComplete }: any) => {
  // ...
};
```

**Use const assertions for literals**:
```typescript
const priorities = ['HIGH', 'MEDIUM', 'LOW'] as const;
type Priority = typeof priorities[number];
```

### React Best Practices

**Use functional components with hooks**:
```typescript
// ✅ Good
export const TaskForm: React.FC<TaskFormProps> = (props) => {
  const [task, setTask] = useState('');
  const router = useRouter();
  
  const handleSubmit = useCallback(() => {
    // Submit logic
  }, [task]);

  return <form onSubmit={handleSubmit}>{/* JSX */}</form>;
};

// ❌ Bad - Class components
class TaskForm extends React.Component {
  // ...
}
```

**Memoize expensive components**:
```typescript
export const TaskList = memo(({ tasks }: TaskListProps) => {
  return (
    <ul>
      {tasks.map(task => (
        <TaskItem key={task.id} task={task} />
      ))}
    </ul>
  );
});
```

**Use hooks for reusable logic**:
```typescript
// ✅ Custom hook
export function useTaskFilters(tasks: Task[]) {
  const [filter, setFilter] = useState('all');
  
  const filtered = useMemo(() => {
    // Filter logic
  }, [tasks, filter]);

  return { filtered, filter, setFilter };
}

// Usage in component
const { filtered } = useTaskFilters(tasks);
```

### Styling Guidelines

Use Tailwind CSS classes:

```typescript
// ✅ Good - Tailwind classes
<div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
  <span className="text-white font-semibold">{title}</span>
  <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
    Edit
  </button>
</div>

// ❌ Avoid - Inline styles
<div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px' }}>
  {/* */}
</div>
```

**Extract repeated styles to components**:
```typescript
// Create reusable component
const GlassCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg p-4">
    {children}
  </div>
);

// Use it
<GlassCard>
  <TaskForm />
</GlassCard>
```

### File Organization

```
feature/
├── components/
│   ├── FeatureList.tsx
│   ├── FeatureItem.tsx
│   └── FeatureForm.tsx
├── hooks/
│   └── useFeature.ts
├── services/
│   └── featureService.ts
├── types/
│   └── feature.ts
└── __tests__/
    ├── FeatureList.test.tsx
    └── useFeature.test.ts
```

## Working with Components

### Creating a New Component

**Step 1: Define the interface**
```typescript
// components/MyComponent.tsx
interface MyComponentProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}
```

**Step 2: Implement the component**
```typescript
/**
 * MyComponent - A reusable component for [purpose]
 * 
 * @example
 * ```tsx
 * <MyComponent
 *   label="Name"
 *   value={name}
 *   onChange={setName}
 * />
 * ```
 */
export const MyComponent: React.FC<MyComponentProps> = ({
  label,
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="px-3 py-2 border rounded-lg"
      />
    </div>
  );
};

export default MyComponent;
```

**Step 3: Add tests**
```typescript
// __tests__/MyComponent.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders with label', () => {
    render(<MyComponent label="Test" value="" onChange={() => {}} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('calls onChange when input changes', () => {
    const onChange = jest.fn();
    render(<MyComponent label="Test" value="" onChange={onChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new value' } });
    
    expect(onChange).toHaveBeenCalledWith('new value');
  });
});
```

## Working with Hooks

### Creating a Custom Hook

```typescript
// hooks/useTaskFilters.ts
import { useState, useMemo } from 'react';
import { Task, TaskFilter } from '@/types/task';

/**
 * Hook for filtering and sorting tasks
 * @param tasks - Array of tasks to filter
 * @returns - Filtered tasks and filter controls
 */
export function useTaskFilters(tasks: Task[]) {
  const [filters, setFilters] = useState<TaskFilter>({
    priority: null,
    completed: null,
    tags: [],
  });

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filters.priority && task.priority !== filters.priority) {
        return false;
      }
      if (filters.completed !== null && task.completed !== filters.completed) {
        return false;
      }
      // More filter logic...
      return true;
    });
  }, [tasks, filters]);

  const updateFilter = (newFilters: Partial<TaskFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return {
    filteredTasks,
    filters,
    updateFilter,
    resetFilters: () => setFilters({ priority: null, completed: null, tags: [] }),
  };
}
```

## Working with Services

### Creating an API Service

```typescript
// services/taskService.ts
import { Task, TaskCreateRequest, TaskUpdateRequest } from '@/types/task';
import { getToken } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Get all tasks for the current user
 */
export async function getTasks(filters?: any): Promise<Task[]> {
  const token = getToken();
  const params = new URLSearchParams(filters);
  
  const response = await fetch(
    `${API_URL}/api/v1/tasks?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch tasks: ${response.statusText}`);
  }

  const data = await response.json();
  return data.items || [];
}

/**
 * Create a new task
 */
export async function createTask(task: TaskCreateRequest): Promise<Task> {
  const token = getToken();
  
  const response = await fetch(`${API_URL}/api/v1/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(task),
  });

  if (!response.ok) {
    throw new Error(`Failed to create task: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Update a task
 */
export async function updateTask(id: string, updates: TaskUpdateRequest): Promise<Task> {
  const token = getToken();
  
  const response = await fetch(`${API_URL}/api/v1/tasks/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error(`Failed to update task: ${response.statusText}`);
  }

  return response.json();
}
```

## Debugging

### VS Code Debugger

**Create `.vscode/launch.json`**:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### React Developer Tools

1. Install React DevTools browser extension
2. Open DevTools → Components tab
3. Inspect component props and state

### Network Debugging

1. Open DevTools → Network tab
2. Monitor API requests
3. Check request/response payloads

## Testing

### Unit Tests

```typescript
// __tests__/utils.test.ts
import { formatDate, getPriorityColor } from '@/lib/utils';

describe('formatDate', () => {
  it('formats date correctly', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date)).toBe('Jan 15, 2024');
  });
});
```

### Component Tests

```typescript
// __tests__/TaskForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import TaskForm from '@/components/TaskForm';

describe('TaskForm', () => {
  it('submits form with correct data', async () => {
    const onSubmit = jest.fn();
    render(<TaskForm onSubmit={onSubmit} />);
    
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'New Task' },
    });
    
    fireEvent.click(screen.getByText('Create'));
    
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'New Task' })
    );
  });
});
```

### Integration Tests

```typescript
// __tests__/integration/task-workflow.test.ts
describe('Task Workflow', () => {
  it('creates, updates, and deletes a task', async () => {
    // 1. Create task
    // 2. Verify it appears in list
    // 3. Update task
    // 4. Verify update
    // 5. Delete task
    // 6. Verify deletion
  });
});
```

## Performance Profiling

### Chrome DevTools

1. Open DevTools → Performance tab
2. Click record
3. Interact with app
4. Click stop
5. Analyze flame chart

### React Profiler

```typescript
import { Profiler, ProfilerOnRenderCallback } from 'react';

const onRenderCallback: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) => {
  console.log(`${id} (${phase}) took ${actualDuration}ms`);
};

<Profiler id="TaskList" onRender={onRenderCallback}>
  <TaskList />
</Profiler>
```

## Environment Variables

**Development** (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=dev-google-id
NEXT_PUBLIC_GITHUB_CLIENT_ID=dev-github-id
NEXT_PUBLIC_ENVIRONMENT=development
```

**Production** (`.env.production.local`):
```env
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=prod-google-id
NEXT_PUBLIC_GITHUB_CLIENT_ID=prod-github-id
NEXT_PUBLIC_ENVIRONMENT=production
```

## Git Workflow

### Commit Message Convention

```
type(scope): subject

body

footer
```

**Types**:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code style
- `refactor` - Code refactoring
- `perf` - Performance improvement
- `test` - Test addition/modification
- `chore` - Maintenance

**Examples**:
```
feat(chat): add streaming message support
fix(auth): resolve token refresh issue
docs(api): update endpoint documentation
refactor(components): extract TaskItem to separate file
```

## Pull Request Process

1. **Create descriptive PR title**
   - `feat: add task scheduling feature`
   - `fix: resolve chat streaming lag`

2. **Provide detailed description**
   ```
   ## Description
   Brief description of changes
   
   ## Type of Change
   - [ ] New feature
   - [ ] Bug fix
   - [ ] Documentation
   
   ## Testing
   How to test the changes
   
   ## Screenshots
   If applicable
   ```

3. **Ensure all checks pass**
   - TypeScript compilation
   - Linting
   - Tests

4. **Request review from team members**

5. **Address feedback and merge**

## Deployment

### Preview Deployment

```bash
# Auto-deployed on PR creation to Vercel
# Check PR for preview URL
```

### Production Deployment

```bash
# Merge to main branch
git push origin main

# Vercel automatically builds and deploys
# Monitor deployment in Vercel dashboard
```

## Troubleshooting

### Common Issues

**"Cannot find module"**
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run dev
```

**TypeScript errors**
```bash
# Check for type errors
npx tsc --noEmit

# Fix common errors
npx tsc --noEmit --strict
```

**Build fails**
```bash
# Check for console errors
npm run build

# Look at .next/error-overlay/[hash].json
```

---

For more information:
- [Architecture Guide](./ARCHITECTURE.md)
- [Component Reference](./COMPONENTS.md)
- [Backend Development](../../backend/docs/DEVELOPMENT.md)
