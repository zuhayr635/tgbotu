import json
import os
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models.broadcast import MediaType
from app.models.schedule import ScheduledTask, TaskStatus
from app.services.scheduler_service import schedule_task, cancel_scheduled_task
from app.config import get_settings

router = APIRouter(prefix="/api/schedules", tags=["schedules"])
settings = get_settings()


class ScheduleResponse(BaseModel):
    id: int
    message_text: Optional[str]
    media_type: str
    target_chat_ids: list
    run_at: datetime
    status: str
    repeat_type: str
    repeat_end_at: Optional[datetime]
    broadcast_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("")
async def create_schedule(
    message_text: str = Form(default=""),
    chat_ids: str = Form(...),
    run_at: str = Form(...),
    repeat_type: str = Form(default="none"),   # none | daily | weekly | monthly
    repeat_end_at: str = Form(default=""),     # ISO format, bos olabilir
    disable_preview: bool = Form(default=False),
    parse_mode: str = Form(default="HTML"),
    media: Optional[UploadFile] = File(default=None),
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_user),
):
    try:
        target_ids = json.loads(chat_ids)
    except Exception:
        raise HTTPException(400, "chat_ids geçersiz format")

    try:
        run_datetime = datetime.fromisoformat(run_at)
    except Exception:
        raise HTTPException(400, "run_at geçersiz tarih formatı")

    if run_datetime <= datetime.utcnow():
        raise HTTPException(400, "Geçmiş bir tarih seçilemez")

    # Medya kaydet
    media_path = None
    media_type = "none"

    if media and media.filename:
        ext = os.path.splitext(media.filename)[1].lower()
        if ext in (".jpg", ".jpeg", ".png", ".webp"):
            media_type = "photo"
        elif ext in (".mp4", ".mov", ".avi", ".mkv"):
            media_type = "video"
        else:
            raise HTTPException(400, "Desteklenmeyen medya formatı")
        os.makedirs(settings.upload_dir, exist_ok=True)
        filename = f"{uuid.uuid4()}{ext}"
        media_path = os.path.join(settings.upload_dir, filename)
        content = await media.read()
        with open(media_path, "wb") as f:
            f.write(content)

    repeat_end_datetime = None
    if repeat_end_at:
        try:
            repeat_end_datetime = datetime.fromisoformat(repeat_end_at)
        except Exception:
            pass

    task = ScheduledTask(
        message_text=message_text or None,
        media_type=media_type,
        media_path=media_path,
        disable_preview=disable_preview,
        parse_mode=parse_mode,
        target_chat_ids=target_ids,
        run_at=run_datetime,
        repeat_type=repeat_type,
        repeat_end_at=repeat_end_datetime,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)

    job_id = await schedule_task(task.id, run_datetime, target_ids)
    task.apscheduler_job_id = job_id
    await db.commit()

    return {"task_id": task.id, "message": "Görev zamanlandı"}


@router.get("", response_model=list[ScheduleResponse])
async def list_schedules(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_user),
):
    query = select(ScheduledTask).order_by(ScheduledTask.run_at)
    if status:
        query = query.where(ScheduledTask.status == status)
    result = await db.execute(query)
    return result.scalars().all()


@router.delete("/{task_id}")
async def cancel_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_user),
):
    result = await db.execute(select(ScheduledTask).where(ScheduledTask.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(404, "Görev bulunamadı")
    if task.status != TaskStatus.pending:
        raise HTTPException(400, "Sadece bekleyen görevler iptal edilebilir")

    if task.apscheduler_job_id:
        await cancel_scheduled_task(task.apscheduler_job_id)

    task.status = TaskStatus.cancelled
    await db.commit()
    return {"message": "Görev iptal edildi"}
