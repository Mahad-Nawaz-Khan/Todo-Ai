# Todo AI

An AI-powered task management application with natural language processing. Create, update, search, and organize tasks through an intelligent chat interface or traditional CRUD forms.

Built with **Next.js 16**, **FastAPI**, **OpenAI Agents SDK**, and **PostgreSQL**.

## Architecture

```
Todo-Ai/
├── frontend/          Next.js 16 app (React 19, Tailwind CSS 4)
│   └── src/
│       ├── app/       Pages & API routes (sign-in, sign-up, chat, profile)
│       └── components/Reusable UI components
├── backend/           FastAPI service (Python 3.11)
│   └── src/
│       ├── api/       REST routers (auth, tasks, tags, chat)
│       ├── models/    SQLModel database models
│       ├── services/  Business logic layer
│       ├── tools/     AI agent tools (task CRUD)
│       ├── mcp/       Model Context Protocol server
│       ├── middleware/ Auth middleware
│       └── schemas/   Pydantic request/response schemas
└── README.md
```

## Features

- **AI Chat Assistant** — Create, update, delete, and search tasks using natural language via an integrated chat widget powered by the OpenAI Agents SDK
- **Task Management** — Full CRUD with priorities (High/Medium/Low), due dates, and recurrence rules (Daily/Weekly/Monthly)
- **Tag System** — Organize tasks with tags and filter by tag
- **OAuth Authentication** — Sign in with Google, GitHub, or email/password (JWT-based)
- **Streaming Responses** — Real-time AI responses via Server-Sent Events
- **Dark Theme UI** — Glassmorphism design with a mobile-first responsive layout
- **Command Palette** — Quick keyboard-accessible actions (Cmd+K)
- **Rate Limiting** — API protection via SlowAPI
- **MCP Server** — Model Context Protocol integration for AI tool orchestration

## Tech Stack

| Layer        | Technology                                                       |
|--------------|------------------------------------------------------------------|
| Frontend     | Next.js 16, React 19, Tailwind CSS 4, Lucide Icons, cmdk        |
| Backend      | FastAPI, SQLModel, PostgreSQL (or SQLite for dev), Pydantic v2   |
| AI           | OpenAI Agents SDK, MCP Python SDK                                |
| Auth         | JWT (python-jose), OAuth 2.0 (Google, GitHub), bcrypt            |
| Deployment   | Docker, Vercel (frontend), Render (backend)                      |

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL (or use SQLite for local development)
- Google/GitHub OAuth credentials (optional, for social login)
- OpenRouter API key (optional, for AI features — falls back to rule-based processing)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Linux/macOS
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file (see Environment Variables below)
cp .env.example .env

# Run the server
uvicorn src.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local (see Environment Variables below)
cp .env.local.example .env.local

# Run the dev server
npm run dev
```

The frontend runs at `http://localhost:3000` and proxies API calls to the backend at `http://localhost:8000`.

## Environment Variables

### Backend (`backend/.env`)

| Variable              | Description                                   | Default                  |
|-----------------------|-----------------------------------------------|--------------------------|
| `DATABASE_URL`        | Database connection string                    | `sqlite:///./todo_ai.db` |
| `SECRET_KEY`          | JWT signing key                               | *(required)*             |
| `FRONTEND_URL`        | Frontend origin for CORS                      | `http://localhost:3000`  |
| `PORT`                | Server port                                   | `8000`                   |
| `OPENROUTER_API_KEY`  | API key for OpenRouter/AI features            | *(optional)*             |
| `GOOGLE_CLIENT_ID`    | Google OAuth client ID                        | *(optional)*             |
| `GOOGLE_CLIENT_SECRET`| Google OAuth client secret                    | *(optional)*             |
| `GITHUB_CLIENT_ID`    | GitHub OAuth client ID                        | *(optional)*             |
| `GITHUB_CLIENT_SECRET`| GitHub OAuth client secret                    | *(optional)*             |

### Frontend (`frontend/.env.local`)

| Variable                          | Description                        | Default                  |
|-----------------------------------|------------------------------------|--------------------------|
| `NEXT_PUBLIC_API_URL`             | Backend API URL                    | `http://localhost:8000`  |
| `GOOGLE_CLIENT_ID`                | Google OAuth client ID             | *(optional)*             |
| `GITHUB_CLIENT_ID`                | GitHub OAuth client ID             | *(optional)*             |

## API Overview

See [Complete API Documentation](./backend/docs/API.md) for detailed endpoint documentation.

