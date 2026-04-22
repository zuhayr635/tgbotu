from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select as sa_select
from typing import Optional
from datetime import datetime
from app.database import AsyncSessionLocal
from app.auth import get_current_user
from app.models.user import User, UserPlanType
from app.models.plan_limits import PlanLimits, PlanType

router = APIRouter(prefix="/api/users", tags=["users"])


# Pydantic modelleri
class UserProfileResponse(BaseModel):
    id: int
    username: str
    email: str
    is_admin: bool
    approval_status: str
    plan_type: str
    tokens: int
    tokens_used_period: int
    last_token_reset: Optional[datetime]
    created_at: datetime


class UserProfileUpdate(BaseModel):
    email: Optional[EmailStr] = None


class TokenInfoResponse(BaseModel):
    current_balance: int
    tokens_used_period: int
    tokens_per_period: int
    tokens_remaining: int
    last_reset: Optional[datetime]
    next_reset_date: Optional[datetime]


class PlanInfoResponse(BaseModel):
    plan_type: str
    max_bots: int
    max_groups: int
    tokens_per_period: int
    period_length_days: int
    current_bots: int
    current_groups: int


# Profil endpoint'leri
@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(lambda: AsyncSessionLocal())
):
    """Kullanıcı profil bilgilerini getir"""
    return UserProfileResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        is_admin=current_user.is_admin,
        approval_status=current_user.approval_status.value,
        plan_type=current_user.plan_type.value,
        tokens=current_user.tokens,
        tokens_used_period=current_user.tokens_used_period,
        last_token_reset=current_user.last_token_reset,
        created_at=current_user.created_at
    )


@router.put("/profile")
async def update_profile(
    body: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(lambda: AsyncSessionLocal())
):
    """Kullanıcı profil bilgilerini güncelle"""
    if body.email:
        # Email benzersizlik kontrolü
        result = await db.execute(
            sa_select(User).where(User.email == body.email).where(User.id != current_user.id)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bu e-posta adresi zaten kullanımda"
            )
        current_user.email = body.email
    
    await db.commit()
    
    return {"message": "Profil başarıyla güncellendi"}


# Token endpoint'leri
@router.get("/tokens", response_model=TokenInfoResponse)
async def get_token_info(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(lambda: AsyncSessionLocal())
):
    """Token bilgilerini getir"""
    # Plan limitlerini al
    result = await db.execute(
        sa_select(PlanLimits).where(PlanLimits.plan_type == PlanType(current_user.plan_type.value))
    )
    plan_limits = result.scalar_one_or_none()
    
    tokens_per_period = plan_limits.tokens_per_period if plan_limits else 0
    tokens_remaining = max(0, tokens_per_period - current_user.tokens_used_period)
    
    # Sonraki sıfırlama tarihini hesapla
    next_reset_date = None
    if current_user.last_token_reset and plan_limits:
        from datetime import timedelta
        next_reset_date = current_user.last_token_reset + timedelta(days=plan_limits.period_length_days)
    
    return TokenInfoResponse(
        current_balance=current_user.tokens,
        tokens_used_period=current_user.tokens_used_period,
        tokens_per_period=tokens_per_period,
        tokens_remaining=tokens_remaining,
        last_reset=current_user.last_token_reset,
        next_reset_date=next_reset_date
    )


# Plan endpoint'leri
@router.get("/plan", response_model=PlanInfoResponse)
async def get_plan_info(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(lambda: AsyncSessionLocal())
):
    """Plan bilgilerini getir"""
    # Plan limitlerini al
    result = await db.execute(
        sa_select(PlanLimits).where(PlanLimits.plan_type == PlanType(current_user.plan_type.value))
    )
    plan_limits = result.scalar_one_or_none()
    
    if not plan_limits:
        # Varsayılan değerler
        plan_limits = PlanLimits(
            plan_type=PlanType.free,
            max_bots=1,
            max_groups=5,
            tokens_per_period=10,
            period_length_days=1
        )
    
    # Mevcut bot ve grup sayılarını al
    from app.models.bot_token import BotToken
    from app.models.group import Group
    
    bot_count = await db.scalar(
        sa_select(BotToken.id).where(BotToken.user_id == current_user.id).where(BotToken.is_active == True)
    )
    bot_count = bot_count or 0
    
    group_count = await db.scalar(
        sa_select(Group.id).where(Group.user_id == current_user.id)
    )
    group_count = group_count or 0
    
    return PlanInfoResponse(
        plan_type=current_user.plan_type.value,
        max_bots=plan_limits.max_bots,
        max_groups=plan_limits.max_groups,
        tokens_per_period=plan_limits.tokens_per_period,
        period_length_days=plan_limits.period_length_days,
        current_bots=bot_count,
        current_groups=group_count
    )
