import os

from dotenv import load_dotenv
from sqlmodel import Session, create_engine

from .models.user import User
from .models.auth_identity import AuthIdentity
from .models.task import Task
from .models.tag import Tag
from .models.task_tag import TaskTagLink
from .models.chat_models import ChatInteraction, ChatMessage, OperationRequest

load_dotenv(override=True)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./todo_ai.db")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

sql_echo_env = os.getenv("SQL_ECHO")
if sql_echo_env is None:
    sql_echo = DATABASE_URL.startswith("sqlite")
else:
    sql_echo = sql_echo_env.strip().lower() in {"1", "true", "yes", "on"}

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, echo=sql_echo, pool_pre_ping=True, connect_args=connect_args)


def get_session():
    with Session(engine) as session:
        yield session
