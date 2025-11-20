from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt

from app import models, database

router = APIRouter(prefix="/auth", tags=["Authentication"])
get_db = database.get_db

SECRET_KEY = "secret-key-demo"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ==========================
# Password Helper
# ==========================

def verify_password(plain_password, hashed_password):
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except:
        return False


def hash_password(password: str):
    return pwd_context.hash(password)


# ==========================
# JWT Token Helper
# ==========================

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ==========================
# LOGIN
# ==========================

@router.post("/login")
def login(user: dict, db: Session = Depends(get_db)):
    username = user.get("username")
    password = user.get("password")

    db_user = db.query(models.Admin).filter(models.Admin.username == username).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Tài khoản không tồn tại")

    # bcrypt OK?
    if verify_password(password, db_user.password):
        pass
    else:
        # fallback plaintext
        if db_user.password != password:
            raise HTTPException(status_code=401, detail="Sai mật khẩu")

    token = create_access_token({
        "sub": db_user.username,
        "role": db_user.role
    })

    return {
        "access_token": token,
        "username": db_user.username,
        "role": db_user.role
    }


# ==========================
# REGISTER
# ==========================

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
    if email:
        if db.query(models.Admin).filter(models.Admin.email == email).first():
            raise HTTPException(status_code=400, detail="Email đã tồn tại")

    hashed_password = hash_password(password)

    new_user = models.Admin(
        full_name=full_name,
        username=username,
        email=email,
        password=hashed_password,
        role=role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "Tạo tài khoản thành công",
        "username": username,
        "role": role
    }
