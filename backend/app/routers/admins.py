from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas, database
from app.core.permissions import require_role
from app.core.security import hash_password

router = APIRouter(prefix="/admins", tags=["Admins"])
get_db = database.get_db


# ============================================================
# 🟩 LẤY DANH SÁCH NGƯỜI DÙNG (CHỈ ADMIN)
# ============================================================
@router.get("/", response_model=List[schemas.AdminOut])
def get_admins(
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin"]))
):
    return db.query(models.Admin).all()


# ============================================================
# 🟦 LẤY 1 USER THEO ID
# ============================================================
@router.get("/{admin_id}", response_model=schemas.AdminOut)
def get_admin(
    admin_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin", "manager"]))
):
    user = db.query(models.Admin).filter(models.Admin.id == admin_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    return user


# ============================================================
# 🟨 TẠO USER (hash password + check trùng)
# ============================================================
@router.post("/", response_model=schemas.AdminOut)
def create_admin(
    admin: schemas.AdminCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin"]))
):
    # check username trùng
    if db.query(models.Admin).filter(models.Admin.username == admin.username).first():
        raise HTTPException(status_code=400, detail="Tên đăng nhập đã tồn tại")

    # ⭐ Email rỗng → None (để không gây trùng UNIQUE)
    email = admin.email.strip() if admin.email and admin.email.strip() != "" else None

    # check email trùng (chỉ check khi email không rỗng)
    if email:
        if db.query(models.Admin).filter(models.Admin.email == email).first():
            raise HTTPException(status_code=400, detail="Email đã tồn tại")

    new_user = models.Admin(
        full_name=admin.full_name,
        username=admin.username,
        email=email,   # ⭐ email đã được xử lý ở trên
        password=hash_password(admin.password),
        role=admin.role,
        is_active=admin.is_active,
        employee_id=admin.employee_id
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


# ============================================================
# 🟧 CẬP NHẬT USER (hash password nếu đổi)
# ============================================================
@router.put("/{admin_id}", response_model=schemas.AdminOut)
def update_admin(
    admin_id: int,
    updated: schemas.AdminUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin", "manager"]))
):
    user = db.query(models.Admin).filter(models.Admin.id == admin_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

    data = updated.dict(exclude_unset=True)

    # Nếu FE gửi password → hash lại
    if "password" in data and data["password"]:
        data["password"] = hash_password(data["password"])

    # Cập nhật employee_id theo role
    if "role" in data:
        new_role = data["role"]

        if new_role == "employee":
            if "employee_id" not in data or data["employee_id"] is None:
                raise HTTPException(status_code=400, detail="Nhân viên phải có employee_id")
        else:
            # Các role khác → reset employee_id
            data["employee_id"] = None

    # Set lại các field
    for key, value in data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return user


# ============================================================
# 🟥 XÓA USER
# ============================================================
@router.delete("/{admin_id}")
def delete_admin(
    admin_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin"]))
):
    user = db.query(models.Admin).filter(models.Admin.id == admin_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

    db.delete(user)
    db.commit()
    return {"message": "Xóa người dùng thành công"}


# ============================================================
# 🔵 KHÓA / MỞ TÀI KHOẢN
# ============================================================
@router.put("/{admin_id}/active")
def update_active(
    admin_id: int,
    data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin"]))
):
    user = db.query(models.Admin).filter(models.Admin.id == admin_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

    is_active = data.get("is_active")
    if is_active is None:
        raise HTTPException(status_code=400, detail="Thiếu trường is_active")

    user.is_active = is_active
    db.commit()
    db.refresh(user)

    return {"message": "Cập nhật trạng thái thành công"}


# ============================================================
# 🟪 CẬP NHẬT ROLE
# ============================================================
@router.put("/{admin_id}/role")
def update_role(
    admin_id: int,
    data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin"]))
):
    user = db.query(models.Admin).filter(models.Admin.id == admin_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

    role = data.get("role")
    if not role:
        raise HTTPException(status_code=400, detail="Thiếu role")

    # Nếu đổi sang employee → phải có employee_id
    if role == "employee":
        if data.get("employee_id") is None:
            raise HTTPException(status_code=400, detail="Nhân viên phải có employee_id")
        user.employee_id = data["employee_id"]
    else:
        # Role khác → bỏ employee_id
        user.employee_id = None

    user.role = role
    db.commit()
    db.refresh(user)

    return {"message": f"Đã cập nhật quyền thành '{role}'"}
