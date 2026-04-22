from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select as sa_select
from datetime import datetime, timedelta
from app.models.user import User
from app.models.plan_limits import PlanLimits, PlanType
from app.models.broadcast import Broadcast
from app.models.scheduled_task import ScheduledTask


class QuotaService:
    """Kullanıcı kota ve token yönetimi servisi"""
    
    @staticmethod
    async def check_user_quota(
        user_id: int,
        resource_type: str,
        db: AsyncSession
    ) -> bool:
        """
        Kullanıcının belirli bir kaynak için limitin altında olup olmadığını kontrol et
        resource_type: 'bots' | 'groups'
        """
        from app.models.bot_token import BotToken
        from app.models.group import Group
        
        # Kullanıcıyı getir
        result = await db.execute(
            sa_select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user:
            return False
        
        # Plan limitlerini getir
        result = await db.execute(
            sa_select(PlanLimits).where(PlanLimits.plan_type == PlanType(user.plan_type.value))
        )
        plan_limits = result.scalar_one_or_none()
        if not plan_limits:
            return False
        
        if resource_type == "bots":
            # Aktif bot sayısını kontrol et
            bot_count = await db.scalar(
                sa_select(BotToken.id)
                .where(BotToken.user_id == user_id)
                .where(BotToken.is_active == True)
            )
            bot_count = bot_count or 0
            return bot_count < plan_limits.max_bots
        
        elif resource_type == "groups":
            # Grup sayısını kontrol et
            group_count = await db.scalar(
                sa_select(Group.id).where(Group.user_id == user_id)
            )
            group_count = group_count or 0
            return group_count < plan_limits.max_groups
        
        return False
    
    @staticmethod
    async def check_tokens_available(
        user_id: int,
        tokens_needed: int,
        db: AsyncSession
    ) -> tuple[bool, str]:
        """
        Kullanıcının yeterli token'ı olup olmadığını kontrol et
        Returns: (is_available, message)
        """
        # Kullanıcıyı getir
        result = await db.execute(
            sa_select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user:
            return False, "Kullanıcı bulunamadı"
        
        # Plan limitlerini getir
        result = await db.execute(
            sa_select(PlanLimits).where(PlanLimits.plan_type == PlanType(user.plan_type.value))
        )
        plan_limits = result.scalar_one_or_none()
        
        # Dönem kontrolü - sıfırlama gerekli mi?
        if plan_limits:
            await QuotaService.check_and_reset_period_tokens(user, plan_limits, db)
        
        tokens_remaining = user.tokens - user.tokens_used_period
        
        if tokens_needed > tokens_remaining:
            return False, f"Yetersiz token. Gerekli: {tokens_needed}, Mevcut: {tokens_remaining}"
        
        return True, ""
    
    @staticmethod
    async def deduct_tokens(
        user_id: int,
        tokens_amount: int,
        db: AsyncSession
    ) -> bool:
        """Token'ları kullanıcıdan düş"""
        result = await db.execute(
            sa_select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user:
            return False
        
        user.tokens_used_period += tokens_amount
        await db.commit()
        return True
    
    @staticmethod
    async def add_tokens(
        user_id: int,
        tokens_amount: int,
        db: AsyncSession
    ) -> bool:
        """Token'ları kullanıcıya ekle (satın alma, reward, vs.)"""
        result = await db.execute(
            sa_select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user:
            return False
        
        user.tokens += tokens_amount
        await db.commit()
        return True
    
    @staticmethod
    async def check_and_reset_period_tokens(
        user: User,
        plan_limits: PlanLimits,
        db: AsyncSession
    ) -> None:
        """
        Dönem sonu kontrol et ve gerekirse token'ları sıfırla
        """
        if not user.last_token_reset:
            user.last_token_reset = datetime.utcnow()
            await db.commit()
            return
        
        period_end = user.last_token_reset + timedelta(days=plan_limits.period_length_days)
        
        if datetime.utcnow() >= period_end:
            # Dönem bitti, sıfırla
            user.tokens_used_period = 0
            user.last_token_reset = datetime.utcnow()
            await db.commit()
    
    @staticmethod
    async def get_quota_info(
        user_id: int,
        db: AsyncSession
    ) -> dict:
        """Kullanıcının kota bilgilerini getir"""
        from app.models.bot_token import BotToken
        from app.models.group import Group
        
        result = await db.execute(
            sa_select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user:
            return {}
        
        result = await db.execute(
            sa_select(PlanLimits).where(PlanLimits.plan_type == PlanType(user.plan_type.value))
        )
        plan_limits = result.scalar_one_or_none()
        if not plan_limits:
            return {}
        
        # Sayıları hesapla
        bot_count = await db.scalar(
            sa_select(BotToken.id)
            .where(BotToken.user_id == user_id)
            .where(BotToken.is_active == True)
        )
        bot_count = bot_count or 0
        
        group_count = await db.scalar(
            sa_select(Group.id).where(Group.user_id == user_id)
        )
        group_count = group_count or 0
        
        tokens_remaining = user.tokens - user.tokens_used_period
        next_reset = user.last_token_reset + timedelta(days=plan_limits.period_length_days)
        
        return {
            "plan_type": user.plan_type.value,
            "bots": {
                "current": bot_count,
                "limit": plan_limits.max_bots,
                "remaining": max(0, plan_limits.max_bots - bot_count)
            },
            "groups": {
                "current": group_count,
                "limit": plan_limits.max_groups,
                "remaining": max(0, plan_limits.max_groups - group_count)
            },
            "tokens": {
                "total": user.tokens,
                "used_period": user.tokens_used_period,
                "remaining": max(0, tokens_remaining),
                "period_limit": plan_limits.tokens_per_period,
                "period_days": plan_limits.period_length_days,
                "last_reset": user.last_token_reset,
                "next_reset": next_reset
            }
        }
