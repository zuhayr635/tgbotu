import asyncio
import logging
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.memory import MemoryJobStore
from sqlalchemy import select, update

from app.database import AsyncSessionLocal
from app.models.schedule import ScheduledTask, TaskStatus
from app.models.broadcast import Broadcast, MediaType
from app.services.broadcast_service import run_broadcast

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(jobstores={"default": MemoryJobStore()})


async def _execute_scheduled_task(task_id: int):
    """Zamanı gelmiş görevi çalıştır"""
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(ScheduledTask).where(ScheduledTask.id == task_id))
        task = result.scalar_one_or_none()
        if not task or task.status != TaskStatus.pending:
            return

        task.status = TaskStatus.running
        await session.commit()

        # Broadcast kaydı oluştur
        broadcast = Broadcast(
            message_text=task.message_text,
            media_type=task.media_type,
            media_path=task.media_path,
            media_file_id=task.media_file_id,
            disable_preview=task.disable_preview,
            parse_mode=task.parse_mode,
        )
        session.add(broadcast)
        await session.commit()
        await session.refresh(broadcast)

        task.broadcast_id = broadcast.id
        await session.commit()

    # Broadcast'i başlat
    chat_ids = task.target_chat_ids or []
    await run_broadcast(broadcast.id, chat_ids)

    # Görevi tamamlandı olarak işaretle
    async with AsyncSessionLocal() as session:
        await session.execute(
            update(ScheduledTask)
            .where(ScheduledTask.id == task_id)
            .values(status=TaskStatus.completed)
        )
        await session.commit()

    logger.info(f"Zamanlanmış görev tamamlandı: ID={task_id}")


async def schedule_task(task_id: int, run_at: datetime, chat_ids: list[int]) -> str:
    """APScheduler'a görev ekle"""
    job_id = f"task_{task_id}"
    scheduler.add_job(
        _execute_scheduled_task,
        trigger="date",
        run_date=run_at,
        args=[task_id],
        id=job_id,
        replace_existing=True,
    )
    logger.info(f"Görev zamanlandı: ID={task_id}, run_at={run_at}")
    return job_id


async def cancel_scheduled_task(job_id: str) -> bool:
    try:
        scheduler.remove_job(job_id)
        return True
    except Exception:
        return False


async def restore_pending_tasks():
    """Uygulama yeniden başladığında bekleyen görevleri yükle"""
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(ScheduledTask).where(ScheduledTask.status == TaskStatus.pending)
        )
        tasks = result.scalars().all()

    now = datetime.utcnow()
    for task in tasks:
        if task.run_at > now:
            await schedule_task(task.id, task.run_at, task.target_chat_ids or [])
            logger.info(f"Bekleyen görev yüklendi: ID={task.id}")
        else:
            # Geçmiş tarihli görevler — hemen çalıştır
            asyncio.create_task(_execute_scheduled_task(task.id))


def start_scheduler():
    if not scheduler.running:
        scheduler.start()
        logger.info("Scheduler başlatıldı")
