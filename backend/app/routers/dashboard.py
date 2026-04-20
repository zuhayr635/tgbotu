import os
import shutil
from fastapi import APIRouter, Depends
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models.broadcast import Broadcast, BroadcastStatus
from app.models.group import Group
from app.models.schedule import ScheduledTask, TaskStatus
from app.models.settings import BotSettings
from app.services import bot_service
from app.config import get_settings

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])
settings = get_settings()


@router.get("")
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_user),
):
    # Toplam aktif grup/kanal
    total_groups = await db.scalar(
        select(func.count(Group.id)).where(Group.is_active == True).where(Group.is_blacklisted == False)
    )

    # Bugün gönderilen yayın sayısı
    from datetime import date, datetime
    today_start = datetime.combine(date.today(), datetime.min.time())
    today_broadcasts = await db.scalar(
        select(func.count(Broadcast.id))
        .where(Broadcast.created_at >= today_start)
        .where(Broadcast.status == BroadcastStatus.completed)
    )

    # Bekleyen görevler
    pending_tasks = await db.scalar(
        select(func.count(ScheduledTask.id)).where(ScheduledTask.status == TaskStatus.pending)
    )

    # Son 5 yayın
    result = await db.execute(
        select(Broadcast).order_by(desc(Broadcast.created_at)).limit(5)
    )
    recent = result.scalars().all()

    # Yaklaşan 3 görev
    result2 = await db.execute(
        select(ScheduledTask)
        .where(ScheduledTask.status == TaskStatus.pending)
        .order_by(ScheduledTask.run_at)
        .limit(3)
    )
    upcoming = result2.scalars().all()

    # Depolama boyutu kontrolü
    storage_mb = 0
    if os.path.exists(settings.upload_dir):
        total_bytes = sum(
            os.path.getsize(os.path.join(settings.upload_dir, f))
            for f in os.listdir(settings.upload_dir)
            if os.path.isfile(os.path.join(settings.upload_dir, f))
        )
        storage_mb = round(total_bytes / (1024 * 1024), 2)

    # Uyarı eşiği
    s_result = await db.execute(select(BotSettings).where(BotSettings.id == 1))
    bot_settings = s_result.scalar_one_or_none()
    warn_mb = bot_settings.storage_warn_mb if bot_settings else 100
    storage_warning = storage_mb >= warn_mb

    return {
        "total_groups": total_groups or 0,
        "today_broadcasts": today_broadcasts or 0,
        "pending_tasks": pending_tasks or 0,
        "bot_running": bot_service.is_bot_running(),
        "storage_mb": storage_mb,
        "storage_warning": storage_warning,
        "recent_broadcasts": [
            {
                "id": b.id,
                "message_preview": (b.message_text or "")[:80],
                "status": b.status,
                "total_groups": b.total_groups,
                "sent_count": b.sent_count,
                "created_at": b.created_at,
            }
            for b in recent
        ],
        "upcoming_tasks": [
            {
                "id": t.id,
                "message_preview": (t.message_text or "")[:80],
                "target_count": len(t.target_chat_ids or []),
                "run_at": t.run_at,
            }
            for t in upcoming
        ],
    }


@router.delete("/storage/cleanup")
async def cleanup_storage(
    _: str = Depends(get_current_user),
):
    """Upload klasörünü temizle"""
    if os.path.exists(settings.upload_dir):
        for f in os.listdir(settings.upload_dir):
            fp = os.path.join(settings.upload_dir, f)
            if os.path.isfile(fp):
                os.remove(fp)
    return {"message": "Depolama temizlendi"}
