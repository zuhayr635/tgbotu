import os
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models.template import Template
from app.config import get_settings

router = APIRouter(prefix="/api/templates", tags=["templates"])
settings = get_settings()


class TemplateResponse(BaseModel):
    id: int
    name: str
    category: Optional[str]
    message_text: Optional[str]
    media_type: str
    media_path: Optional[str]
    disable_preview: bool
    parse_mode: str

    class Config:
        from_attributes = True


@router.get("", response_model=list[TemplateResponse])
async def list_templates(
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    from app.models.user import User
    result_user = await db.execute(
        select(User).where(User.username == current_user)
    )
    user = result_user.scalar_one_or_none()
    user_id = user.id if user else None

    result = await db.execute(select(Template).where(Template.user_id == user_id).order_by(Template.category, Template.name))
    return result.scalars().all()


@router.get("/categories")
async def list_categories(
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    from app.models.user import User
    result_user = await db.execute(
        select(User).where(User.username == current_user)
    )
    user = result_user.scalar_one_or_none()
    user_id = user.id if user else None

    result = await db.execute(select(Template.category).where(Template.user_id == user_id).distinct())
    return [r[0] for r in result.fetchall() if r[0]]


@router.post("")
async def create_template(
    name: str = Form(...),
    category: str = Form(default=""),
    message_text: str = Form(default=""),
    disable_preview: bool = Form(default=False),
    parse_mode: str = Form(default="HTML"),
    media: Optional[UploadFile] = File(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    media_path = None
    media_type = "none"

    if media and media.filename:
        ext = os.path.splitext(media.filename)[1].lower()
        if ext in (".jpg", ".jpeg", ".png", ".webp"):
            media_type = "photo"
        elif ext in (".mp4", ".mov", ".avi", ".mkv"):
            media_type = "video"
        os.makedirs(settings.upload_dir, exist_ok=True)
        filename = f"tpl_{uuid.uuid4()}{ext}"
        media_path = os.path.join(settings.upload_dir, filename)
        content = await media.read()
        with open(media_path, "wb") as f:
            f.write(content)

    # Get user_id from token
    from app.models.user import User
    result_user = await db.execute(
        select(User).where(User.username == current_user)
    )
    user = result_user.scalar_one_or_none()
    user_id = user.id if user else None

    tpl = Template(
        name=name,
        category=category or None,
        message_text=message_text or None,
        media_type=media_type,
        media_path=media_path,
        disable_preview=disable_preview,
        parse_mode=parse_mode,
        user_id=user_id,
    )
    db.add(tpl)
    await db.commit()
    await db.refresh(tpl)
    return {"id": tpl.id, "message": "Şablon kaydedildi"}


@router.delete("/{template_id}")
async def delete_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    from app.models.user import User
    result_user = await db.execute(
        select(User).where(User.username == current_user)
    )
    user = result_user.scalar_one_or_none()
    user_id = user.id if user else None

    result = await db.execute(select(Template).where(Template.id == template_id).where(Template.user_id == user_id))
    tpl = result.scalar_one_or_none()
    if not tpl:
        raise HTTPException(404, "Şablon bulunamadı")
    await db.delete(tpl)
    await db.commit()
    return {"message": "Silindi"}
