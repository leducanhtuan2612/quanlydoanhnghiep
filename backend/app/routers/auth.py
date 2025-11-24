from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt

from app import models, database, schemas

router = APIRouter(prefix="/auth", tags=["Authentication"])
get_db = database.get_db

# ==============================
# JWT CONFIG
# ==============================
SECRET_KEY = "secret-key-demo"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ==============================
# PASSWORD HELPERS
# ==============================
def verify_password(plain_password, hashed_password):
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False


def hash_password(password: str):
    return pwd_context.hash(password)


# ==============================
# JWT TOKEN
# ==============================
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ==============================
# LOGIN
# ==============================
@router.post("/login")
def login(user: schemas.LoginUser, db: Session = Depends(get_db)):

    db_user = (
        db.query(models.Admin)
        .filter(models.Admin.username == user.username)
        .first()
    )

    if not db_user:
        raise HTTPException(status_code=404, detail="Tài khoản không tồn tại")

    if not db_user.is_active:
        raise HTTPException(status_code=403, detail="Tài khoản đã bị khóa")

    if not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Sai mật khẩu")

    token = create_access_token({
        "sub": db_user.username,
        "role": db_user.role,
        "employee_id": db_user.employee_id,
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "username": db_user.username,
        "role": db_user.role,
        "employee_id": db_user.employee_id
    }


# ==============================
# REGISTER
# ==============================
@router.post("/register", response_model=schemas.AdminOut)
def register(data: schemas.RegisterUser, db: Session = Depends(get_db)):

    # Check username trùng
    if db.query(models.Admin).filter(models.Admin.username == data.username).first():
        raise HTTPException(400, "Tên đăng nhập đã tồn tại")

    # Check email trùng (nếu có nhập)
    if data.email:
        if db.query(models.Admin).filter(models.Admin.email == data.email).first():
            raise HTTPException(400, "Email đã tồn tại")

    # Tạo user mới
    new_user = models.Admin(
        full_name=data.full_name,
        username=data.username,
        email=data.email or None,      # Cho phép không có email
        password=hash_password(data.password),
        role="employee",               # Tài khoản tự đăng ký = nhân viên
        employee_id=None,              # ❗ Không bắt buộc có employee_id
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


    return {
        "message": "Tạo tài khoản thành công",
        "username": form.username,
        "role": form.role,
        "employee_id": form.employee_id
    }
