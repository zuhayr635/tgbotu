from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.auth import get_current_user
from app.database import get_db
from app.models.group import Group
from app.services.bot_service import get_bot

router = APIRouter(prefix="/api/groups", tags=["groups"])


class GroupResponse(BaseModel):
    id: int
    chat_id: int
    title: str
    username: Optional[str]
    chat_type: str
    member_count: Optional[int]
    is_active: bool
    is_blacklisted: bool
    is_admin: bool
    tag: Optional[str]

    class Config:
        from_attributes = True


class GroupUpdate(BaseModel):
    tag: Optional[str] = None
    is_blacklisted: Optional[bool] = None


@router.get("", response_model=list[GroupResponse])
async def list_groups(
    active_only: bool = True,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_user),
):
    query = select(Group).order_by(Group.title)
    if active_only:
        query = query.where(Group.is_active == True)
    result = await db.execute(query)
    return result.scalars().all()


@router.patch("/{group_id}")
async def update_group(
    group_id: int,
    body: GroupUpdate,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_user),
):
    result = await db.execute(select(Group).where(Group.id == group_id))
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(404, "Grup bulunamadı")
    if body.tag is not None:
        group.tag = body.tag
    if body.is_blacklisted is not None:
        group.is_blacklisted = body.is_blacklisted
    await db.commit()
    return {"message": "Güncellendi"}


class AddGroupRequest(BaseModel):
    chat_id: str  # chat_id (sayı) veya @username


@router.post("/add")
async def add_group(
    body: AddGroupRequest,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_user),
):
    bot = get_bot()
    if not bot:
        raise HTTPException(400, "Bot çalışmıyor, önce botu başlatın")

    # chat_id veya @username
    try:
        chat_identifier = int(body.chat_id)
    except ValueError:
        chat_identifier = body.chat_id  # @username string

    try:
        chat = await bot.get_chat(chat_identifier)
    except Exception as e:
        raise HTTPException(400, f"Grup bulunamadı: {str(e)}")

    # Bot üye mi kontrol et
    try:
        me = await bot.get_me()
        member = await bot.get_chat_member(chat.id, me.id)
        member_status = member.status
        is_admin = member_status in ("administrator", "creator")
    except Exception:
        is_admin = False
        member_status = "member"

    # Üye sayısı
    try:
        member_count = await bot.get_chat_member_count(chat.id)
    except Exception:
        member_count = 0

    chat_type = chat.type if hasattr(chat, "type") else "group"

    # Upsert
    result = await db.execute(select(Group).where(Group.chat_id == chat.id))
    existing = result.scalar_one_or_none()

    if existing:
        existing.title = chat.title or str(chat.id)
        existing.username = chat.username
        existing.chat_type = chat_type
        existing.member_count = member_count
        existing.is_admin = is_admin
        existing.is_active = True
        existing.is_blacklisted = False
        await db.commit()
        return {"message": "Grup güncellendi", "group_id": existing.id}
    else:
        group = Group(
            chat_id=chat.id,
            title=chat.title or str(chat.id),
            username=chat.username,
            chat_type=chat_type,
            member_count=member_count,
            is_admin=is_admin,
            is_active=True,
            is_blacklisted=False,
        )
        db.add(group)
        await db.commit()
        await db.refresh(group)
        return {"message": "Grup eklendi", "group_id": group.id}


@router.get("/bot-groups")
async def get_bot_groups(
    _: str = Depends(get_current_user),
):
    """Bot'un üye olduğu grupları Telegram'dan getir (tüm chat'ler için getUpdates kullanır)"""
    # Bu endpoint mevcut DB gruplarını döndürür, bot_service üzerinden
    # Gerçekte Telegram API getUpdates üzerinden gruplar eklenir
    return {"message": "Gruplar my_chat_member eventi ile otomatik eklenir. Manuel eklemek için /add endpoint'ini kullanın."}


@router.get("/tags")
async def list_tags(
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_user),
):
    result = await db.execute(select(Group.tag).where(Group.tag.isnot(None)).distinct())
    tags = [row[0] for row in result.fetchall() if row[0]]
    return tags
