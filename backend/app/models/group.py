from sqlalchemy import Column, BigInteger, String, Boolean, DateTime, Integer, Enum
from sqlalchemy.sql import func
import enum
from app.database import Base


class ChatType(str, enum.Enum):
    group = "group"
    supergroup = "supergroup"
    channel = "channel"


class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, autoincrement=True)
    chat_id = Column(BigInteger, unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    username = Column(String(255), nullable=True)
    chat_type = Column(Enum(ChatType), nullable=False, default=ChatType.group)
    member_count = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)          # Bot hâlâ içinde mi
    is_blacklisted = Column(Boolean, default=False)    # Kullanıcı devre dışı bıraktı mı
    is_admin = Column(Boolean, default=False)           # Bot admin mi (kanal için gerekli)
    can_post = Column(Boolean, default=None, nullable=True)  # Mesaj gönderme yetkisi var mı (None=kontrol edilmedi)
    restrict_info = Column(String(255), nullable=True)  # Kısıtlama sebebi
    tag = Column(String(100), nullable=True)            # Kullanıcının verdiği etiket
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
