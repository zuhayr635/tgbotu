import asyncio
import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.auth import get_current_user
from app.database import get_db, AsyncSessionLocal
from app.models.group import Group
from app.services.bot_service import get_bot

logger = logging.getLogger(__name__)

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
    can_post: Optional[bool]
    restrict_info: Optional[str]
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


async def _check_group_permissions(bot, group: Group) -> tuple[bool, str | None, bool, str | None]:
    """
    Bir grup için bot'un mesaj gönderme yetkisini kontrol eder.
    Döner: (is_active, restrict_info, is_admin, can_post_reason)
    """
    try:
        me = await bot.get_me()
        member = await bot.get_chat_member(group.chat_id, me.id)
        status = member.status  # 'creator','administrator','member','restricted','left','kicked'

        if status in ("left", "kicked"):
            return False, "Bot gruptan ayrılmış/atılmış", False, None

        is_admin = status in ("administrator", "creator")

        # Kanallar → admin + can_post_messages gerekli
        if group.chat_type == "channel":
            if not is_admin:
                return True, None, False, "Kanal: Bot yönetici değil (mesaj atamazsın)"
            can_post = getattr(member, "can_post_messages", False)
            if not can_post:
                return True, None, True, "Kanal: 'Mesaj Gönder' yetkisi kapalı"
            return True, None, True, None

        # Gruplar / Supergroup
        if status == "restricted":
            can_send = getattr(member, "can_send_messages", False)
            if not can_send:
                return True, None, False, "Bot kısıtlanmış: mesaj gönderme yasak"

        # Admin değil ama üye — grup ayarına bağlı, genelde gönderebilir
        if not is_admin:
            # Grubun genel izinlerini kontrol et
            try:
                chat = await bot.get_chat(group.chat_id)
                perms = getattr(chat, "permissions", None)
                if perms and not getattr(perms, "can_send_messages", True):
                    return True, None, False, "Grup: Sadece yöneticiler yazabilir"
            except Exception:
                pass

        return True, None, is_admin, None

    except Exception as e:
        err = str(e).lower()
        if "bot was kicked" in err or "chat not found" in err or "bot is not a member" in err:
            return False, str(e), False, None
        logger.warning(f"Grup izin kontrol hatası {group.chat_id}: {e}")
        return group.is_active, None, group.is_admin, None


@router.post("/check-permissions")
async def check_all_permissions(
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_user),
):
    """Tüm aktif gruplar için bot'un yetki durumunu Telegram'dan kontrol eder ve günceller."""
    bot = get_bot()
    if not bot:
        raise HTTPException(400, "Bot çalışmıyor")

    result = await db.execute(select(Group).order_by(Group.title))
    groups = result.scalars().all()

    updated = 0
    results = []

    for group in groups:
        try:
            is_active, restrict_info, is_admin, can_post_reason = await _check_group_permissions(bot, group)

            can_post = can_post_reason is None and is_active
            # Kanal değilse ve aktifse → can_post True (admin olsun olmasın gönderebilir, genel izin kontrol edildi)
            if group.chat_type != "channel" and is_active and can_post_reason is None:
                can_post = True

            group.is_active = is_active
            group.is_admin = is_admin
            group.can_post = can_post
            group.restrict_info = can_post_reason or restrict_info

            results.append({
                "id": group.id,
                "title": group.title,
                "chat_type": group.chat_type,
                "is_active": is_active,
                "is_admin": is_admin,
                "can_post": can_post,
                "restrict_info": group.restrict_info,
            })
            updated += 1

            # Rate limit aşmamak için kısa bekleme
            await asyncio.sleep(0.3)

        except Exception as e:
            logger.error(f"Grup kontrol hatası {group.chat_id}: {e}")

    await db.commit()
    return {"checked": updated, "groups": results}


@router.get("/bot-groups")
async def get_bot_groups(
    _: str = Depends(get_current_user),
):
    """Bot'un üye olduğu tüm grupları Telegram'dan çeker"""
    bot = get_bot()
    if not bot:
        raise HTTPException(400, "Bot çalışmıyor")
    
    try:
        from app.bot.handlers import user_detected_groups
        
        # Tüm tespit edilen grupları getir
        all_groups = []
        for user_id, chat_ids in user_detected_groups.items():
            for chat_id in chat_ids:
                try:
                    chat = await bot.get_chat(chat_id)
                    all_groups.append({
                        "chat_id": chat.id,
                        "title": chat.title or str(chat.id),
                        "username": getattr(chat, "username", None),
                        "type": chat.type,
                        "detected_by_user": user_id
                    })
                except Exception as e:
                    logger.warning(f"Grup bilgisi alınamadı {chat_id}: {e}")
        
        return {"groups": all_groups}
    except Exception as e:
        raise HTTPException(500, f"Gruplar alınamadı: {str(e)}")


