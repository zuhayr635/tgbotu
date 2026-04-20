from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.auth import get_current_user
from app.database import get_db
from app.models.group import Group

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


@router.get("/tags")
async def list_tags(
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_user),
):
    result = await db.execute(select(Group.tag).where(Group.tag.isnot(None)).distinct())
    tags = [row[0] for row in result.fetchall() if row[0]]
    return tags
