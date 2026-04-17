# Frontend Components Documentation

Comprehensive guide to all reusable components in the Todo AI frontend.

## Core Components

### AppShell

Main application layout wrapper providing consistent structure across all pages.

**Location**: `src/components/AppShell.tsx`

**Props**:
```typescript
interface AppShellProps {
  children: React.ReactNode;
}
```

**Features**:
- Navigation sidebar
- Main content area
- Header with user menu
- Responsive layout

**Usage**:
```typescript
import AppShell from '@/components/AppShell';

export default function Layout() {
  return (
    <AppShell>
      {/* Page content */}
    </AppShell>
  );
}
```

---

### AppCommandPalette

Global command/search interface (Cmd+K) for quick navigation and actions.

**Location**: `src/components/AppCommandPalette.tsx`

**Keyboard Shortcuts**:
- `Cmd/Ctrl + K` - Open palette
- `ESC` - Close palette
- Arrow keys - Navigate
- Enter - Execute command

**Available Commands**:
- `Create task` - New task dialog
- `Search tasks` - Filter tasks
- `Go to chat` - Navigate to chat
- `Settings` - App settings
- `Help` - Help documentation

**Usage**:
```typescript
import AppCommandPalette from '@/components/AppCommandPalette';

export default function App() {
  return <AppCommandPalette />;
}
```

---

### ChatInterface

AI-powered chat widget for natural language task operations.

**Location**: `src/components/ChatInterface.tsx`

**Props**:
```typescript
interface ChatInterfaceProps {
  onTasksUpdate?: () => void;
  className?: string;
}
```

**Features**:
- Streaming responses
- Message history
- Task suggestions
- Keyboard support (Enter to send, Shift+Enter for new line)

**Usage**:
```typescript
import ChatInterface from '@/components/ChatInterface';

export default function ChatPage() {
  return (
    <ChatInterface 
      onTasksUpdate={() => console.log('Tasks updated')}
    />
  );
}
```

---

### TaskList

Displays a filtered/sorted list of tasks with pagination and bulk actions.

**Location**: `src/components/TaskList.tsx`

**Props**:
```typescript
interface TaskListProps {
  tasks: Task[];
  isLoading?: boolean;
  onTaskUpdate: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskComplete: (taskId: string) => void;
  emptyState?: React.ReactNode;
}
```

**Features**:
- Sort by due date, priority, created date
- Filter by status, priority, tags
- Pagination
- Empty state handling
- Loading indicators

**Usage**:
```typescript
import TaskList from '@/components/TaskList';

function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);

  return (
    <TaskList
      tasks={tasks}
      onTaskUpdate={(task) => updateTask(task)}
      onTaskDelete={(id) => deleteTask(id)}
    />
  );
}
```

---

### TaskItem

Individual task row component with inline actions.

**Location**: `src/components/TaskItem.tsx`

**Props**:
```typescript
interface TaskItemProps {
  task: Task;
  onComplete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  isSelected?: boolean;
  onSelect?: (taskId: string) => void;
}
```

**Visual Elements**:
- Checkbox for completion
- Task title with overflow handling
- Priority badge
- Due date display
- Tag pills
- Action menu (edit, delete, more)

**Usage**:
```typescript
import TaskItem from '@/components/TaskItem';

function TasksList() {
  return (
    <TaskItem
      task={task}
      onComplete={handleComplete}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
}
```

---

### TaskForm

Form for creating or editing tasks with full validation.

**Location**: `src/components/TaskForm.tsx`

**Props**:
```typescript
interface TaskFormProps {
  onSubmit: (task: TaskInput) => void;
  initialValues?: Task;
  isLoading?: boolean;
  onCancel?: () => void;
}
```

**Form Fields**:
- Title (required, max 255 chars)
- Description (optional, rich text support)
- Priority dropdown (HIGH, MEDIUM, LOW)
- Due date picker
- Recurrence selector
- Tag selector (multi-select)

**Validation**:
- Required fields enforcement
- Email validation
- Date validation
- Custom validators

