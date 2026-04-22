import asyncio
import logging
import os
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.database import init_db
from app.services.scheduler_service import start_scheduler, restore_pending_tasks
from app.routers import auth, groups, broadcasts, schedules, dashboard, settings, templates, admin, users, bots

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)


async def cleanup_stale_broadcasts():
    """Restart sonrası 'running' takılı kalan broadcast'leri 'failed' yap"""
    from datetime import datetime
    from sqlalchemy import update as sa_update, select as sa_select
    from app.database import AsyncSessionLocal
    from app.models.broadcast import Broadcast, BroadcastStatus

    async with AsyncSessionLocal() as session:
        # 'running' olanları failed yap (restart öncesi yarım kalan)
        result = await session.execute(
            sa_update(Broadcast)
            .where(Broadcast.status == BroadcastStatus.running)
            .values(status=BroadcastStatus.failed, finished_at=datetime.utcnow())
            .returning(Broadcast.id)
        )
        stale_ids = [row[0] for row in result.fetchall()]
        if stale_ids:
            logger.warning(f"Restart sonrası {len(stale_ids)} yarım broadcast 'failed' yapıldı: {stale_ids}")
        await session.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Başlangıç
    logger.info("=== Uygulama başlatılıyor ===")
    
    # Config bilgilerini logla (şifreleri gizle)
    settings = get_settings()
    safe_db_url = settings.database_url.split('@')[-1] if '@' in settings.database_url else settings.database_url
    logger.info(f"Database URL: ...@{safe_db_url}")
    logger.info(f"Admin Username: {settings.admin_username}")
    logger.info(f"Upload Dir: {settings.upload_dir}")
    
    try:
        logger.info("Database başlatılıyor...")
        await init_db()
        logger.info("Database başlatıldı")
    except Exception as e:
        logger.error(f"Database başlatma hatası: {e}", exc_info=True)
        raise
    
    try:
        await cleanup_stale_broadcasts()
        start_scheduler()
        await restore_pending_tasks()
        # Broadcast kuyruğunu başlat
        from app.services.broadcast_service import start_queue_worker
        asyncio.create_task(start_queue_worker())
        logger.info("=== Uygulama hazır ===")
    except Exception as e:
        logger.error(f"Uygulama başlatma hatası: {e}", exc_info=True)
        raise
    
    yield
    # Kapanış
    logger.info("=== Uygulama kapatılıyor ===")


app = FastAPI(
    title="TG Broadcast Panel API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router'ları ekle
app.include_router(auth.router)
app.include_router(groups.router)
app.include_router(broadcasts.router)
app.include_router(schedules.router)
app.include_router(dashboard.router)
app.include_router(settings.router)
app.include_router(templates.router)
app.include_router(admin.router)
app.include_router(users.router)
app.include_router(bots.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