| Method | Endpoint                    | Description                     |
|--------|-----------------------------|---------------------------------|
| POST   | `/api/v1/auth/signup`       | Register with email/password    |
| POST   | `/api/v1/auth/login`        | Login with email/password       |
| POST   | `/api/v1/auth/google`       | Google OAuth callback           |
| POST   | `/api/v1/auth/github`       | GitHub OAuth callback           |
| GET    | `/api/v1/tasks`             | List all tasks (with filtering) |
| POST   | `/api/v1/tasks`             | Create a new task               |
| GET    | `/api/v1/tasks/{id}`        | Get task details                |
| PUT    | `/api/v1/tasks/{id}`        | Update a task                   |
| DELETE | `/api/v1/tasks/{id}`        | Delete a task                   |
| PUT    | `/api/v1/tasks/{id}/complete` | Mark task as complete         |
| GET    | `/api/v1/tags`              | List all tags                   |
| POST   | `/api/v1/tags`              | Create a tag                    |
| PUT    | `/api/v1/tags/{id}`         | Update a tag                    |
| DELETE | `/api/v1/tags/{id}`         | Delete a tag                    |
| POST   | `/api/v1/chat`              | Send chat message (non-streaming) |
| POST   | `/api/v1/chat/stream`       | Stream chat response (SSE)      |

## Testing

### Backend

```bash
cd backend

# Install dev dependencies
pip install -r requirements-dev.txt

# Run all tests
pytest

# Run specific test file
pytest tests/test_task_service.py

# Run with coverage report
pytest --cov=src tests/
```

### Frontend

```bash
cd frontend

# Run linting
npm run lint

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## Development

### Recommended Workflow

1. **Start the backend**
   ```bash
   cd backend
   uvicorn src.main:app --reload --port 8000
   ```

2. **Start the frontend** (in another terminal)
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API Docs: http://localhost:8000/docs

### Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed contribution guidelines.

Quick checklist before submitting code:
- [ ] Tests pass (`pytest` for backend, `npm test` for frontend)
- [ ] Code is formatted (`black` for backend, `eslint` for frontend)
- [ ] Documentation is updated
- [ ] No console errors or warnings

## Documentation

Comprehensive documentation is available:

| Document | Purpose |
|----------|---------|
| [**DOCUMENTATION.md**](./DOCUMENTATION.md) | 📚 Complete documentation index and navigation guide |
| [**CONTRIBUTING.md**](./CONTRIBUTING.md) | 🤝 How to contribute to the project |
| **Backend** | |
| - [Backend README](./backend/README.md) | Setup and features |
| - [API Reference](./backend/docs/API.md) | Complete API documentation |
| - [Architecture](./backend/docs/ARCHITECTURE.md) | System design and structure |
| - [Development Guide](./backend/docs/DEVELOPMENT.md) | Development workflow |
| - [Database Schema](./backend/docs/DATABASE.md) | Database models and operations |
| **Frontend** | |
| - [Frontend README](./frontend/README.md) | Setup and features |
| - [Components Guide](./frontend/docs/COMPONENTS.md) | Component documentation |
| - [Architecture](./frontend/docs/ARCHITECTURE.md) | System design and structure |
| - [Development Guide](./frontend/docs/DEVELOPMENT.md) | Development workflow |

**Start here:** [DOCUMENTATION.md](./DOCUMENTATION.md) for a complete guide to all docs.

## Troubleshooting

### Backend

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError` | Ensure virtual environment is activated: `source venv/bin/activate` |
| Database connection error | Check `DATABASE_URL` in `.env` file |
| Port 8000 in use | Use different port: `uvicorn src.main:app --port 8001` |
| API docs not loading | Visit `http://localhost:8000/docs` (not `/docs`) |

