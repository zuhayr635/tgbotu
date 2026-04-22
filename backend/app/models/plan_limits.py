from sqlalchemy import Column, Integer, String, DateTime, Numeric, Enum
from sqlalchemy.sql import func
import enum
from app.database import Base


class PlanType(str, enum.Enum):
    free = "free"
    weekly = "weekly"
    monthly = "monthly"


class PlanLimits(Base):
    __tablename__ = "plan_limits"

    id = Column(Integer, primary_key=True, autoincrement=True)
    plan_type = Column(Enum(PlanType), unique=True, nullable=False, index=True)
    
    # Limitler
    max_bots = Column(Integer, default=1)
    max_groups = Column(Integer, default=5)
    tokens_per_period = Column(Integer, default=10)
    period_length_days = Column(Integer, default=1)  # 1 = günlük, 7 = haftalık, 30 = aylık
    
    # Fiyat bilgisi (admin referansı için)
    price_usd = Column(Numeric(10, 2), nullable=True)
    price_try = Column(Numeric(10, 2), nullable=True)
    
    # Meta
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