@router.post("/detect-groups")
async def detect_user_groups(
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_user),
):
    """Kullanıcının admin olduğu tüm grupları tespit eder"""
    bot = get_bot()
    if not bot:
        raise HTTPException(400, "Bot çalışmıyor")
    
    try:
        # Veritabanındaki tüm aktif grupları getir
        result = await db.execute(select(Group).where(Group.is_active == True))
        groups = result.scalars().all()
        
        detected = []
        for group in groups:
            try:
                # Botun bu gruptaki durumunu kontrol et
                me = await bot.get_me()
                member = await bot.get_chat_member(group.chat_id, me.id)
                
                # Grup yöneticilerini al
                admins = await bot.get_chat_administrators(group.chat_id)
                
                detected.append({
                    "id": group.id,
                    "chat_id": group.chat_id,
                    "title": group.title,
                    "username": group.username,
                    "chat_type": group.chat_type.value,
                    "member_count": group.member_count,
                    "is_admin": group.is_admin,
                    "can_post": group.can_post,
                    "restrict_info": group.restrict_info,
                    "bot_status": member.status,
                    "admin_count": len(admins)
                })
            except Exception as e:
                logger.warning(f"Grup tespit hatası {group.chat_id}: {e}")
        
        return {"detected": len(detected), "groups": detected}
    except Exception as e:
        raise HTTPException(500, f"Tespit hatası: {str(e)}")


class PromoteBotRequest(BaseModel):
    group_id: int


@router.post("/promote-bot")
async def promote_bot_in_group(
    body: PromoteBotRequest,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_user),
):
    """
    Botu yönetici yapma talimatları döndürür.
    Not: Botlar kendilerini yönetici yapamaz, bu işlem manuel yapılmalıdır.
    """
    result = await db.execute(select(Group).where(Group.id == body.group_id))
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(404, "Grup bulunamadı")
    
    bot = get_bot()
    if not bot:
        raise HTTPException(400, "Bot çalışmıyor")
    
    try:
        me = await bot.get_me()
        bot_username = me.username
        
        return {
            "message": "Botu yönetici yapmak için şu adımları izleyin:",
            "group_title": group.title,
            "group_username": group.username,
            "bot_username": bot_username,
            "instructions": [
                f"1. {group.title} grubuna gidin",
                f"2. Grup adına tıklayın → 'Yöneticiler' veya 'Manage'",
                f"3. 'Yönetici Ekle'ye tıklayın",
                f"4. @{bot_username} kullanıcı adını aratın",
                f"5. Botu seçin ve şu yetkileri verin:",
                f"   - Mesajları sil (Delete Messages)",
                f"   - Üyeleri yasakla (Ban Users)",
                f"   - Grup bilgilerini düzenle (Change Group Info)",
                f"   - Üye ekle (Invite Users)",
                f"   - Pin messages (Mesajları sabitle)",
                f"   - NOT: 'Yönetici Ekleme' yetkisi VERMEYİN (güvenlik için)",
                f"6. Onaylayın"
            ],
            "bot_link": f"https://t.me/{bot_username}",
            "group_link": f"https://t.me/{group.username}" if group.username else None,
            "note": "Bot anonim olarak çalışacak, yönetici işlemleri görünmeyecek"
        }
    except Exception as e:
        raise HTTPException(500, f"Bilgi alınamadı: {str(e)}")


class BulkPromoteRequest(BaseModel):
    group_ids: list[int]


