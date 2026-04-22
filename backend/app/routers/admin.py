from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select as sa_select, update as sa_update, delete as sa_delete, func as sa_func
from typing import List, Optional
from datetime import datetime
from app.database import AsyncSessionLocal
from app.auth import get_current_admin
from app.models.user import User, UserApprovalStatus, UserPlanType
from app.models.plan_limits import PlanLimits, PlanType

router = APIRouter(prefix="/api/admin", tags=["admin"])


# Pydantic modelleri
class UserListResponse(BaseModel):
    id: int
    username: str
    email: str
    is_admin: bool
    approval_status: str
    plan_type: str
    tokens: int
    created_at: datetime
    approved_at: Optional[datetime]


class UserApproveRequest(BaseModel):
    plan_type: Optional[str] = None
    initial_tokens: Optional[int] = None


class PlanLimitsResponse(BaseModel):
    id: int
    plan_type: str
    max_bots: int
    max_groups: int
    tokens_per_period: int
    period_length_days: int
    price_usd: Optional[float]
    price_try: Optional[float]


class PlanLimitsUpdate(BaseModel):
    max_bots: Optional[int] = None
    max_groups: Optional[int] = None
    tokens_per_period: Optional[int] = None
    period_length_days: Optional[int] = None
    price_usd: Optional[float] = None
    price_try: Optional[float] = None


class StatsResponse(BaseModel):
    total_users: int
    pending_users: int
    approved_users: int
    rejected_users: int
    total_bots: int
    total_groups: int
    total_broadcasts: int


# Kullanıcı yönetimi endpoint'leri
@router.get("/users", response_model=List[UserListResponse])
async def list_users(
    status_filter: Optional[str] = None,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(lambda: AsyncSessionLocal())
):
    """Tüm kullanıcıları listele (admin only)"""
    query = sa_select(User)
    
    if status_filter:
        try:
            approval_status = UserApprovalStatus(status_filter)
            query = query.where(User.approval_status == approval_status)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Geçersiz durum filtresi"
            )
    
    query = query.order_by(User.created_at.desc())
    result = await db.execute(query)
    users = result.scalars().all()
    
    return [
        UserListResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            is_admin=user.is_admin,
            approval_status=user.approval_status.value,
            plan_type=user.plan_type.value,
            tokens=user.tokens,
            created_at=user.created_at,
            approved_at=user.approved_at
        )
        for user in users
    ]


@router.get("/users/{user_id}", response_model=UserListResponse)
async def get_user(
    user_id: int,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(lambda: AsyncSessionLocal())
):
    """Kullanıcı detaylarını getir (admin only)"""
    result = await db.execute(
        sa_select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı"
        )
    
    return UserListResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        is_admin=user.is_admin,
        approval_status=user.approval_status.value,
        plan_type=user.plan_type.value,
        tokens=user.tokens,
        created_at=user.created_at,
        approved_at=user.approved_at
    )


@router.patch("/users/{user_id}/approve")
async def approve_user(
    user_id: int,
    body: UserApproveRequest,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(lambda: AsyncSessionLocal())
):
    """Kullanıcıyı onayla (admin only)"""
    result = await db.execute(
        sa_select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı"
        )
    
    if user.approval_status == UserApprovalStatus.approved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kullanıcı zaten onaylı"
        )
    
    # Onayla
    user.approval_status = UserApprovalStatus.approved
    user.approved_by = current_admin.id
    user.approved_at = datetime.utcnow()
    
    # Plan ve token ayarla
    if body.plan_type:
        try:
            user.plan_type = UserPlanType(body.plan_type)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Geçersiz plan tipi"
            )
    
    if body.initial_tokens is not None:
        user.tokens = body.initial_tokens
    
    await db.commit()
    
    return {"message": "Kullanıcı başarıyla onaylandı"}


@router.patch("/users/{user_id}/reject")
async def reject_user(
    user_id: int,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(lambda: AsyncSessionLocal())
):
    """Kullanıcıyı reddet (admin only)"""
    result = await db.execute(
        sa_select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı"
        )
    
    if user.approval_status == UserApprovalStatus.rejected:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kullanıcı zaten reddedildi"
        )
    
    user.approval_status = UserApprovalStatus.rejected
    await db.commit()
    
    return {"message": "Kullanıcı reddedildi"}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(lambda: AsyncSessionLocal())
):
    """Kullanıcıyı sil (admin only)"""
    if user_id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kendinizi silemezsiniz"
        )
    
    result = await db.execute(
        sa_select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı"
        )
    
    await db.execute(sa_delete(User).where(User.id == user_id))
    await db.commit()
    
    return {"message": "Kullanıcı başarıyla silindi"}


