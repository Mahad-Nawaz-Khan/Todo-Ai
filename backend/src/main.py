from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv
from sqlmodel import SQLModel, create_engine
from contextlib import asynccontextmanager
import logging
import os

# Load environment variables
load_dotenv(override=True)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./todo_ai.db")

# Normalize Postgres URLs to a driver we actually ship (psycopg v3)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

# Create database engine
sql_echo_env = os.getenv("SQL_ECHO")
if sql_echo_env is None:
    sql_echo = DATABASE_URL.startswith("sqlite")
else:
    sql_echo = sql_echo_env.strip().lower() in {"1", "true", "yes", "on"}

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, echo=sql_echo, pool_pre_ping=True, connect_args=connect_args)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables on startup
    SQLModel.metadata.create_all(bind=engine)

    # Initialize the OpenAI Agents SDK service
    try:
        from .services.agent_service import agent_service
        agent_service.initialize()

        if agent_service.is_available():
            app.state.agent_service = agent_service
            print("✓ OpenAI Agents SDK initialized successfully")
        else:
            print("⚠ OpenAI Agents SDK not available - falling back to rule-based processing")
            print("  To enable: Set GEMINI_API_KEY environment variable")
            app.state.agent_service = None
    except Exception as e:
        print(f"⚠ Warning: Could not initialize OpenAI Agents SDK: {e}")
        print("  Falling back to rule-based processing")
        app.state.agent_service = None

    yield
    # Clean up on shutdown if needed

app = FastAPI(
    title="TODO API",
    description="API for the TODO application with Clerk authentication",
    version="1.0.0",
    lifespan=lifespan
)

@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(status_code=400, content={"detail": str(exc)})

# Add rate limiter to app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Get allowed origins from environment or use defaults
frontend_url = os.getenv("FRONTEND_URL", "")
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "https://hackathon-2-phase-3-giaic.vercel.app",
]

# Add custom frontend URL if provided
if frontend_url and frontend_url not in allowed_origins:
    allowed_origins.append(frontend_url)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middleware to add cache headers
@app.middleware("http")
async def add_cache_headers(request, call_next):
    response = await call_next(request)

    # Add cache headers for API responses
    if request.url.path.startswith("/api/"):
        # Don't cache user-specific data
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    else:
        # For other routes, set appropriate cache headers
        response.headers.setdefault("Cache-Control", "public, max-age=3600")

    return response

# Include API routes
from .api.task_router import router as task_router
from .api.auth_router import router as auth_router
from .api.tag_router import router as tag_router
from .api.chat_router import router as chat_router
from .api.chat_streaming_router import router as chat_streaming_router

app.include_router(task_router)
app.include_router(auth_router)
app.include_router(tag_router)
app.include_router(chat_router)
app.include_router(chat_streaming_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the TODO API"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "TODO API", "version": "1.0.0"}


@app.get("/health/detailed")
def detailed_health_check():
    """
    Detailed health check with component status
    """
    import sys
    from datetime import datetime

    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "TODO API",
        "version": "1.0.0",
        "components": {
            "database": {
                "status": "connected" if engine else "disconnected",
                "url_type": "postgresql" if DATABASE_URL and "postgres" in DATABASE_URL else "sqlite"
            },
            "chat": {
                "status": "operational",
                "features": [
                    "intent_classification",
                    "task_crud_operations",
                    "conversation_context",
                    "message_storage",
                    "streaming_responses"
                ],
                "ai_provider": "openai_agents" if app.state.agent_service and app.state.agent_service.is_available() else "rule_based"
            },
            "authentication": {
                "status": "enabled",
                "provider": "Clerk"
            }
        },
        "system": {
            "python_version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
        }
    }

    return health_status

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)