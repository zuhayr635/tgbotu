import asyncio
import random
import logging
from datetime import datetime

from aiogram import Bot
from aiogram.types import LinkPreviewOptions
from aiogram.exceptions import TelegramRetryAfter, TelegramForbiddenError, TelegramBadRequest
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models.broadcast import Broadcast, BroadcastLog, BroadcastStatus, MediaType
from app.models.group import Group
from app.models.settings import BotSettings
from app.services.bot_service import get_bot, send_notification
from app.services.message_utils import prepare_message

logger = logging.getLogger(__name__)

_active_broadcasts: dict[int, dict] = {}
_skip_signals: dict[int, set] = {}
_cancel_signals: set[int] = set()

# Gönderim kuyruğu — aynı anda tek broadcast çalışır
_broadcast_queue: asyncio.Queue = asyncio.Queue()
_queue_running: bool = False


async def start_queue_worker():
    """Uygulama başlangıcında tek sefer başlatılır"""
    global _queue_running
    _queue_running = True
    while True:
        broadcast_id, chat_ids = await _broadcast_queue.get()
        try:
            await _run_broadcast_internal(broadcast_id, chat_ids)
        except Exception as e:
            logger.error(f"Kuyruk hatası broadcast {broadcast_id}: {e}", exc_info=True)
            # Broadcast stuck kalmadan "failed" durumuna al
            if broadcast_id in _active_broadcasts:
                _active_broadcasts[broadcast_id]["status"] = "failed"
            try:
                async with AsyncSessionLocal() as session:
                    await session.execute(
                        update(Broadcast)
                        .where(Broadcast.id == broadcast_id)
                        .values(status=BroadcastStatus.failed, finished_at=datetime.utcnow())
                    )
                    await session.commit()
            except Exception:
                pass
        finally:
            _broadcast_queue.task_done()


async def run_broadcast(broadcast_id: int, chat_ids: list[int]):
    """Broadcast'i kuyruğa ekle"""
    await _broadcast_queue.put((broadcast_id, chat_ids))


def get_broadcast_progress(broadcast_id: int) -> dict | None:
    return _active_broadcasts.get(broadcast_id)


def skip_group(broadcast_id: int, chat_id: int):
    if broadcast_id not in _skip_signals:
        _skip_signals[broadcast_id] = set()
    _skip_signals[broadcast_id].add(chat_id)


def cancel_broadcast(broadcast_id: int):
    _cancel_signals.add(broadcast_id)


async def _get_settings() -> BotSettings | None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(BotSettings).where(BotSettings.id == 1))
        return result.scalar_one_or_none()


async def _send_message(bot: Bot, chat_id: int, broadcast: Broadcast, settings: BotSettings) -> tuple[bool, str | None, int | None]:
    """Tek bir gruba mesaj gönder. (success, error_msg, telegram_msg_id) döner"""
    parse_mode = broadcast.parse_mode or "HTML"
    disable_preview = broadcast.disable_preview
    link_preview_opts = LinkPreviewOptions(is_disabled=True) if disable_preview else None

    for attempt in range(settings.max_retries + 1):
        try:
            msg = None

            if broadcast.media_type == MediaType.none or not broadcast.media_path:
                # Sadece metin
                msg = await bot.send_message(
                    chat_id=chat_id,
                    text=broadcast.message_text or "",
                    parse_mode=parse_mode,
                    link_preview_options=link_preview_opts,
                )

            elif broadcast.media_type == MediaType.photo:
                # Önce file_id dene
                file_id = broadcast.media_file_id
                if file_id:
                    msg = await bot.send_photo(
                        chat_id=chat_id,
                        photo=file_id,
                        caption=broadcast.message_text,
                        parse_mode=parse_mode,
                    )
                else:
                    # Dosyadan yükle ve file_id'yi kaydet
                    with open(broadcast.media_path, "rb") as f:
                        msg = await bot.send_photo(
                            chat_id=chat_id,
                            photo=f,
                            caption=broadcast.message_text,
                            parse_mode=parse_mode,
                        )
                    # file_id cache'e al
                    if msg and msg.photo:
                        async with AsyncSessionLocal() as session:
                            await session.execute(
                                update(Broadcast)
                                .where(Broadcast.id == broadcast.id)
                                .values(media_file_id=msg.photo[-1].file_id)
                            )
                            await session.commit()
                        broadcast.media_file_id = msg.photo[-1].file_id

            elif broadcast.media_type == MediaType.video:
                file_id = broadcast.media_file_id
                if file_id:
                    msg = await bot.send_video(
                        chat_id=chat_id,
                        video=file_id,
                        caption=broadcast.message_text,
                        parse_mode=parse_mode,
                    )
                else:
                    with open(broadcast.media_path, "rb") as f:
                        msg = await bot.send_video(
                            chat_id=chat_id,
                            video=f,
                            caption=broadcast.message_text,
                            parse_mode=parse_mode,
                        )
                    if msg and msg.video:
                        async with AsyncSessionLocal() as session:
                            await session.execute(
                                update(Broadcast)
                                .where(Broadcast.id == broadcast.id)
                                .values(media_file_id=msg.video.file_id)
                            )
                            await session.commit()
                        broadcast.media_file_id = msg.video.file_id

            return True, None, msg.message_id if msg else None

        except TelegramRetryAfter as e:
            wait = e.retry_after + 1
            logger.warning(f"Flood wait {wait}s — chat {chat_id}")
            await asyncio.sleep(wait)
            # Son deneme değilse tekrar dene
            if attempt == settings.max_retries:
                return False, f"Flood wait aşıldı: {e}", None

        except TelegramForbiddenError:
            return False, "Bot gruptan atıldı veya engellendi", None

        except TelegramBadRequest as e:
            err_msg = str(e).lower()
            # Yetki hatası → yeniden denemeden döndür
            if "not enough rights" in err_msg or "chat_write_forbidden" in err_msg or "need administrator rights" in err_msg:
                return False, f"Yetki hatası: {str(e)}", None
            return False, f"Telegram hatası: {str(e)}", None

        except FileNotFoundError:
            return False, "Medya dosyası bulunamadı", None

        except Exception as e:
            if attempt == settings.max_retries:
                return False, str(e), None
            await asyncio.sleep(2)

    return False, "Bilinmeyen hata", None


