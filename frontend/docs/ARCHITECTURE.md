# Frontend Architecture

Comprehensive overview of the Todo AI frontend system design and structure.

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Browser                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │        Next.js 16 App Router (SSR/SSG)                  │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  ┌─────────────────────────────────────────────────┐   │  │
│  │  │    React 19 Components (Server & Client)       │   │  │
│  │  └──────────────────┬──────────────────────────────┘   │  │
│  │                     │                                   │  │
│  │  ┌──────────────────▼──────────────────────────────┐   │  │
│  │  │    State Management Layer                      │   │  │
│  │  │  • AuthContext (global auth)                   │   │  │
│  │  │  • Local state (useState)                      │   │  │
│  │  │  • Custom hooks (useChat, etc.)                │   │  │
│  │  └──────────────────┬──────────────────────────────┘   │  │
│  │                     │                                   │  │
│  │  ┌──────────────────▼──────────────────────────────┐   │  │
│  │  │    API Services Layer                          │   │  │
│  │  │  • chatService.ts                              │   │  │
│  │  │  • auth-api.ts                                 │   │  │
│  │  │  • Fetch API calls                             │   │  │
│  │  └──────────────────┬──────────────────────────────┘   │  │
│  └────────────────────┼──────────────────────────────────┘  │
│                       │                                      │
│  ┌────────────────────▼──────────────────────────────────┐  │
│  │          Service Worker (Offline Support)             │  │
│  │  • HTTP interception                                  │  │
│  │  • Cache management                                   │  │
│  │  • Offline fallback                                   │  │
│  └────────────────────┬──────────────────────────────────┘  │
│                       │                                      │
└───────────────────────┼──────────────────────────────────────┘
                        │
        ┌───────────────▼────────────────┐
        │   HTTP/HTTPS Network Layer     │
        └───────────────┬────────────────┘
                        │
        ┌───────────────▼────────────────────────┐
        │   Backend API (FastAPI)                │
        │   http://localhost:8000/api/v1        │
        └────────────────────────────────────────┘
```

## Directory Structure & Purpose

### `/app` - Next.js App Router

**Purpose**: Define application routes and pages

```
app/
├── layout.tsx              # Root layout with providers
├── page.tsx                # Home page
├── globals.css             # Global styles
├── sign-in/                # Sign in page
│   └── page.tsx
├── sign-up/                # Sign up page
│   └── page.tsx
├── oauth-callback/         # OAuth callback handler
│   └── page.tsx
├── chat/                   # Chat interface
│   ├── layout.tsx
│   └── page.tsx
├── profile/                # User profile
│   ├── layout.tsx
│   └── page.tsx
└── api/                    # API routes
    └── auth/
        └── [method].ts
```

**Key Points**:
- Uses React Server Components by default
- Each `page.tsx` is a route
- `layout.tsx` wraps child routes
- API routes in `/api` are backend for frontend functions

### `/components` - Reusable UI Components

**Purpose**: Reusable React components used across pages

```
components/
├── AppShell.tsx            # Main layout wrapper
├── AppCommandPalette.tsx   # Cmd+K command palette
├── ChatInterface.tsx       # Chat widget
├── TaskList.tsx            # Task list display
├── TaskItem.tsx            # Individual task
├── TaskForm.tsx            # Task creation/editing
├── TagList.tsx             # Tag display
├── TagSelector.tsx         # Tag multi-select
├── TaskInsights.tsx        # Analytics dashboard
├── CustomSelect.tsx        # Custom dropdown
├── ProfileMenu.tsx         # User menu
├── ProtectedRoute.tsx      # Auth wrapper
├── ScrollToTop.tsx         # Scroll button
├── Footer.tsx              # Footer
└── ServiceWorkerProvider.jsx # SW provider
```

**Design Pattern**:
- All components are typed with TypeScript
- Props interface for each component
- Memoization where beneficial
- Accessibility built-in

### `/context` - React Context

**Purpose**: Global state management

```
context/
└── AuthContext.tsx
    ├── AuthProvider component
    ├── useAuth hook
    ├── Auth state (user, token, loading)
    └── Auth methods (login, logout, signup)
