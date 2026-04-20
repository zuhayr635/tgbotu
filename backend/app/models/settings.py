from sqlalchemy import Column, Integer, String, Boolean
from app.database import Base


class BotSettings(Base):
    __tablename__ = "bot_settings"

    id = Column(Integer, primary_key=True, default=1)  # Tek satır
    bot_token = Column(String(200), nullable=True)
    bot_username = Column(String(100), nullable=True)
    notification_chat_id = Column(String(50), nullable=True)  # Bildirim gönderilecek chat
    bot_is_running = Column(Boolean, default=False)
    min_delay_seconds = Column(Integer, default=3)
    max_delay_seconds = Column(Integer, default=8)
    max_retries = Column(Integer, default=2)
    storage_warn_mb = Column(Integer, default=100)
