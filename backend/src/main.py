from contextlib import asynccontextmanager
import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlmodel import SQLModel

from .database import DATABASE_URL, engine

# Load environment variables
load_dotenv(override=True)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)
MEDIA_DIR = Path(__file__).resolve().parent / "media"
MEDIA_DIR.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create PostgreSQL enum types if using PostgreSQL
    if DATABASE_URL and "postgres" in DATABASE_URL:
        from sqlalchemy import text

        with engine.connect() as conn:
            # Create priorityenum if not exists
            conn.execute(text("""
                DO $$ BEGIN
                    CREATE TYPE priorityenum AS ENUM ('HIGH', 'MEDIUM', 'LOW');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            """))
            # Create recurrenceruleenum if not exists
            conn.execute(text("""
                DO $$ BEGIN
                    CREATE TYPE recurrenceruleenum AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            """))
            conn.commit()

    # Create database tables on startup
    SQLModel.metadata.create_all(bind=engine)

    with engine.connect() as conn:
        from sqlalchemy import text

        conn.execute(text('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR'))
        conn.commit()

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
    description="API for the TODO application with JWT-based authentication",
    version="1.0.0",
    lifespan=lifespan,
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
    "https://todo-ai-iota.vercel.app",
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

if MEDIA_DIR.exists():
    app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")


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
from .api.auth_router import router as auth_router
from .api.chat_router import router as chat_router
from .api.chat_streaming_router import router as chat_streaming_router
from .api.tag_router import router as tag_router
from .api.task_router import router as task_router

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
                "url_type": "postgresql" if DATABASE_URL and "postgres" in DATABASE_URL else "sqlite",
            },
            "chat": {
                "status": "operational",
                "features": [
                    "intent_classification",
                    "task_crud_operations",
                    "conversation_context",
                    "message_storage",
                    "streaming_responses",
                ],
                "ai_provider": "openai_agents" if app.state.agent_service and app.state.agent_service.is_available() else "rule_based",
            },
            "authentication": {
                "status": "enabled",
                "provider": "JWT",
            },
        },
        "system": {
            "python_version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
        },
    }

    return health_status


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
