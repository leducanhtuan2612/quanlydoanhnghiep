from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import jwt
from passlib.context import CryptContext

from app import models, database

SECRET_KEY = "secret-key-demo"
ALGORITHM = "HS256"

oauth2 = OAuth2PasswordBearer(tokenUrl="/auth/login")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ==========================
# 🔥 HÀM HASH PASSWORD — RẤT QUAN TRỌNG
# ==========================
def hash_password(password: str):
    return pwd_context.hash(password)


# ==========================
# 🔐 HÀM VERIFY PASSWORD
# ==========================
def verify_password(plain_password, hashed_password):
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except:
        return False


# ==========================
# 🔑 LẤY USER TỪ JWT
# ==========================
def get_current_user(
    token: str = Depends(oauth2),
    db: Session = Depends(database.get_db)
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Token không hợp lệ")

        user = (
            db.query(models.Admin)
            .filter(models.Admin.username == username)
            .first()
        )

        if not user:
            raise HTTPException(status_code=404, detail="User không tồn tại")

        return user

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token hết hạn")
    except:
        raise HTTPException(status_code=401, detail="Token không hợp lệ")
