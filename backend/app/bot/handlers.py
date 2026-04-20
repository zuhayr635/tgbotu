from aiogram import Router
from aiogram.types import ChatMemberUpdated
from aiogram.enums import ChatMemberStatus
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.group import Group, ChatType
import logging

logger = logging.getLogger(__name__)


async def upsert_group(chat_id: int, title: str, username: str | None,
                       chat_type: str, is_active: bool, is_admin: bool = False):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Group).where(Group.chat_id == chat_id))
        group = result.scalar_one_or_none()
        ctype = ChatType.channel if chat_type == "channel" else (
            ChatType.supergroup if chat_type == "supergroup" else ChatType.group
        )
        if group:
            group.title = title
            group.username = username
            group.chat_type = ctype
            group.is_active = is_active
            if is_admin:
                group.is_admin = True
        else:
            group = Group(
                chat_id=chat_id, title=title, username=username,
                chat_type=ctype, is_active=is_active, is_admin=is_admin,
            )
            session.add(group)
        await session.commit()


async def on_my_chat_member(event: ChatMemberUpdated):
    chat = event.chat
    new_status = event.new_chat_member.status
    title = chat.title or str(chat.id)
    username = getattr(chat, "username", None)

    if new_status in (ChatMemberStatus.MEMBER, ChatMemberStatus.RESTRICTED):
        await upsert_group(chat.id, title, username, chat.type, True, False)
        logger.info(f"Bot eklendi: {title}")
    elif new_status in (ChatMemberStatus.ADMINISTRATOR, ChatMemberStatus.CREATOR):
        await upsert_group(chat.id, title, username, chat.type, True, True)
        logger.info(f"Bot admin: {title}")
    elif new_status in (ChatMemberStatus.LEFT, ChatMemberStatus.KICKED):
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(Group).where(Group.chat_id == chat.id))
            group = result.scalar_one_or_none()
            if group:
                group.is_active = False
                group.is_admin = False
                await session.commit()
        logger.info(f"Bot cikarildi: {title}")


def create_router() -> Router:
    """Her bot baslatmada fresh router olustur — tekrar attach hatasini onler"""
    router = Router()
    router.my_chat_member()(on_my_chat_member)
    return router
