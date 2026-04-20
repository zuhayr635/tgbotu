from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://tgbot:tgbot_secret@db:5432/tgbotdb"
    secret_key: str = "changeme_super_secret_key_32chars"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 gün

    admin_username: str = "admin"
    admin_password: str = "admin123"

    upload_dir: str = "/app/uploads"
    max_upload_size_mb: int = 50
    storage_warn_mb: int = 100  # Bu boyuta ulaşınca Telegram bildirimi

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
