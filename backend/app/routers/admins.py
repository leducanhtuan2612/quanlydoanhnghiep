from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas, database
from app.core.permissions import require_role   # middleware kiểm tra quyền

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
# 🟦 LẤY 1 USER THEO ID (ADMIN + MANAGER)
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
# 🟨 TẠO USER (CHỈ ADMIN)
# ============================================================
@router.post("/", response_model=schemas.AdminOut)
def create_admin(
    admin: schemas.AdminCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin"]))
):

    new_user = models.Admin(**admin.dict())
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


# ============================================================
# 🟧 CẬP NHẬT USER (ADMIN + MANAGER)
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

    for key, value in updated.dict(exclude_unset=True).items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return user


# ============================================================
# 🟥 XÓA USER (CHỈ ADMIN)
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
# 🔵 KHÓA / MỞ TÀI KHOẢN (CHỈ ADMIN)
# FE gửi JSON: { "is_active": true/false }
# ============================================================
@router.put("/{admin_id}/active")
def update_active(
    admin_id: int,
    data: dict = Body(...),   # 👈 Nhận JSON body đúng chuẩn FE
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
# 🟪 CẬP NHẬT ROLE (CHỈ ADMIN)
# FE gửi JSON: { "role": "admin/manager/user" }
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

    user.role = role
    db.commit()
    db.refresh(user)

    return {"message": f"Đã cập nhật quyền thành '{role}'"}
