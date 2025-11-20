from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt

from app import models, database

router = APIRouter(prefix="/auth", tags=["Authentication"])
get_db = database.get_db

# ==============================
# JWT CONFIG
# ==============================
SECRET_KEY = "secret-key-demo"   # 🔥 nhớ đổi khi deploy
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ==============================
# PASSWORD HELPERS
# ==============================
def verify_password(plain_password, hashed_password):
    """Kiểm tra password bcrypt hoặc fallback password thường."""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except:
        return plain_password == hashed_password


def hash_password(password: str):
    return pwd_context.hash(password)


# ==============================
# JWT TOKEN HELPER
# ==============================
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ==============================
# LOGIN (ĐÃ SỬA: CHẶN USER BỊ KHÓA)
# ==============================
@router.post("/login")
def login(user: dict, db: Session = Depends(get_db)):
    username = user.get("username")
    password = user.get("password")

    if not username or not password:
        raise HTTPException(status_code=400, detail="Thiếu username hoặc password")

    db_user = db.query(models.Admin).filter(models.Admin.username == username).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Tài khoản không tồn tại")

    # ❌ Nếu tài khoản bị khóa → KHÔNG CHO ĐĂNG NHẬP
    if not db_user.is_active:
        raise HTTPException(status_code=403, detail="Tài khoản đã bị khóa")

    # Kiểm tra mật khẩu
    if not verify_password(password, db_user.password):
        raise HTTPException(status_code=401, detail="Sai mật khẩu")

    # Tạo JWT token
    token = create_access_token({
        "sub": db_user.username,
        "role": db_user.role
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "username": db_user.username,
        "role": db_user.role
    }


# ==============================
# REGISTER
# ==============================
@router.post("/register")
def register(user: dict, db: Session = Depends(get_db)):
    full_name = user.get("full_name")
    username = user.get("username")
    email = user.get("email")
    password = user.get("password")
    role = user.get("role", "employee")

    if not username or not password:
        raise HTTPException(status_code=400, detail="Thiếu username hoặc password")

    # Check username
    if db.query(models.Admin).filter(models.Admin.username == username).first():
        raise HTTPException(status_code=400, detail="Tên đăng nhập đã tồn tại")

    # Check email
    if email and db.query(models.Admin).filter(models.Admin.email == email).first():
        raise HTTPException(status_code=400, detail="Email đã tồn tại")

    hashed_password = hash_password(password)

    new_user = models.Admin(
        full_name=full_name,
        username=username,
        email=email,
        password=hashed_password,
        role=role,
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "Tạo tài khoản thành công",
        "username": username,
        "role": role
    }
