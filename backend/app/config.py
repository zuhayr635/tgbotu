from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    database_url: str = "postgresql+asyncpg://tgbot:tgbot_secret@db:5432/tgbotdb"
    secret_key: str = "changeme_super_secret_key_32chars"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 gün

    admin_username: str = "zuhayr635"
    admin_password: str = "bana1kolaal"

    upload_dir: str = "/app/uploads"
    max_upload_size_mb: int = 50
    storage_warn_mb: int = 100  # Bu boyuta ulaşınca Telegram bildirimi


@lru_cache()
def get_settings() -> Settings:
    return Settings()