**Usage**:
```typescript
import TaskForm from '@/components/TaskForm';

function NewTaskPage() {
  return (
    <TaskForm
      onSubmit={async (task) => {
        await createTask(task);
      }}
    />
  );
}
```

---

### TagList

Displays user's tags with management options.

**Location**: `src/components/TagList.tsx`

**Props**:
```typescript
interface TagListProps {
  tags: Tag[];
  onEdit?: (tag: Tag) => void;
  onDelete?: (tagId: string) => void;
  onSelect?: (tagId: string) => void;
  selectedTagIds?: string[];
}
```

**Features**:
- Color-coded tags
- Tag count display
- Edit/delete actions
- Search/filter
- Sorting

**Usage**:
```typescript
import TagList from '@/components/TagList';

function TagsPanel() {
  return (
    <TagList
      tags={tags}
      onDelete={(id) => deleteTag(id)}
    />
  );
}
```

---

### TagSelector

Multi-select dropdown for assigning tags to tasks.

**Location**: `src/components/TagSelector.tsx`

**Props**:
```typescript
interface TagSelectorProps {
  tags: Tag[];
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}
```

**Features**:
- Multi-select functionality
- Search within tags
- Color preview
- Create new tag inline (if enabled)

**Usage**:
```typescript
import TagSelector from '@/components/TagSelector';

function TaskForm() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  return (
    <TagSelector
      tags={allTags}
      selectedTagIds={selectedTags}
      onChange={setSelectedTags}
    />
  );
}
```

---

### TaskInsights

Analytics and insights dashboard showing task statistics.

**Location**: `src/components/TaskInsights.tsx`

**Props**:
```typescript
interface TaskInsightsProps {
  tasks: Task[];
  className?: string;
}
```

**Displays**:
- Total tasks count
- Completed/pending ratio
- Tasks by priority
- Tasks by tag
- Overdue tasks count
- Upcoming tasks chart

**Usage**:
```typescript
import TaskInsights from '@/components/TaskInsights';

function Dashboard() {
  return <TaskInsights tasks={tasks} />;
}
```

---

## Form Components

### CustomSelect

Custom-styled select dropdown with search capability.

**Location**: `src/components/CustomSelect.tsx`

**Props**:
```typescript
interface CustomSelectProps {
  options: Array<{ label: string; value: string }>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
}
```

**Features**:
- Keyboard navigation
- Search filtering
- Accessibility
- Custom styling

**Usage**:
```typescript
import CustomSelect from '@/components/CustomSelect';

function FilterPanel() {
  const [priority, setPriority] = useState('');

  return (
    <CustomSelect
      options={[
        { label: 'High', value: 'HIGH' },
        { label: 'Medium', value: 'MEDIUM' },
        { label: 'Low', value: 'LOW' },
      ]}
      value={priority}
      onChange={setPriority}
      placeholder="Select priority"
    />
  );
}
```

---

## Layout Components

### ProtectedRoute

Wrapper component for routes requiring authentication.

**Location**: `src/components/ProtectedRoute.tsx`

**Props**:
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
```

**Behavior**:
- Checks authentication status
- Redirects to sign-in if not authenticated
- Shows loading state while checking
- Renders fallback if provided

**Usage**:
```typescript
import ProtectedRoute from '@/components/ProtectedRoute';

function Dashboard() {
  return (
    <ProtectedRoute>
      <div>Protected content</div>
    </ProtectedRoute>
  );
}
```

---

### ScrollToTop

Floating button for scrolling to top of page.

**Location**: `src/components/ScrollToTop.tsx`

**Features**:
- Appears after scroll threshold
- Smooth scroll animation
- Keyboard accessible (Enter/Space)

**Usage**:
```typescript
import ScrollToTop from '@/components/ScrollToTop';

