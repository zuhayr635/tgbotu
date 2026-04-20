import asyncio
import logging
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from app.bot.handlers import create_router

logger = logging.getLogger(__name__)

_bot: Bot | None = None
_dp: Dispatcher | None = None
_polling_task: asyncio.Task | None = None


def get_bot() -> Bot | None:
    return _bot


async def start_bot(token: str) -> dict:
    global _bot, _dp, _polling_task

    if _polling_task and not _polling_task.done():
        return {"success": False, "message": "Bot zaten çalışıyor"}

    try:
        _bot = Bot(token=token, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
        _dp = Dispatcher()
        _dp.include_router(create_router())  # Her seferinde fresh router

        bot_info = await _bot.get_me()

        async def polling():
            try:
                await _dp.start_polling(
                    _bot,
                    allowed_updates=["message", "my_chat_member"],
                    handle_signals=False,
                )
            except Exception as e:
                logger.error(f"Polling hatası: {e}")

        _polling_task = asyncio.create_task(polling())
        logger.info(f"Bot başlatıldı: @{bot_info.username}")
        return {"success": True, "username": bot_info.username, "bot_id": bot_info.id}

    except Exception as e:
        logger.error(f"Bot başlatma hatası: {e}")
        return {"success": False, "message": str(e)}


async def stop_bot() -> dict:
    global _bot, _dp, _polling_task

    if not _polling_task or _polling_task.done():
        return {"success": False, "message": "Bot zaten durmuş"}

    try:
        if _dp:
            await _dp.stop_polling()
        if _bot:
            await _bot.session.close()
        if _polling_task:
            _polling_task.cancel()
            try:
                await _polling_task
            except asyncio.CancelledError:
                pass

        _bot = None
        _dp = None
        _polling_task = None
        logger.info("Bot durduruldu")
        return {"success": True, "message": "Bot durduruldu"}

    except Exception as e:
        logger.error(f"Bot durdurma hatası: {e}")
        return {"success": False, "message": str(e)}


def is_bot_running() -> bool:
    return _polling_task is not None and not _polling_task.done()


async def send_notification(chat_id: str, text: str):
    if _bot and chat_id:
        try:
            await _bot.send_message(chat_id=int(chat_id), text=text)
        except Exception as e:
            logger.warning(f"Bildirim gönderilemedi: {e}")