```

**Usage**:
```typescript
const { user, logout } = useAuth();
```

### `/hooks` - Custom React Hooks

**Purpose**: Encapsulate reusable logic

```
hooks/
├── useChat.tsx             # Chat operations
├── useOnlineStatus.js      # Online/offline detection
└── ... other hooks
```

**Examples**:
```typescript
const { messages, sendMessage } = useChat();
const isOnline = useOnlineStatus();
```

### `/lib` - Utility Functions

**Purpose**: Shared utility functions and helpers

```
lib/
├── auth-api.ts             # Authentication API calls
├── auth.ts                 # Auth utilities
├── passport.ts             # Passport utilities
└── utils.ts                # General utilities
```

**Purpose**:
- Token management
- URL building
- String formatting
- Date utilities

### `/services` - API Services

**Purpose**: Backend API communication

```
services/
├── chatService.ts          # Chat API operations
├── sync-service.ts         # Offline sync
└── offline-storage.js      # LocalStorage/IndexedDB
```

**Pattern**:
```typescript
export async function getTasks(filters) {
  const response = await fetch(`${API_URL}/tasks`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`,
    },
  });
  return response.json();
}
```

### `/types` - TypeScript Definitions

**Purpose**: Type definitions for the application

```
types/
├── auth.ts                 # Auth types
├── task.ts                 # Task types
├── tag.ts                  # Tag types
├── events.ts               # Event types
└── ... other types
```

**Example**:
```typescript
export interface Task {
  id: string;
  title: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  completed: boolean;
  tags: Tag[];
  dueDate?: Date;
}
```

### `/public` - Static Assets

**Purpose**: Static files served by Next.js

```
public/
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── offline.html            # Offline fallback
└── icons/                  # App icons
```

## Component Architecture

### Component Hierarchy

```
RootLayout
│
├── AuthProvider (context)
│   ├── ScrollToTop
│   ├── AppShell (if authenticated)
│   │   ├── Sidebar
│   │   │   ├── Navigation Links
│   │   │   └── TagList
│   │   ├── MainContent
│   │   │   ├── AppShell.Header
│   │   │   │   └── ProfileMenu
│   │   │   └── Page Content
│   │   │       ├── TaskList
│   │   │       │   └── TaskItem (multiple)
│   │   │       ├── TaskForm
│   │   │       └── TaskInsights
│   │   └── Footer
│   ├── ChatInterface (floating)
│   ├── AppCommandPalette (global)
│   ├── Toaster (notifications)
│   └── Footer
│
└── (sign-in/sign-up pages - no AppShell)
```

### Client vs Server Components

**Server Components** (default in Next.js 13+):
- Run on server only
- Can access databases directly
- Can keep secrets
- Reduce client bundle size

**Client Components** (`'use client'`):
- Run in browser
- Can use hooks (useState, useEffect)
- Can use browser APIs
- Examples: Forms, interactive components

```typescript
// Server Component
export default async function TasksPage() {
  const tasks = await fetchTasks();
  return <TaskList tasks={tasks} />;
}

// Client Component
'use client';
export default function TaskForm({ onSubmit }) {
  const [title, setTitle] = useState('');
  return <form onSubmit={() => onSubmit(title)}>...</form>;
}
```

## Data Flow

### Page Load Flow

```
1. User navigates to /chat
          ↓
2. Next.js routes to chat/page.tsx
          ↓
3. Layout.tsx wraps content
          ↓
4. AuthProvider checks authentication
          ↓
5. If not authenticated → redirect to /sign-in
          ↓
6. If authenticated → render app shell + page content
          ↓
7. Components fetch data via services
          ↓
8. Data displayed in UI
          ↓
9. User interacts with components
```

### Task Creation Flow

```
1. User clicks "Create Task" or uses Cmd+K
          ↓
2. TaskForm component opens
          ↓
3. User fills in form and submits
          ↓
4. Form validation runs
          ↓
5. taskService.createTask() called
          ↓
6. HTTP POST to /api/v1/tasks
          ↓
7. Backend creates task
          ↓
8. Response received
          ↓
9. Local state updated
          ↓
10. UI re-renders with new task
          ↓
11. Notification shown to user
```

### Offline Flow

```
Online State
    ↓
User makes request
    ↓
Service Worker intercepts
    ↓
Request sent to backend
    ↓
Response cached
    ↓
Data displayed
    ↓
    
Offline State Detected
    ↓
User makes request
    ↓
Service Worker intercepts
    ↓
No network available
    ↓
Cached response returned
    ↓
Data displayed (from cache)
    ↓
Changes stored in IndexedDB
    ↓
    
Online State Resumed
    ↓
Sync service detects online
    ↓
Queued changes sent to backend
    ↓
Backend responds
    ↓
Local cache updated
    ↓
User notified
```

## State Management Strategy

### Global State (AuthContext)

```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (email: string, password: string, name: string) => Promise<void>;
  refreshToken: () => Promise<void>;
  isAuthenticated: boolean;
}
```

**When to use**:
- User authentication status
- Current user info
- Global auth methods

### Local State (useState)

```typescript
const [tasks, setTasks] = useState<Task[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [filter, setFilter] = useState('all');
```

**When to use**:
- Page/component-specific data
- UI state (forms, modals, filters)
- Temporary data

### Derived State (useMemo)

```typescript
const filteredTasks = useMemo(() => {
  return tasks.filter(t => {
    if (filter === 'completed') return t.completed;
    if (filter === 'pending') return !t.completed;
    return true;
  });
}, [tasks, filter]);
```

**When to use**:
- Filtered/sorted data
- Expensive computations
- Values derived from other state

## API Communication Pattern

### Service Pattern

```typescript
// services/chatService.ts
export async function sendMessage(message: string) {
  const token = getToken();
  
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/chat`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  return response.json();
}

// In component
const handleSend = async () => {
  try {
    const response = await sendMessage(text);
    setMessages([...messages, response]);
  } catch (error) {
    showError(error.message);
  }
};
```

### Streaming Pattern (Chat)

```typescript
// Service
export async function* streamMessage(message: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/chat/stream`,
    {
      method: 'POST',
      body: JSON.stringify({ message }),
    }
  );

  const reader = response.body?.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const text = new TextDecoder().decode(value);
    yield text;
  }
}

// In component
const handleStream = async () => {
  for await (const chunk of streamMessage(text)) {
    setResponse(prev => prev + chunk);
  }
};
```

## Authentication Flow

### JWT Token Management

```typescript
// Store token
localStorage.setItem('token', token);

// Retrieve token
function getToken() {
  return localStorage.getItem('token');
}

// Include in requests
headers: {
  'Authorization': `Bearer ${getToken()}`,
}

// Check expiration
function isTokenExpired() {
  const token = getToken();
  if (!token) return true;
  
  const decoded = jwtDecode(token);
  return decoded.exp < Date.now() / 1000;
}
```

### OAuth Flow

```
1. User clicks "Sign in with Google"
       ↓
2. Redirect to Google OAuth
       ↓
3. User authenticates with Google
       ↓
4. Redirected to oauth-callback
       ↓
5. Send code to backend
       ↓
6. Backend exchanges code for token
       ↓
7. User logged in
       ↓
8. Redirect to dashboard
```

## Offline Support Architecture

### Service Worker

```
┌─────────────────────────────────┐
│   User Action                   │
└────────────┬────────────────────┘
             │
      ┌──────▼──────────┐
      │ Service Worker  │
      │ Intercepts      │
      └────────┬────────┘
             │
      ┌──────┴──────────┐
      │                 │
  Online          Offline
  Fetch            │
     │        ┌────▼────┐
     │        │ IndexedDB│
     │        │ or Cache │
     │        └──────────┘
     │
  ┌──▼────────────┐
  │ Backend API   │
  └────────────────┘
```

### Data Sync Strategy

```typescript
// Queue operations while offline
const pendingOperations: Operation[] = [];

async function handleOfflineChange(operation) {
  if (navigator.onLine) {
    await executeAPI(operation);
  } else {
    pendingOperations.push(operation);
    saveToIndexedDB(operation);
  }
}

// Sync when online
window.addEventListener('online', async () => {
  const operations = await getFromIndexedDB();
  for (const op of operations) {
    try {
      await executeAPI(op);
      await removeFromIndexedDB(op.id);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
});
```

## Performance Optimization

### Code Splitting

```typescript
// Dynamic imports for large components
const ChatInterface = dynamic(() => import('@/components/ChatInterface'));
const TaskForm = dynamic(() => import('@/components/TaskForm'));
```

### Image Optimization

```typescript
import Image from 'next/image';

<Image
  src="/profile.jpg"
  alt="Profile"
  width={200}
  height={200}
  priority={false}
/>
```

### Memoization

```typescript
import { memo, useMemo, useCallback } from 'react';

// Memoize component
export const TaskItem = memo(({ task, onUpdate }) => {
  return <div>{task.title}</div>;
});

// Memoize value
const filteredTasks = useMemo(() => {
  return tasks.filter(t => t.priority === 'HIGH');
}, [tasks]);

// Memoize function
const handleUpdate = useCallback((id: string) => {
  updateTask(id);
}, [updateTask]);
```

## Security Considerations

### XSS Prevention
- React escapes content by default
- Use `dangerouslySetInnerHTML` carefully
- Sanitize user input

### CSRF Protection
- Cookies set with SameSite=Strict
- Token in headers (not cookies)

### Sensitive Data
- Never store passwords
- Store tokens in secure storage
- Clear tokens on logout

### API Security
- HTTPS in production
- API validation on backend
- Rate limiting

## Testing Strategy

### Unit Tests
- Component rendering
- Hook behavior
- Utility functions

### Integration Tests
- Full user flows
- API interactions
- State management

### E2E Tests
- Real browser testing
- User journeys
- Cross-browser support

## Deployment Architecture

### Build Process

```
npm run build
    ↓
├─ TypeScript compilation
├─ Code bundling
├─ CSS minification
├─ Image optimization
└─ Output to .next/
```

### Deployment

```
.next/ folder
    ↓
├─ Deploy to Vercel (recommended)
├─ Or Docker container
├─ Or traditional hosting
    ↓
Frontend served
    ↓
API calls to backend
```

## File Naming Conventions

- **Components**: PascalCase (`TaskItem.tsx`)
- **Hooks**: camelCase with `use` prefix (`useChat.tsx`)
- **Services**: camelCase (`chatService.ts`)
- **Types**: PascalCase interface names (`Task.ts` exports `interface Task`)
- **Pages**: lowercase directory, `page.tsx` inside (`app/chat/page.tsx`)

---

For more information:
- [Component Documentation](./COMPONENTS.md)
- [Development Guide](./DEVELOPMENT.md)
- [Main README](../README.md)
- [Backend Architecture](../../backend/docs/ARCHITECTURE.md)
