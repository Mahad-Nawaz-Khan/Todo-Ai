# Frontend — Todo AI

Next.js 16 application with React 19, Tailwind CSS 4, and a glassmorphism dark-theme UI.

## Quick Start

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint
```

## Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── page.tsx                # Home / Dashboard (main task view)
│   ├── layout.tsx              # Root layout (fonts, providers)
│   ├── globals.css             # CSS variables, animations, component styles
│   ├── sign-in/page.tsx        # Sign-in page
│   ├── sign-up/page.tsx        # Sign-up page
│   ├── chat/advanced/page.tsx  # Full-page chat view
│   ├── profile/page.tsx        # User profile page
│   ├── oauth-callback/         # OAuth redirect handler
│   └── api/auth/               # Auth API route handlers
│       ├── google/route.ts     # Google OAuth callback
│       ├── github/route.ts     # GitHub OAuth callback
│       ├── login/route.ts      # Email login proxy
│       └── register/route.ts   # Email registration proxy
├── components/
│   ├── AppShell.tsx             # Main layout shell (sidebar + content)
│   ├── AppCommandPalette.tsx    # Cmd+K command palette (cmdk)
│   ├── ChatInterface.tsx        # AI chat widget (floating + inline modes)
│   ├── CustomSelect.tsx         # Reusable dropdown select
│   ├── Footer.tsx               # App footer
│   ├── ProfileMenu.tsx          # User avatar dropdown
│   ├── ProtectedRoute.tsx       # Auth guard wrapper
│   ├── ScrollToTop.tsx          # Scroll-to-top button
│   ├── TagList.tsx              # Tag management sidebar
│   ├── TagSelector.tsx          # Tag picker for task forms
│   ├── TaskForm.tsx             # Create/edit task form
│   ├── TaskInsights.tsx         # Task statistics panel
│   ├── TaskItem.tsx             # Single task card
│   └── TaskList.tsx             # Task list with filters
└── public/
    ├── icons/                   # SVG icons (google.svg, github.svg)
    ├── manifest.json            # PWA manifest
    ├── sw.js                    # Service worker
    └── offline.html             # Offline fallback page
```

## Pages

### Dashboard (`/`)
The main page combines all core features:
- **Task list** with priority badges and due dates
- **Tag sidebar** for filtering
- **Floating chat widget** for AI interactions
- **Task form** (create/edit)
- **Task insights** panel

### Sign In (`/sign-in`)
- OAuth buttons (Google, GitHub) with branded SVG icons
- Email/password login form
- Error handling for auth failures

### Sign Up (`/sign-up`)
- OAuth buttons (Google, GitHub) with branded SVG icons
- Registration form (first name, last name, email, password, confirm password)
- Client-side validation (password length, match check)

### Chat (`/chat/advanced`)
- Full-page AI chat interface
- Streaming responses with markdown rendering
- Conversation context maintained across messages

### Profile (`/profile`)
- View/edit user profile
- Profile image upload

## Authentication Flow

1. **OAuth (Google/GitHub):** User clicks provider button → redirected to provider → callback to `/api/auth/{provider}` → proxy to backend → JWT set as cookie → redirect to `/`
2. **Email/Password:** Form submits to `/api/auth/login` or `/api/auth/register` (Next.js API routes) → proxy to backend → JWT cookie set → redirect

The `ProtectedRoute` component wraps pages that require authentication, checking for a valid JWT cookie.

## Styling

### CSS Variables
Defined in `globals.css` with a dark-theme-first design:

| Variable          | Purpose                        |
|-------------------|--------------------------------|
| `--bg-main`       | Page background (`#06080f`)    |
| `--bg-elevated`   | Card/panel background          |
| `--text-primary`  | Main text (`#f5f7fb`)          |
| `--text-dim`      | Secondary text (62% opacity)   |
| `--accent-ice`    | Primary accent (`#90e5ff`)     |
| `--accent-blue`   | Secondary accent               |
| `--accent-lime`   | Success color                  |
| `--accent-rose`   | Danger/error color             |

### Component Classes
Several reusable utility classes are defined in `globals.css`:
- `.glass-panel` — Frosted glass background effect
- `.section-card` — Elevated card container
- `.input-shell` — Styled form inputs
- `.action-button-primary` / `.action-button-secondary` — Button variants
- `.btn-press` — Press animation on click
- `.animate-fade-in-up` / `.animate-fade-in-scale` — Entry animations

## Key Dependencies

| Package           | Purpose                                  |
|-------------------|------------------------------------------|
| `next` 16         | React framework with App Router          |
| `react` 19        | UI library                               |
| `tailwindcss` 4   | Utility-first CSS                        |
| `lucide-react`    | Icon library                             |
| `cmdk`            | Command palette component                |
| `sonner`          | Toast notifications                      |
| `react-markdown`  | Render markdown in chat responses        |

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
GOOGLE_CLIENT_ID=your-google-client-id
GITHUB_CLIENT_ID=your-github-client-id
```