See [Backend README - Troubleshooting](./backend/README.md#troubleshooting) for more solutions.

### Frontend

| Issue | Solution |
|-------|----------|
| Module not found error | Run `npm install` and clear cache: `rm -rf .next node_modules` |
| Port 3000 in use | Use different port: `npm run dev -- -p 3001` |
| API calls failing | Check `NEXT_PUBLIC_API_URL` in `.env.local` |
| TypeScript errors | Run `npx tsc --noEmit` to check |

See [Frontend README - Troubleshooting](./frontend/README.md#troubleshooting) for more solutions.

## Project Structure

```
Todo-Ai/
├── backend/                    # FastAPI backend service
│   ├── src/
│   │   ├── api/               # REST API routers
│   │   ├── models/            # SQLModel database models
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   ├── services/          # Business logic layer
│   │   ├── middleware/        # Authentication middleware
│   │   ├── mcp/               # Model Context Protocol server
│   │   ├── tools/             # AI agent tools
│   │   ├── main.py            # FastAPI app initialization
│   │   └── database.py        # Database setup
│   ├── tests/                 # Test suite
│   ├── requirements.txt        # Python dependencies
│   ├── Dockerfile             # Docker configuration
│   └── README.md              # Backend documentation
│
├── frontend/                   # Next.js 16 frontend
│   ├── src/
│   │   ├── app/               # Next.js pages and layouts
│   │   ├── components/        # React components
│   │   ├── context/           # React Context (global state)
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API service functions
│   │   ├── types/             # TypeScript type definitions
│   │   ├── lib/               # Utility functions
│   │   └── utils/             # Helper functions
│   ├── public/                # Static assets
│   ├── __tests__/             # Test suite
│   ├── package.json           # Node dependencies
│   ├── tsconfig.json          # TypeScript configuration
│   ├── next.config.ts         # Next.js configuration
│   └── README.md              # Frontend documentation
│
├── DOCUMENTATION.md           # Complete documentation index
├── CONTRIBUTING.md            # Contribution guidelines
└── README.md                  # This file
```

## Deployment

### Vercel (Frontend - Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel
```

See [Frontend README - Deployment](./frontend/README.md#building--deployment) for detailed instructions.

### Render or Heroku (Backend)

```bash
# Set environment variables in platform dashboard
# Then push to repository for auto-deployment

git push origin main
```

See [Backend README - Deployment](./backend/README.md#deployment) for detailed instructions.

See [Backend README - Deployment](./backend/README.md#deployment) for detailed instructions.

## Docker

### Backend Deployment

```bash
# Build the Docker image
cd backend
docker build -t todo-ai-backend .

# Run the container with environment variables
docker run -p 8000:8000 \
  -e DATABASE_URL="postgresql://user:password@host:5432/todo_ai" \
  -e SECRET_KEY="your-secret-key" \
  -e OPENROUTER_API_KEY="your-key" \
  todo-ai-backend
```

### Full Stack Docker Compose

Create a `docker-compose.yml` in the project root:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://postgres:password@db:5432/todo_ai
      SECRET_KEY: your-secret-key
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://backend:8000

  db:
    image: postgres:14
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: todo_ai
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Run with: `docker-compose up`

## Quick Links

- 🚀 **[Getting Started](./DOCUMENTATION.md)** - Start here for setup
- 📚 **[Complete Documentation](./DOCUMENTATION.md)** - All docs index
- 🤝 **[Contributing](./CONTRIBUTING.md)** - How to contribute
- 📖 **[Backend Docs](./backend/docs/)** - Backend development
- 🎨 **[Frontend Docs](./frontend/docs/)** - Frontend development
- 🔌 **[API Reference](./backend/docs/API.md)** - API endpoint details
- 🏗️ **[Architecture](./backend/docs/ARCHITECTURE.md)** - System design

## Support & Troubleshooting

Having issues? Check these resources:

1. **[Complete Troubleshooting Guide](./DOCUMENTATION.md#-troubleshooting-guide)** - Organized by issue type
2. **[Backend README - Troubleshooting](./backend/README.md#troubleshooting)** - Backend-specific issues
3. **[Frontend README - Troubleshooting](./frontend/README.md#troubleshooting)** - Frontend-specific issues
4. **[Development Guides](./DOCUMENTATION.md#-finding-specific-information)** - Detailed workflows

## Tech Stack Summary

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4, TypeScript
- **Backend**: FastAPI, SQLModel, PostgreSQL, Python 3.11
- **AI**: OpenAI Agents SDK, Model Context Protocol
- **Auth**: JWT, OAuth 2.0 (Google, GitHub), bcrypt
- **Deployment**: Docker, Vercel, Render

## License & Credits

This project is part of the **3rd Semester Artificial Intelligence Course** at [Your University].

### Technologies Used

- [Next.js](https://nextjs.org/) - React framework
- [FastAPI](https://fastapi.tiangolo.com/) - Python web framework
- [SQLModel](https://sqlmodel.tiangolo.com/) - SQL ORM
- [OpenAI Agents SDK](https://platform.openai.com/docs/agents) - AI agents
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Neon PostgreSQL](https://neon.com/) - Database

---

**Made with ❤️ for AI Learning**
