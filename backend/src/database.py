from sqlmodel import create_engine, Session
from .models.user import User
from .models.task import Task
from .models.tag import Tag
from .models.task_tag import TaskTagLink
from .models.chat_models import ChatInteraction, ChatMessage, OperationRequest
from .main import engine


def get_session():
    with Session(engine) as session:
        yield session