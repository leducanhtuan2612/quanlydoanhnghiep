from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import jwt

from app import models, database

SECRET_KEY = "secret-key-demo"
ALGORITHM = "HS256"

oauth2 = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(token: str = Depends(oauth2), db: Session = Depends(database.get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(401, "Token không hợp lệ")

        user = db.query(models.Admin).filter(models.Admin.username == username).first()
        if not user:
            raise HTTPException(404, "User không tồn tại")

        return user

    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token hết hạn")
    except Exception:
        raise HTTPException(401, "Token không hợp lệ")
