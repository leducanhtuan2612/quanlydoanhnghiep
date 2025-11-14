from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas, database
from typing import List

router = APIRouter(prefix="/admins", tags=["Admins"])
get_db = database.get_db


# 🟩 Lấy tất cả admin
@router.get("/", response_model=List[schemas.AdminOut])
def get_admins(db: Session = Depends(get_db)):
    return db.query(models.Admin).all()


# 🟦 Lấy admin theo ID
@router.get("/{admin_id}", response_model=schemas.AdminOut)
def get_admin(admin_id: int, db: Session = Depends(get_db)):
    user = db.query(models.Admin).filter(models.Admin.id == admin_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    return user


# 🟨 Tạo admin mới
@router.post("/", response_model=schemas.AdminOut)
def create_admin(admin: schemas.AdminCreate, db: Session = Depends(get_db)):
    new_user = models.Admin(**admin.dict())
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


# 🟧 Cập nhật admin
@router.put("/{admin_id}", response_model=schemas.AdminOut)
def update_admin(admin_id: int, updated: schemas.AdminUpdate, db: Session = Depends(get_db)):
    user = db.query(models.Admin).filter(models.Admin.id == admin_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

    for key, value in updated.dict(exclude_unset=True).items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return user


# 🟥 Xóa admin
@router.delete("/{admin_id}")
def delete_admin(admin_id: int, db: Session = Depends(get_db)):
    user = db.query(models.Admin).filter(models.Admin.id == admin_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    db.delete(user)
    db.commit()
    return {"message": "Xóa người dùng thành công"}
# 🟪 Cập nhật quyền (role) người dùng
@router.put("/{admin_id}/role")
def update_role(admin_id: int, role: str, db: Session = Depends(get_db)):
    user = db.query(models.Admin).filter(models.Admin.id == admin_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    user.role = role
    db.commit()
    db.refresh(user)
    return {"message": f"Đã cập nhật quyền thành {role}"}
from fastapi import Body
# 🟦 Cập nhật trạng thái hoạt động
@router.put("/{admin_id}/active")
def update_active(admin_id: int, is_active: bool, db: Session = Depends(get_db)):
    user = db.query(models.Admin).filter(models.Admin.id == admin_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    user.is_active = is_active
    db.commit()
    db.refresh(user)
    return {"message": f"Trạng thái người dùng đã được cập nhật."}


# 🟧 Cập nhật quyền (role)
@router.put("/{admin_id}/role")
def update_role(admin_id: int, role: str, db: Session = Depends(get_db)):
    user = db.query(models.Admin).filter(models.Admin.id == admin_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    user.role = role
    db.commit()
    db.refresh(user)
    return {"message": "Cập nhật quyền thành công"}
