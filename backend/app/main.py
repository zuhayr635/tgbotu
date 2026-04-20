import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.database import init_db
from app.services.scheduler_service import start_scheduler, restore_pending_tasks
from app.routers import auth, groups, broadcasts, schedules, dashboard, settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Başlangıç
    logger.info("Uygulama başlatılıyor...")
    await init_db()
    start_scheduler()
    await restore_pending_tasks()
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


@app.get("/api/health")
async def health():
    return {"status": "ok"}
