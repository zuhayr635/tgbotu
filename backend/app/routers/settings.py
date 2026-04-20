from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db, AsyncSessionLocal
from app.models.settings import BotSettings
from app.services import bot_service

router = APIRouter(prefix="/api/settings", tags=["settings"])


async def get_or_create_settings(session: AsyncSession) -> BotSettings:
    result = await session.execute(select(BotSettings).where(BotSettings.id == 1))
    s = result.scalar_one_or_none()
    if not s:
        s = BotSettings(id=1)
        session.add(s)
        await session.commit()
        await session.refresh(s)
    return s


class SettingsUpdate(BaseModel):
    bot_token: str | None = None
    notification_chat_id: str | None = None
    min_delay_seconds: int | None = None
    max_delay_seconds: int | None = None
    max_retries: int | None = None
    storage_warn_mb: int | None = None


class SettingsResponse(BaseModel):
    bot_token_set: bool
    bot_username: str | None
    bot_is_running: bool
    notification_chat_id: str | None
    min_delay_seconds: int
    max_delay_seconds: int
    max_retries: int
    storage_warn_mb: int


@router.get("", response_model=SettingsResponse)
async def get_settings(
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_user),
):
    s = await get_or_create_settings(db)
    return SettingsResponse(
        bot_token_set=bool(s.bot_token),
        bot_username=s.bot_username,
        bot_is_running=bot_service.is_bot_running(),
        notification_chat_id=s.notification_chat_id,
        min_delay_seconds=s.min_delay_seconds or 3,
        max_delay_seconds=s.max_delay_seconds or 8,
        max_retries=s.max_retries or 2,
        storage_warn_mb=s.storage_warn_mb or 100,
    )


@router.put("")
async def update_settings(
    body: SettingsUpdate,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_user),
):
    s = await get_or_create_settings(db)
    if body.bot_token is not None:
        s.bot_token = body.bot_token
    if body.notification_chat_id is not None:
        s.notification_chat_id = body.notification_chat_id
    if body.min_delay_seconds is not None:
        s.min_delay_seconds = body.min_delay_seconds
    if body.max_delay_seconds is not None:
        s.max_delay_seconds = body.max_delay_seconds
    if body.max_retries is not None:
        s.max_retries = body.max_retries
    if body.storage_warn_mb is not None:
        s.storage_warn_mb = body.storage_warn_mb
    await db.commit()
    return {"message": "Ayarlar kaydedildi"}


@router.post("/bot/test")
async def test_bot_token(
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_user),
):
    s = await get_or_create_settings(db)
    if not s.bot_token:
        raise HTTPException(400, "Bot token girilmemiş")
    from aiogram import Bot
    try:
        bot = Bot(token=s.bot_token)
        info = await bot.get_me()
        await bot.session.close()
        s.bot_username = info.username
        await db.commit()
        return {"success": True, "username": info.username, "bot_id": info.id}
    except Exception as e:
        return {"success": False, "message": str(e)}


@router.post("/bot/start")
async def start_bot(
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_user),
):
    s = await get_or_create_settings(db)
    if not s.bot_token:
        raise HTTPException(400, "Bot token girilmemiş")
    result = await bot_service.start_bot(s.bot_token)
    if result["success"]:
        s.bot_is_running = True
        s.bot_username = result.get("username")
        await db.commit()
    return result


@router.post("/bot/stop")
async def stop_bot(
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_user),
):
    result = await bot_service.stop_bot()
    if result["success"]:
        s = await get_or_create_settings(db)
        s.bot_is_running = False
        await db.commit()
    return result
