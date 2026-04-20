from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from app.auth import create_access_token, get_current_user, get_password_hash, verify_password
from app.config import get_settings

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


@router.post("/login", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    if form_data.username != settings.admin_username:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Kullanıcı adı veya şifre hatalı")
    if not verify_password(form_data.password, get_hashed_admin_password()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Kullanıcı adı veya şifre hatalı")
    token = create_access_token({"sub": form_data.username})
    return TokenResponse(access_token=token)


@router.post("/change-password")
async def change_password(
    body: ChangePasswordRequest,
    current_user: str = Depends(get_current_user),
):
    global _hashed_password
    if not verify_password(body.current_password, get_hashed_admin_password()):
        raise HTTPException(status_code=400, detail="Mevcut şifre hatalı")
    _hashed_password = get_password_hash(body.new_password)
    return {"message": "Şifre başarıyla değiştirildi"}


@router.get("/me")
async def me(current_user: str = Depends(get_current_user)):
    return {"username": current_user}
