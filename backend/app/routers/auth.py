from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select as sa_select
from datetime import datetime
from typing import Optional
from app.auth import create_access_token, get_current_user, get_password_hash, verify_password, get_current_admin
from app.config import get_settings
from app.database import AsyncSessionLocal
from app.models.user import User, UserApprovalStatus, UserPlanType

router = APIRouter(prefix="/api/auth", tags=["auth"])
settings = get_settings()

# Şifreyi hash'li saklıyoruz — ilk açılışta .env'den alınır
_hashed_password: str | None = None


def get_hashed_admin_password() -> str:
    global _hashed_password
    if _hashed_password is None:
        _hashed_password = get_password_hash(settings.admin_password)
    return _hashed_password


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    email: str
    is_admin: bool
    plan_type: str
    tokens: int


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=20, pattern=r"^[a-zA-Z0-9_]+$")
    email: EmailStr
    password: str = Field(..., min_length=8)
    password_confirm: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_admin: bool
    approval_status: str
    plan_type: str
    tokens: int
    created_at: datetime


@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(lambda: AsyncSessionLocal())
):
    # Önce multi-user sistemde kontrol et
    result = await db.execute(
        sa_select(User).where(User.username == form_data.username)
    )
    user = result.scalar_one_or_none()
    
    if user:
        # Multi-user login
        if not verify_password(form_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Kullanıcı adı veya şifre hatalı"
            )
        
        if user.approval_status != UserApprovalStatus.approved:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Hesabınız henüz onaylanmadı"
            )
        
        token = create_access_token({"sub": str(user.id)})
        return TokenResponse(
            access_token=token,
            user_id=user.id,
            username=user.username,
            email=user.email,
            is_admin=user.is_admin,
            plan_type=user.plan_type.value,
            tokens=user.tokens
        )
    
    # Backward compatibility - eski admin sistemi
    if form_data.username == settings.admin_username:
        if not verify_password(form_data.password, get_hashed_admin_password()):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Kullanıcı adı veya şifre hatalı"
            )
        token = create_access_token({"sub": form_data.username})
        return TokenResponse(
            access_token=token,
            user_id=0,
            username=form_data.username,
            email="admin@localhost",
            is_admin=True,
            plan_type="free",
            tokens=9999
        )
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Kullanıcı adı veya şifre hatalı"
    )


@router.post("/register", response_model=UserResponse)
async def register(
    body: RegisterRequest,
    db: AsyncSession = Depends(lambda: AsyncSessionLocal())
):
    # Şifre doğrulama
    if body.password != body.password_confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Şifreler eşleşmiyor"
        )
    
    # Username kontrolü
    result = await db.execute(
        sa_select(User).where(User.username == body.username)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu kullanıcı adı zaten kullanımda"
        )
    
    # Email kontrolü
    result = await db.execute(
        sa_select(User).where(User.email == body.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu e-posta adresi zaten kullanımda"
        )
    
    # Kullanıcı oluştur
    user = User(
        username=body.username,
        email=body.email,
        password_hash=get_password_hash(body.password),
        approval_status=UserApprovalStatus.pending,
        plan_type=UserPlanType.free,
        tokens=0
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return user


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        is_admin=current_user.is_admin,
        approval_status=current_user.approval_status.value,
        plan_type=current_user.plan_type.value,
        tokens=current_user.tokens,
        created_at=current_user.created_at
    )


@router.post("/change-password")
async def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(lambda: AsyncSessionLocal())
):
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Mevcut şifre hatalı")
    
    current_user.password_hash = get_password_hash(body.new_password)
    await db.commit()
    
    return {"message": "Şifre başarıyla değiştirildi"}
