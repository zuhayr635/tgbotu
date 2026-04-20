from sqlalchemy import Column, Integer, Text, String, DateTime, Boolean, JSON, Enum
from sqlalchemy.sql import func
import enum
from app.database import Base


class TaskStatus(str, enum.Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    cancelled = "cancelled"
    failed = "failed"


class RepeatType(str, enum.Enum):
    none = "none"
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"


class ScheduledTask(Base):
    __tablename__ = "scheduled_tasks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    message_text = Column(Text, nullable=True)
    media_type = Column(String(10), default="none")
    media_path = Column(String(500), nullable=True)
    media_file_id = Column(String(500), nullable=True)
    disable_preview = Column(Boolean, default=False)
    parse_mode = Column(String(10), default="HTML")

    target_chat_ids = Column(JSON, nullable=False, default=list)

    run_at = Column(DateTime(timezone=True), nullable=False)
    status = Column(Enum(TaskStatus), default=TaskStatus.pending)
    apscheduler_job_id = Column(String(100), nullable=True)

    # Tekrarlayan görev
    repeat_type = Column(Enum(RepeatType), default=RepeatType.none)
    repeat_end_at = Column(DateTime(timezone=True), nullable=True)  # Tekrar bitiş tarihi

    broadcast_id = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
