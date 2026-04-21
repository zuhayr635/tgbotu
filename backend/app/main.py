import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.database import init_db
from app.services.scheduler_service import start_scheduler, restore_pending_tasks
from app.routers import auth, groups, broadcasts, schedules, dashboard, settings, templates

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
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
    logger.info("Uygulama başlatılıyor...")
    await init_db()
    await cleanup_stale_broadcasts()
    start_scheduler()
    await restore_pending_tasks()
    # Broadcast kuyruğunu başlat
    from app.services.broadcast_service import start_queue_worker
    asyncio.create_task(start_queue_worker())
    logger.info("Uygulama hazır")
    yield
    # Kapanış
    logger.info("Uygulama kapatılıyor...")


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


@app.get("/api/health")
async def health():
    return {"status": "ok"}
