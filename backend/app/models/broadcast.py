from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum, BigInteger
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.database import Base


class BroadcastStatus(str, enum.Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"


class MediaType(str, enum.Enum):
    none = "none"
    photo = "photo"
    video = "video"


class Broadcast(Base):
    __tablename__ = "broadcasts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    message_text = Column(Text, nullable=True)
    media_type = Column(Enum(MediaType), default=MediaType.none)
    media_path = Column(String(500), nullable=True)   # Disk'teki dosya yolu
    media_file_id = Column(String(500), nullable=True) # Telegram file_id cache
    disable_preview = Column(Boolean, default=False)   # Link önizleme kapalı mı
    parse_mode = Column(String(10), default="HTML")    # HTML veya Markdown

    status = Column(Enum(BroadcastStatus), default=BroadcastStatus.pending)
    total_groups = Column(Integer, default=0)
    sent_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    skipped_count = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    finished_at = Column(DateTime(timezone=True), nullable=True)

    logs = relationship("BroadcastLog", back_populates="broadcast", lazy="dynamic")


class BroadcastLog(Base):
    __tablename__ = "broadcast_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    broadcast_id = Column(Integer, ForeignKey("broadcasts.id"), nullable=False, index=True)
    chat_id = Column(BigInteger, nullable=False)
    chat_title = Column(String(255), nullable=True)
    status = Column(String(20), nullable=False)   # sent | failed | skipped
    error_message = Column(Text, nullable=True)
    telegram_message_id = Column(BigInteger, nullable=True)
    sent_at = Column(DateTime(timezone=True), server_default=func.now())

    broadcast = relationship("Broadcast", back_populates="logs")
