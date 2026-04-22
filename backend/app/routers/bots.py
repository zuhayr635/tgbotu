from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select as sa_select, delete as sa_delete
from typing import List, Optional
from datetime import datetime
from app.database import AsyncSessionLocal
from app.auth import get_current_user
from app.models.user import User
from app.models.bot_token import BotToken
from app.models.group import Group

router = APIRouter(prefix="/api/bots", tags=["bots"])


# Pydantic modelleri
class BotTokenCreate(BaseModel):
    token: str


class BotTokenResponse(BaseModel):
    id: int
    token: str
    bot_username: Optional[str]
    bot_id: Optional[str]
    is_active: bool
    created_at: datetime
    group_count: int


class BotTokenUpdate(BaseModel):
    is_active: Optional[bool] = None


# Bot token endpoint'leri
@router.post("", response_model=BotTokenResponse)
async def create_bot_token(
    body: BotTokenCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(lambda: AsyncSessionLocal())
):
    """Yeni bot token ekle"""
    # Token formatı kontrolü (basit validation)
    if not body.token or len(body.token) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Geçersiz bot token formatı"
        )
    
    # Benzersizlik kontrolü
    result = await db.execute(
        sa_select(BotToken).where(BotToken.token == body.token)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu bot token zaten kullanımda"
        )
    
    # Plan limiti kontrolü
    from app.models.plan_limits import PlanLimits, PlanType
    result = await db.execute(
        sa_select(PlanLimits).where(PlanLimits.plan_type == PlanType(current_user.plan_type.value))
    )
    plan_limits = result.scalar_one_or_none()
    
    if plan_limits:
        # Mevcut aktif bot sayısını kontrol et
        active_bot_count = await db.scalar(
            sa_select(BotToken.id)
            .where(BotToken.user_id == current_user.id)
            .where(BotToken.is_active == True)
        )
        active_bot_count = active_bot_count or 0
        
        if active_bot_count >= plan_limits.max_bots:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Plan limitine ulaştınız. Maksimum {plan_limits.max_bots} bot ekleyebilirsiniz."
            )
    
    # Bot token oluştur
    bot_token = BotToken(
        user_id=current_user.id,
        token=body.token
    )
    
    db.add(bot_token)
    await db.commit()
    await db.refresh(bot_token)
    
    return BotTokenResponse(
        id=bot_token.id,
        token=bot_token.token,
        bot_username=bot_token.bot_username,
        bot_id=bot_token.bot_id,
        is_active=bot_token.is_active,
        created_at=bot_token.created_at,
        group_count=0
    )


@router.get("", response_model=List[BotTokenResponse])
async def list_bot_tokens(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(lambda: AsyncSessionLocal())
):
    """Kullanıcının bot token'larını listele"""
    result = await db.execute(
        sa_select(BotToken)
        .where(BotToken.user_id == current_user.id)
        .order_by(BotToken.created_at.desc())
    )
    bot_tokens = result.scalars().all()
    
    # Her bot için grup sayısını hesapla
    responses = []
    for bot in bot_tokens:
        group_count = await db.scalar(
            sa_select(Group.id).where(Group.bot_token_id == bot.id)
        )
        group_count = group_count or 0
        
        responses.append(BotTokenResponse(
            id=bot.id,
            token=bot.token,
            bot_username=bot.bot_username,
            bot_id=bot.bot_id,
            is_active=bot.is_active,
            created_at=bot.created_at,
            group_count=group_count
        ))
    
    return responses


@router.get("/{bot_id}", response_model=BotTokenResponse)
async def get_bot_token(
    bot_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(lambda: AsyncSessionLocal())
):
    """Bot token detaylarını getir"""
    result = await db.execute(
        sa_select(BotToken)
        .where(BotToken.id == bot_id)
        .where(BotToken.user_id == current_user.id)
    )
    bot = result.scalar_one_or_none()
    
    if not bot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bot token bulunamadı"
        )
    
    group_count = await db.scalar(
        sa_select(Group.id).where(Group.bot_token_id == bot.id)
    )
    group_count = group_count or 0
    
    return BotTokenResponse(
        id=bot.id,
        token=bot.token,
        bot_username=bot.bot_username,
        bot_id=bot.bot_id,
        is_active=bot.is_active,
        created_at=bot.created_at,
        group_count=group_count
    )


@router.patch("/{bot_id}/toggle", response_model=BotTokenResponse)
async def toggle_bot_token(
    bot_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(lambda: AsyncSessionLocal())
):
    """Bot token'ı aktif/pasif yap"""
    result = await db.execute(
        sa_select(BotToken)
        .where(BotToken.id == bot_id)
        .where(BotToken.user_id == current_user.id)
    )
    bot = result.scalar_one_or_none()
    
    if not bot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bot token bulunamadı"
        )
    
    bot.is_active = not bot.is_active
    await db.commit()
    await db.refresh(bot)
    
    group_count = await db.scalar(
        sa_select(Group.id).where(Group.bot_token_id == bot.id)
    )
    group_count = group_count or 0
    
    return BotTokenResponse(
        id=bot.id,
        token=bot.token,
        bot_username=bot.bot_username,
        bot_id=bot.bot_id,
        is_active=bot.is_active,
        created_at=bot.created_at,
        group_count=group_count
    )


@router.delete("/{bot_id}")
async def delete_bot_token(
    bot_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(lambda: AsyncSessionLocal())
):
    """Bot token sil"""
    result = await db.execute(
        sa_select(BotToken)
        .where(BotToken.id == bot_id)
        .where(BotToken.user_id == current_user.id)
    )
    bot = result.scalar_one_or_none()
    
    if not bot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bot token bulunamadı"
        )
    
    await db.execute(sa_delete(BotToken).where(BotToken.id == bot_id))
    await db.commit()
    
    return {"message": "Bot token başarıyla silindi"}