# Plan limitleri endpoint'leri
@router.get("/plan-limits", response_model=List[PlanLimitsResponse])
async def get_plan_limits(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(lambda: AsyncSessionLocal())
):
    """Tüm plan limitlerini getir (admin only)"""
    result = await db.execute(
        sa_select(PlanLimits).order_by(PlanLimits.id)
    )
    limits = result.scalars().all()
    
    return [
        PlanLimitsResponse(
            id=limit.id,
            plan_type=limit.plan_type.value,
            max_bots=limit.max_bots,
            max_groups=limit.max_groups,
            tokens_per_period=limit.tokens_per_period,
            period_length_days=limit.period_length_days,
            price_usd=float(limit.price_usd) if limit.price_usd else None,
            price_try=float(limit.price_try) if limit.price_try else None
        )
        for limit in limits
    ]


@router.get("/plan-limits/{plan_type}", response_model=PlanLimitsResponse)
async def get_plan_limit(
    plan_type: str,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(lambda: AsyncSessionLocal())
):
    """Belirli bir planın limitlerini getir (admin only)"""
    try:
        plan_enum = PlanType(plan_type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Geçersiz plan tipi"
        )
    
    result = await db.execute(
        sa_select(PlanLimits).where(PlanLimits.plan_type == plan_enum)
    )
    limit = result.scalar_one_or_none()
    
    if not limit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan limitleri bulunamadı"
        )
    
    return PlanLimitsResponse(
        id=limit.id,
        plan_type=limit.plan_type.value,
        max_bots=limit.max_bots,
        max_groups=limit.max_groups,
        tokens_per_period=limit.tokens_per_period,
        period_length_days=limit.period_length_days,
        price_usd=float(limit.price_usd) if limit.price_usd else None,
        price_try=float(limit.price_try) if limit.price_try else None
    )


@router.patch("/plan-limits/{plan_type}", response_model=PlanLimitsResponse)
async def update_plan_limit(
    plan_type: str,
    body: PlanLimitsUpdate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(lambda: AsyncSessionLocal())
):
    """Plan limitlerini güncelle (admin only)"""
    try:
        plan_enum = PlanType(plan_type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Geçersiz plan tipi"
        )
    
    result = await db.execute(
        sa_select(PlanLimits).where(PlanLimits.plan_type == plan_enum)
    )
    limit = result.scalar_one_or_none()
    
    if not limit:
        # Yeni plan limiti oluştur
        limit = PlanLimits(plan_type=plan_enum)
        db.add(limit)
    
    # Alanları güncelle
    if body.max_bots is not None:
        limit.max_bots = body.max_bots
    if body.max_groups is not None:
        limit.max_groups = body.max_groups
    if body.tokens_per_period is not None:
        limit.tokens_per_period = body.tokens_per_period
    if body.period_length_days is not None:
        limit.period_length_days = body.period_length_days
    if body.price_usd is not None:
        limit.price_usd = body.price_usd
    if body.price_try is not None:
        limit.price_try = body.price_try
    
    await db.commit()
    await db.refresh(limit)
    
    return PlanLimitsResponse(
        id=limit.id,
        plan_type=limit.plan_type.value,
        max_bots=limit.max_bots,
        max_groups=limit.max_groups,
        tokens_per_period=limit.tokens_per_period,
        period_length_days=limit.period_length_days,
        price_usd=float(limit.price_usd) if limit.price_usd else None,
        price_try=float(limit.price_try) if limit.price_try else None
    )


# İstatistikler endpoint'i
@router.get("/stats", response_model=StatsResponse)
async def get_stats(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(lambda: AsyncSessionLocal())
):
    """Sistem istatistiklerini getir (admin only)"""
    from app.models.bot_token import BotToken
    from app.models.group import Group
    from app.models.broadcast import Broadcast
    
    # Kullanıcı istatistikleri
    total_users = await db.scalar(sa_select(sa_func.count(User.id)))
    pending_users = await db.scalar(
        sa_select(sa_func.count(User.id)).where(User.approval_status == UserApprovalStatus.pending)
    )
    approved_users = await db.scalar(
        sa_select(sa_func.count(User.id)).where(User.approval_status == UserApprovalStatus.approved)
    )
    rejected_users = await db.scalar(
        sa_select(sa_func.count(User.id)).where(User.approval_status == UserApprovalStatus.rejected)
    )
    
    # Kaynak istatistikleri
    total_bots = await db.scalar(sa_select(sa_func.count(BotToken.id)))
    total_groups = await db.scalar(sa_select(sa_func.count(Group.id)))
    total_broadcasts = await db.scalar(sa_select(sa_func.count(Broadcast.id)))
    
    return StatsResponse(
        total_users=total_users,
        pending_users=pending_users,
        approved_users=approved_users,
        rejected_users=rejected_users,
        total_bots=total_bots,
        total_groups=total_groups,
        total_broadcasts=total_broadcasts
    )
