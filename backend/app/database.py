from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import get_settings

settings = get_settings()

engine = create_async_engine(settings.database_url, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    from sqlalchemy import text
    async with engine.begin() as conn:
        from app.models import group, broadcast, schedule, settings as settings_model, template  # noqa
        await conn.run_sync(Base.metadata.create_all)

        # Migration: yeni kolonlari ekle (varsa atla)
        await conn.execute(text("""
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'repeattype') THEN
                    CREATE TYPE repeattype AS ENUM ('none', 'daily', 'weekly', 'monthly');
                END IF;
            END $$;
        """))
        await conn.execute(text(
            "ALTER TABLE scheduled_tasks ADD COLUMN IF NOT EXISTS "
            "repeat_type repeattype DEFAULT 'none'"
        ))
        await conn.execute(text(
            "ALTER TABLE scheduled_tasks ADD COLUMN IF NOT EXISTS "
            "repeat_end_at TIMESTAMP WITH TIME ZONE"
        ))
        await conn.execute(text(
            "ALTER TABLE scheduled_tasks ADD COLUMN IF NOT EXISTS "
            "broadcast_id INTEGER"
        ))
