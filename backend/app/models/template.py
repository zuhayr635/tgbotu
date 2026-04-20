from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Enum
from sqlalchemy.sql import func
import enum
from app.database import Base


class MediaType(str, enum.Enum):
    none = "none"
    photo = "photo"
    video = "video"


class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    category = Column(String(100), nullable=True)
    message_text = Column(Text, nullable=True)
    media_type = Column(String(10), default="none")
    media_path = Column(String(500), nullable=True)
    media_file_id = Column(String(500), nullable=True)
    disable_preview = Column(Boolean, default=False)
    parse_mode = Column(String(10), default="HTML")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