export default function RootLayout() {
  return (
    <>
      {/* Content */}
      <ScrollToTop />
    </>
  );
}
```

---

### ProfileMenu

User dropdown menu with settings and logout.

**Location**: `src/components/ProfileMenu.tsx`

**Props**:
```typescript
interface ProfileMenuProps {
  user?: User;
}
```

**Menu Items**:
- View profile
- Edit profile
- Settings
- Theme toggle
- Help
- Logout

**Usage**:
```typescript
import ProfileMenu from '@/components/ProfileMenu';

function Header() {
  return (
    <header>
      {/* Other header content */}
      <ProfileMenu />
    </header>
  );
}
```

---

## UI Components

### Footer

Application footer with links and copyright.

**Location**: `src/components/Footer.tsx`

**Includes**:
- Links (About, Privacy, Terms)
- Social links
- Copyright info
- Responsive layout

---

### ServiceWorkerProvider

Initializes and manages service worker for offline support.

**Location**: `src/components/ServiceWorkerProvider.jsx`

**Features**:
- SW registration
- Update notifications
- Offline/online status
- Cache management

---

## Hooks

### useChat

Custom hook for chat operations.

**Location**: `src/hooks/useChat.tsx`

```typescript
const {
  messages,        // Array<Message>
  sendMessage,     // (text: string) => Promise<void>
  loading,         // boolean
  error,           // string | null
  clearHistory,    // () => void
} = useChat();
```

**Usage**:
```typescript
function ChatComponent() {
  const { messages, sendMessage } = useChat();

  const handleSend = async () => {
    await sendMessage('Create a task');
  };

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
```

---

### useOnlineStatus

Hook for detecting online/offline status.

**Location**: `src/hooks/useOnlineStatus.js`

```typescript
const isOnline = useOnlineStatus();
```

**Usage**:
```typescript
function App() {
  const isOnline = useOnlineStatus();

  return (
    <div>
      Status: {isOnline ? 'Online' : 'Offline'}
    </div>
  );
}
```

---

## Context

### AuthContext

Global authentication state management.

**Location**: `src/context/AuthContext.tsx`

```typescript
interface AuthContext {
  user: User | null;
  loading: boolean;
  login: (email, password) => Promise<void>;
  logout: () => void;
  signup: (email, password, name) => Promise<void>;
  isAuthenticated: boolean;
}
```

**Usage**:
```typescript
import { useAuth } from '@/context/AuthContext';

function Component() {
  const { user, logout } = useAuth();

  return (
    <div>
      Welcome, {user?.email}
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

---

## Styling

### Tailwind CSS

All components use Tailwind CSS 4 for styling.

**Key Classes**:
- `glass` - Glassmorphism effect
- `btn` - Button styles
- `input` - Form input styles
- `badge` - Badge/tag styles
- `card` - Card container

### Dark Theme

The application includes a comprehensive dark theme with:
- Dark backgrounds
- High contrast text
- Accessibility compliance
- Smooth transitions

---

## Accessibility

All components follow WCAG 2.1 guidelines:
- Keyboard navigation
- Screen reader support
- ARIA labels
- Color contrast
- Focus management

---

## Best Practices

### Component Creation

1. **Props Interface**
```typescript
interface MyComponentProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}
```

2. **JSDoc Comments**
```typescript
/**
 * MyComponent description
 * @param props - Component props
 * @returns Rendered component
 */
```

3. **Error Boundaries**
```typescript
try {
  // Component logic
} catch (error) {
  return <ErrorFallback error={error} />;
}
```

### Performance

- Use `React.memo` for expensive components
- Implement `useCallback` for event handlers
- Use dynamic imports for code splitting
- Avoid inline functions in JSX

---

## Component Testing

Example unit test:

```typescript
import { render, screen } from '@testing-library/react';
import TaskItem from '@/components/TaskItem';

describe('TaskItem', () => {
  it('renders task with title', () => {
    render(
      <TaskItem
        task={{
          id: '1',
          title: 'Test',
          completed: false,
          priority: 'HIGH',
        }}
        onComplete={() => {}}
      />
    );

    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

---

For more information, see the main [README.md](../README.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).