async def _run_broadcast_internal(broadcast_id: int, chat_ids: list[int]):
    """Ana broadcast döngüsü — kuyruk worker tarafından çağrılır"""
    bot = get_bot()
    if not bot:
        logger.error("Bot çalışmıyor, broadcast başlatılamadı")
        return

    settings = await _get_settings()
    if not settings:
        logger.error("Ayarlar bulunamadı")
        return

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Broadcast).where(Broadcast.id == broadcast_id))
        broadcast = result.scalar_one_or_none()
        if not broadcast:
            return

        broadcast.status = BroadcastStatus.running
        broadcast.started_at = datetime.utcnow()
        broadcast.total_groups = len(chat_ids)
        await session.commit()
        await session.refresh(broadcast)

    _active_broadcasts[broadcast_id] = {
        "broadcast_id": broadcast_id,
        "total": len(chat_ids),
        "sent": 0,
        "failed": 0,
        "skipped": 0,
        "current_chat_id": None,
        "current_title": None,
        "status": "running",
    }
    _skip_signals[broadcast_id] = set()

    sent = failed = skipped = 0

    for chat_id in chat_ids:
        # İptal kontrolü
        if broadcast_id in _cancel_signals:
            _cancel_signals.discard(broadcast_id)
            break

        # Atla kontrolü
        if chat_id in _skip_signals.get(broadcast_id, set()):
            skipped += 1
            _active_broadcasts[broadcast_id].update({"sent": sent, "failed": failed, "skipped": skipped})
            await _log_result(broadcast_id, chat_id, "skipped", None, None)
            continue

        # Grup bilgisini al
        async with AsyncSessionLocal() as session:
            g = await session.execute(select(Group).where(Group.chat_id == chat_id))
            group = g.scalar_one_or_none()
            title = group.title if group else str(chat_id)
            username = group.username if group else ""

        _active_broadcasts[broadcast_id]["current_chat_id"] = chat_id
        _active_broadcasts[broadcast_id]["current_title"] = title

        # Güncel broadcast nesnesini yeniden çek (file_id cache için)
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(Broadcast).where(Broadcast.id == broadcast_id))
            broadcast = result.scalar_one_or_none()

        # Spintax + değişken işle — her grup için ayrı mesaj
        if broadcast.message_text:
            processed_text = prepare_message(broadcast.message_text, title, username or "")
        else:
            processed_text = None

        # Geçici broadcast kopyası ile gönder
        class _BroadcastProxy:
            pass
        proxy = _BroadcastProxy()
        proxy.__dict__.update(broadcast.__dict__)
        proxy.message_text = processed_text

        success, error, msg_id = await _send_message(bot, chat_id, proxy, settings)

        if success:
            sent += 1
            await _log_result(broadcast_id, chat_id, "sent", None, msg_id, title)
        else:
            failed += 1
            await _log_result(broadcast_id, chat_id, "failed", error, None, title)
            # Yetki/erişim hatası → grubu devre dışı bırak
            if error and ("atıldı" in error or "engellendi" in error or "Yetki hatası" in error):
                async with AsyncSessionLocal() as session:
                    await session.execute(
                        update(Group)
                        .where(Group.chat_id == chat_id)
                        .values(is_active=False, is_admin=False)
                    )
                    await session.commit()
                logger.info(f"Grup devre dışı bırakıldı (yetki hatası): {chat_id} — {title}")

        _active_broadcasts[broadcast_id].update({"sent": sent, "failed": failed, "skipped": skipped})

        # Gruplar arası gecikme
        delay = random.uniform(settings.min_delay_seconds, settings.max_delay_seconds)
        await asyncio.sleep(delay)

    # Broadcast'i tamamla
    final_status = BroadcastStatus.completed
    async with AsyncSessionLocal() as session:
        await session.execute(
            update(Broadcast)
            .where(Broadcast.id == broadcast_id)
            .values(
                status=final_status,
                sent_count=sent,
                failed_count=failed,
                skipped_count=skipped,
                finished_at=datetime.utcnow(),
            )
        )
        await session.commit()

    _active_broadcasts[broadcast_id]["status"] = "completed"
    _skip_signals.pop(broadcast_id, None)

    # Telegram bildirimi
    if settings.notification_chat_id:
        emoji = "✅" if failed == 0 else "⚠️"
        text = (
            f"{emoji} <b>Yayın Tamamlandı</b>\n\n"
            f"✅ Başarılı: {sent}\n"
            f"❌ Başarısız: {failed}\n"
            f"⏭️ Atlanan: {skipped}\n"
            f"📊 Toplam: {len(chat_ids)}"
        )
        await send_notification(settings.notification_chat_id, text)

    logger.info(f"Broadcast {broadcast_id} tamamlandı — sent={sent}, failed={failed}, skipped={skipped}")


async def _log_result(broadcast_id: int, chat_id: int, status: str,
                       error: str | None, msg_id: int | None, title: str | None = None):
    async with AsyncSessionLocal() as session:
        log = BroadcastLog(
            broadcast_id=broadcast_id,
            chat_id=chat_id,
            chat_title=title,
            status=status,
            error_message=error,
            telegram_message_id=msg_id,
        )
        session.add(log)
        await session.commit()
