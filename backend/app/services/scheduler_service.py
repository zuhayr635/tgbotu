import asyncio
import logging
from datetime import datetime, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.memory import MemoryJobStore
from sqlalchemy import select, update

from app.database import AsyncSessionLocal
from app.models.schedule import ScheduledTask, TaskStatus, RepeatType
from app.models.broadcast import Broadcast
from app.services.broadcast_service import run_broadcast

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(jobstores={"default": MemoryJobStore()})


def _next_run_date(current: datetime, repeat_type: str) -> datetime | None:
    if repeat_type == RepeatType.daily:
        return current + timedelta(days=1)
    elif repeat_type == RepeatType.weekly:
        return current + timedelta(weeks=1)
    elif repeat_type == RepeatType.monthly:
        # Aynı gün, bir sonraki ay
        month = current.month + 1 if current.month < 12 else 1
        year = current.year + 1 if current.month == 12 else current.year
        try:
            return current.replace(year=year, month=month)
        except ValueError:
            # Ay sonunda gün yoksa (örn. 31 Şubat) ayın son gününe al
            import calendar
            last_day = calendar.monthrange(year, month)[1]
            return current.replace(year=year, month=month, day=last_day)
    return None


async def _execute_scheduled_task(task_id: int):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(ScheduledTask).where(ScheduledTask.id == task_id))
        task = result.scalar_one_or_none()
        if not task or task.status not in (TaskStatus.pending,):
            return

        task.status = TaskStatus.running
        await session.commit()

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

    chat_ids = task.target_chat_ids or []
    await run_broadcast(broadcast.id, chat_ids)

    # Tamamlandı
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(ScheduledTask).where(ScheduledTask.id == task_id))
        task = result.scalar_one_or_none()
        if not task:
            return

        # Tekrarlayan görev — bir sonrakini oluştur
        if task.repeat_type and task.repeat_type != RepeatType.none:
            next_run = _next_run_date(task.run_at, task.repeat_type)
            end_at = task.repeat_end_at

            if next_run and (end_at is None or next_run <= end_at):
                new_task = ScheduledTask(
                    message_text=task.message_text,
                    media_type=task.media_type,
                    media_path=task.media_path,
                    media_file_id=task.media_file_id,
                    disable_preview=task.disable_preview,
                    parse_mode=task.parse_mode,
                    target_chat_ids=task.target_chat_ids,
                    run_at=next_run,
                    repeat_type=task.repeat_type,
                    repeat_end_at=task.repeat_end_at,
                )
                session.add(new_task)
                await session.flush()
                job_id = await schedule_task(new_task.id, next_run, task.target_chat_ids or [])
                new_task.apscheduler_job_id = job_id

        task.status = TaskStatus.completed
        await session.commit()

    logger.info(f"Zamanlanmış görev tamamlandı: ID={task_id}")


async def schedule_task(task_id: int, run_at: datetime, chat_ids: list[int]) -> str:
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
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(ScheduledTask).where(ScheduledTask.status == TaskStatus.pending)
        )
        tasks = result.scalars().all()

    now = datetime.utcnow()
    for task in tasks:
        if task.run_at > now:
            await schedule_task(task.id, task.run_at, task.target_chat_ids or [])
        else:
            asyncio.create_task(_execute_scheduled_task(task.id))


def start_scheduler():
    if not scheduler.running:
        scheduler.start()
        logger.info("Scheduler başlatıldı")
