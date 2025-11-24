from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app import models, database

router = APIRouter(prefix="/employee-account", tags=["Employee Account"])
get_db = database.get_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)


# ============================================================
# 🟩 TẠO TÀI KHOẢN CHO NHÂN VIÊN
# ============================================================
@router.post("/{employee_id}")
def create_employee_account(employee_id: int, data: dict, db: Session = Depends(get_db)):
    username = data.get("username")
    password = data.get("password")
    email = data.get("email")

    if not username or not password:
        raise HTTPException(status_code=400, detail="Thiếu username hoặc password")

    # Check employee tồn tại
    emp = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Không tìm thấy nhân viên")

    # Check username trùng
    if db.query(models.Admin).filter(models.Admin.username == username).first():
        raise HTTPException(status_code=400, detail="Tên đăng nhập đã tồn tại")

    # Check email trùng
    if email and db.query(models.Admin).filter(models.Admin.email == email).first():
        raise HTTPException(status_code=400, detail="Email đã tồn tại")

    acc = models.Admin(
        full_name=emp.name,
        username=username,
        email=email,
        password=hash_password(password),
        role="employee",
        is_active=True,
        employee_id=employee_id
    )

    db.add(acc)
    db.commit()
    db.refresh(acc)

    return {"message": "Tạo tài khoản nhân viên thành công", "username": username}