@router.post("/promote-bot-bulk")
async def promote_bot_bulk(
    body: BulkPromoteRequest,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_user),
):
    """
    Seçilen gruplar için botu yönetici yapma talimatlarını döndürür.
    Not: Botlar kendilerini yönetici yapamaz, bu işlem manuel yapılmalıdır.
    """
    bot = get_bot()
    if not bot:
        raise HTTPException(400, "Bot çalışmıyor")
    
    try:
        me = await bot.get_me()
        bot_username = me.username
        bot_id = me.id
        
        # Seçilen grupları getir
        result = await db.execute(
            select(Group).where(Group.id.in_(body.group_ids))
        )
        groups = result.scalars().all()
        
        if not groups:
            raise HTTPException(404, "Grup bulunamadı")
        
        # Her grup için bilgileri hazırla
        group_info = []
        for group in groups:
            # Botun bu gruptaki durumunu kontrol et
            try:
                member = await bot.get_chat_member(group.chat_id, bot_id)
                is_member = member.status not in ("left", "kicked")
                is_admin = member.status in ("administrator", "creator")
            except Exception:
                is_member = False
                is_admin = False
            
            group_info.append({
                "id": group.id,
                "title": group.title,
                "username": group.username,
                "chat_id": group.chat_id,
                "chat_type": group.chat_type,
                "is_member": is_member,
                "is_admin": is_admin,
                "group_link": f"https://t.me/{group.username}" if group.username else None
            })
        
        return {
            "bot_username": bot_username,
            "bot_id": bot_id,
            "bot_link": f"https://t.me/{bot_username}",
            "groups": group_info,
            "instructions": [
                "1. Her grup için aşağıdaki adımları takip edin:",
                "2. Gruba gidin → Grup adına tıklayın → 'Yöneticiler'",
                "3. 'Yönetici Ekle'ye tıklayın",
                f"4. @{bot_username} kullanıcı adını aratın",
                "5. Botu seçin ve şu yetkileri verin:",
                "   - Mesajları sil (Delete Messages)",
                "   - Üyeleri yasakla (Ban Users)",
                "   - Grup bilgilerini düzenle (Change Group Info)",
                "   - Üye ekle (Invite Users)",
                "   - Mesajları sabitle (Pin Messages)",
                "   - NOT: 'Yönetici Ekleme' yetkisi VERMEYİN (güvenlik için)",
                "6. Onaylayın",
                "",
                "⚠️ ÖNEMLİ: Bot anonim modda çalışacak, yönetici işlemleri grupta görünmeyecek."
            ],
            "total": len(group_info),
            "already_admin": sum(1 for g in group_info if g["is_admin"]),
            "not_member": sum(1 for g in group_info if not g["is_member"])
        }
    except Exception as e:
        raise HTTPException(500, f"Bilgi alınamadı: {str(e)}")


class BulkAddGroupRequest(BaseModel):
    group_ids: list[str]  # chat_id (sayı) veya @username


@router.post("/add-bulk")
async def add_groups_bulk(
    body: BulkAddGroupRequest,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_user),
):
    """Seçilen grupları toplu olarak ekler"""
    bot = get_bot()
    if not bot:
        raise HTTPException(400, "Bot çalışmıyor, önce botu başlatın")

    results = []
    
    for chat_identifier_str in body.group_ids:
        try:
            # chat_id veya @username
            try:
                chat_identifier = int(chat_identifier_str)
            except ValueError:
                chat_identifier = chat_identifier_str  # @username string
            
            chat = await bot.get_chat(chat_identifier)
            
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
            result_query = await db.execute(select(Group).where(Group.chat_id == chat.id))
            existing = result_query.scalar_one_or_none()
            
            if existing:
                existing.title = chat.title or str(chat.id)
                existing.username = chat.username
                existing.chat_type = chat_type
                existing.member_count = member_count
                existing.is_admin = is_admin
                existing.is_active = True
                existing.is_blacklisted = False
                await db.commit()
                results.append({
                    "success": True,
                    "chat_id": chat.id,
                    "title": chat.title or str(chat.id),
                    "message": "Güncellendi"
                })
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
                results.append({
                    "success": True,
                    "chat_id": chat.id,
                    "title": chat.title or str(chat.id),
                    "message": "Eklendi"
                })
            
            # Rate limit aşmamak için kısa bekleme
            await asyncio.sleep(0.5)
            
        except Exception as e:
            results.append({
                "success": False,
                "chat_id": chat_identifier_str,
                "error": str(e)
            })
    
    successful = sum(1 for r in results if r.get("success"))
    failed = len(results) - successful
    
    return {
        "message": f"{successful} grup eklendi, {failed} başarısız",
        "total": len(results),
        "successful": successful,
        "failed": failed,
        "results": results
    }


@router.get("/tags")
async def list_tags(
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_user),
):
    result = await db.execute(select(Group.tag).where(Group.tag.isnot(None)).distinct())
    tags = [row[0] for row in result.fetchall() if row[0]]
    return tags
