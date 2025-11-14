from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt

from app import models, database

router = APIRouter(prefix="/auth", tags=["Authentication"])
get_db = database.get_db

SECRET_KEY = "secret-key-demo"  # ⚠️ đổi sang key bảo mật thật
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/login")
def login(user: dict, db: Session = Depends(get_db)):
    username = user.get("username")
    password = user.get("password")

    # 🔍 Tìm user theo username
    db_user = db.query(models.Admin).filter(models.Admin.username == username).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Tài khoản không tồn tại")

    # 🔐 Kiểm tra mật khẩu (ở đây tạm so sánh trực tiếp)
    # Nếu có hash mật khẩu thật, thay bằng verify_password()
    if db_user.password != password:
        raise HTTPException(status_code=401, detail="Sai mật khẩu")

    # ✅ Tạo token JWT
    token = create_access_token({"sub": db_user.username, "role": db_user.role})
    return {
        "access_token": token,
        "username": db_user.username,
        "role": db_user.role
    }
