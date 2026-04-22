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
        from app.models import (
            group, broadcast, schedule, settings as settings_model, template,
            user, plan_limits, bot_token
        )  # noqa
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
        # Groups tablosu: yetki kolonları
        await conn.execute(text(
            "ALTER TABLE groups ADD COLUMN IF NOT EXISTS can_post BOOLEAN DEFAULT NULL"
        ))
        await conn.execute(text(
            "ALTER TABLE groups ADD COLUMN IF NOT EXISTS restrict_info VARCHAR(255) DEFAULT NULL"
        ))
        
        # Multi-tenant migrations
        # User tablosu için enum types
        await conn.execute(text("""
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userapprovalstatus') THEN
                    CREATE TYPE userapprovalstatus AS ENUM ('pending', 'approved', 'rejected');
                END IF;
            END $$;
        """))
        await conn.execute(text("""
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userplantype') THEN
                    CREATE TYPE userplantype AS ENUM ('free', 'weekly', 'monthly');
                END IF;
            END $$;
        """))
        await conn.execute(text("""
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plantype') THEN
                    CREATE TYPE plantype AS ENUM ('free', 'weekly', 'monthly');
                END IF;
            END $$;
        """))
        
        # Groups tablosuna user_id ve bot_token_id ekle
        await conn.execute(text(
            "ALTER TABLE groups ADD COLUMN IF NOT EXISTS user_id INTEGER"
        ))
        await conn.execute(text(
            "ALTER TABLE groups ADD COLUMN IF NOT EXISTS bot_token_id INTEGER"
        ))
        
        # Broadcast tablosuna user_id, tokens_cost, tokens_used ekle
        await conn.execute(text(
            "ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS user_id INTEGER"
        ))
        await conn.execute(text(
            "ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS tokens_cost INTEGER DEFAULT 1"
        ))
        await conn.execute(text(
            "ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS tokens_used INTEGER DEFAULT 0"
        ))
        
        # ScheduledTask tablosuna user_id, tokens_cost, tokens_used ekle
        await conn.execute(text(
            "ALTER TABLE scheduled_tasks ADD COLUMN IF NOT EXISTS user_id INTEGER"
        ))
        await conn.execute(text(
            "ALTER TABLE scheduled_tasks ADD COLUMN IF NOT EXISTS tokens_cost INTEGER DEFAULT 1"
        ))
        await conn.execute(text(
            "ALTER TABLE scheduled_tasks ADD COLUMN IF NOT EXISTS tokens_used INTEGER DEFAULT 0"
        ))
        
        # Template tablosuna user_id ekle
        await conn.execute(text(
            "ALTER TABLE templates ADD COLUMN IF NOT EXISTS user_id INTEGER"
        ))
        
        # Index'leri oluştur
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS idx_groups_user_id ON groups(user_id)"
        ))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS idx_broadcasts_user_id ON broadcasts(user_id)"
        ))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_user_id ON scheduled_tasks(user_id)"
        ))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id)"
        ))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS idx_bot_tokens_user_id ON bot_tokens(user_id)"
        ))
        
        # Default admin kullanıcısı oluştur (eğer yoksa)
        await conn.execute(text("""
            INSERT INTO users (username, email, password_hash, is_admin, approval_status, plan_type, tokens)
            VALUES ('admin', 'admin@localhost', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5aq7k0LMX9e3i', true, 'approved', 'free', 1000)
            ON CONFLICT (username) DO NOTHING
        """))
