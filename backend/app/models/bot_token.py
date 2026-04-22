from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class BotToken(Base):
    __tablename__ = "bot_tokens"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    token = Column(String(500), unique=True, nullable=False)
    bot_username = Column(String(100), nullable=True)
    bot_id = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Meta
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # İlişkiler
    user = relationship("User", back_populates="bot_tokens")
    groups = relationship("Group", back_populates="bot_token")
