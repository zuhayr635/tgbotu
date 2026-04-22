from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.database import Base


class UserApprovalStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class UserPlanType(str, enum.Enum):
    free = "free"
    weekly = "weekly"
    monthly = "monthly"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    
    # Admin ve onay bilgileri
    is_admin = Column(Boolean, default=False)
    approval_status = Column(Enum(UserApprovalStatus), default=UserApprovalStatus.pending)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    
    # Plan bilgileri
    plan_type = Column(Enum(UserPlanType), default=UserPlanType.free)
    
    # Token bilgileri
    tokens = Column(Integer, default=0)  # Mevcut token balance
    tokens_used_period = Column(Integer, default=0)  # Bu dönem içinde kullanılan token
    last_token_reset = Column(DateTime(timezone=True), server_default=func.now())  # Son token sıfırlama
    
    # Meta
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # İlişkiler
    bot_tokens = relationship("BotToken", back_populates="user", lazy="dynamic")
    groups = relationship("Group", back_populates="user", lazy="dynamic")
    broadcasts = relationship("Broadcast", back_populates="user", lazy="dynamic")
    scheduled_tasks = relationship("ScheduledTask", back_populates="user", lazy="dynamic")
    templates = relationship("Template", back_populates="user", lazy="dynamic")
    approved_users = relationship("User", foreign_keys=[approved_by], remote_side=[id])
