import asyncio
import os
import uuid
from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user, oauth2_scheme
from app.database import get_db, AsyncSessionLocal
from app.models.broadcast import Broadcast, BroadcastLog, BroadcastStatus, MediaType
from app.models.group import Group
from app.services import broadcast_service
from app.config import get_settings
from jose import jwt, JWTError

router = APIRouter(prefix="/api/broadcasts", tags=["broadcasts"])
settings = get_settings()


class BroadcastResponse(BaseModel):
    id: int
    message_text: Optional[str]
    media_type: str
    status: str
    total_groups: int
    sent_count: int
    failed_count: int
    skipped_count: int
    created_at: datetime
    finished_at: Optional[datetime]

    class Config:
        from_attributes = True


class BroadcastLogResponse(BaseModel):
    id: int
    chat_id: int
    chat_title: Optional[str]
    status: str
    error_message: Optional[str]
    sent_at: datetime

    class Config:
        from_attributes = True


@router.post("")
async def create_broadcast(
    message_text: str = Form(default=""),
    chat_ids: str = Form(...),              # JSON string: "[123, 456]"
    disable_preview: bool = Form(default=False),
    parse_mode: str = Form(default="HTML"),
    media: Optional[UploadFile] = File(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    import json

    try:
        target_ids = json.loads(chat_ids)
    except Exception:
        raise HTTPException(400, "chat_ids geçersiz format")

    if not target_ids:
        raise HTTPException(400, "En az bir grup seçmelisiniz")

    # Medya kaydet
    media_path = None
    media_type = MediaType.none

    if media and media.filename:
        ext = os.path.splitext(media.filename)[1].lower()
        if ext in (".jpg", ".jpeg", ".png", ".webp", ".gif"):
            media_type = MediaType.photo
        elif ext in (".mp4", ".mov", ".avi", ".mkv", ".webm"):
            media_type = MediaType.video
        else:
            raise HTTPException(400, "Desteklenmeyen medya formatı")

        os.makedirs(settings.upload_dir, exist_ok=True)
        filename = f"{uuid.uuid4()}{ext}"
        media_path = os.path.join(settings.upload_dir, filename)
        content = await media.read()
        with open(media_path, "wb") as f:
            f.write(content)

    # Get user_id from token
    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(User.username == current_user)
        )
        user = result.scalar_one_or_none()
        user_id = user.id if user else None

    broadcast = Broadcast(
        message_text=message_text or None,
        media_type=media_type,
        media_path=media_path,
        disable_preview=disable_preview,
        parse_mode=parse_mode,
        user_id=user_id,
    )
    db.add(broadcast)
    await db.commit()
    await db.refresh(broadcast)

    # Arka planda başlat
    asyncio.create_task(broadcast_service.run_broadcast(broadcast.id, target_ids))

    return {"broadcast_id": broadcast.id, "message": "Yayın başlatıldı"}


@router.get("", response_model=list[BroadcastResponse])
async def list_broadcasts(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    from app.models.user import User
    result_user = await db.execute(
        select(User).where(User.username == current_user)
    )
    user = result_user.scalar_one_or_none()
    user_id = user.id if user else None

    result = await db.execute(
        select(Broadcast).where(Broadcast.user_id == user_id).order_by(desc(Broadcast.created_at)).offset(skip).limit(limit)
    )
    return result.scalars().all()


@router.get("/{broadcast_id}")
async def get_broadcast(
    broadcast_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    from app.models.user import User
    result_user = await db.execute(
        select(User).where(User.username == current_user)
    )
    user = result_user.scalar_one_or_none()
    user_id = user.id if user else None

    result = await db.execute(select(Broadcast).where(Broadcast.id == broadcast_id).where(Broadcast.user_id == user_id))
    b = result.scalar_one_or_none()
    if not b:
        raise HTTPException(404, "Yayın bulunamadı")
    return b


@router.get("/{broadcast_id}/logs", response_model=list[BroadcastLogResponse])
async def get_broadcast_logs(
    broadcast_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    from app.models.user import User
    result_user = await db.execute(
        select(User).where(User.username == current_user)
    )
    user = result_user.scalar_one_or_none()
    user_id = user.id if user else None

    # Verify broadcast belongs to user
    result_bc = await db.execute(
        select(Broadcast).where(Broadcast.id == broadcast_id).where(Broadcast.user_id == user_id)
    )
    if not result_bc.scalar_one_or_none():
        raise HTTPException(404, "Yayın bulunamadı")

    result = await db.execute(
        select(BroadcastLog)
        .where(BroadcastLog.broadcast_id == broadcast_id)
        .order_by(BroadcastLog.sent_at)
    )
    return result.scalars().all()


@router.post("/{broadcast_id}/retry-failed")
async def retry_failed(
    broadcast_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    from app.models.user import User
    result_user = await db.execute(
        select(User).where(User.username == current_user)
    )
    user = result_user.scalar_one_or_none()
    user_id = user.id if user else None

    result = await db.execute(
        select(BroadcastLog)
        .where(BroadcastLog.broadcast_id == broadcast_id)
        .where(BroadcastLog.status == "failed")
    )
    failed_logs = result.scalars().all()
    if not failed_logs:
        raise HTTPException(400, "Başarısız grup yok")

    original = await db.execute(select(Broadcast).where(Broadcast.id == broadcast_id).where(Broadcast.user_id == user_id))
    orig = original.scalar_one_or_none()
    if not orig:
        raise HTTPException(404, "Yayın bulunamadı")

    # Yeni broadcast oluştur
    new_bc = Broadcast(
        message_text=orig.message_text,
        media_type=orig.media_type,
        media_path=orig.media_path,
        media_file_id=orig.media_file_id,
        disable_preview=orig.disable_preview,
        parse_mode=orig.parse_mode,
        user_id=user_id,
    )
    db.add(new_bc)
    await db.commit()
    await db.refresh(new_bc)

    chat_ids = [log.chat_id for log in failed_logs]
    asyncio.create_task(broadcast_service.run_broadcast(new_bc.id, chat_ids))

    return {"broadcast_id": new_bc.id, "message": f"{len(chat_ids)} gruba tekrar gönderiliyor"}


@router.post("/{broadcast_id}/skip/{chat_id}")
async def skip_group(
    broadcast_id: int,
    chat_id: int,
    _: str = Depends(get_current_user),
):
    broadcast_service.skip_group(broadcast_id, chat_id)
    return {"message": "Grup atlandı"}


@router.post("/{broadcast_id}/cancel")
async def cancel_broadcast(
    broadcast_id: int,
    _: str = Depends(get_current_user),
):
    broadcast_service.cancel_broadcast(broadcast_id)
    return {"message": "İptal sinyali gönderildi"}


@router.get("/{broadcast_id}/progress")
async def get_progress(
    broadcast_id: int,
    _: str = Depends(get_current_user),
):
    progress = broadcast_service.get_broadcast_progress(broadcast_id)
    if not progress:
        raise HTTPException(404, "Aktif yayın bulunamadı")
    return progress


# WebSocket — canlı progress
@router.websocket("/{broadcast_id}/ws")
async def broadcast_ws(broadcast_id: int, websocket: WebSocket):
    # Token doğrulama
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008)
        return
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        if not payload.get("sub"):
            await websocket.close(code=1008)
            return
    except JWTError:
        await websocket.close(code=1008)
        return

    await websocket.accept()
    try:
        while True:
            progress = broadcast_service.get_broadcast_progress(broadcast_id)
            if progress:
                await websocket.send_json(progress)
                if progress.get("status") in ("completed", "cancelled", "failed"):
                    break
            else:
                # _active_broadcasts'ta yok — DB'den oku
                async with AsyncSessionLocal() as session:
                    result = await session.execute(
                        select(Broadcast).where(Broadcast.id == broadcast_id)
                    )
                    b = result.scalar_one_or_none()
                    if b:
                        await websocket.send_json({
                            "broadcast_id": broadcast_id,
                            "status": b.status,
                            "total": b.total_groups,
                            "sent": b.sent_count,
                            "failed": b.failed_count,
                            "skipped": b.skipped_count,
                            "current_title": None,
                        })
                        # Tamamlandı/iptal/hata → kapat; pending/running → bekle
                        if b.status not in ("pending", "running"):
                            break
                    else:
                        break
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        pass
