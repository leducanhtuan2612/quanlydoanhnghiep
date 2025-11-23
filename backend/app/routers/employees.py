from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import os
from .. import models, schemas, database
from app.utils.notify import push_notify   # ⭐ THÊM DÒNG NÀY

router = APIRouter(prefix="/employees", tags=["Employees"])


# =====================================================
# 📌 GET ALL EMPLOYEES
# =====================================================
@router.get("/", response_model=list[schemas.EmployeeOut])
def get_all(db: Session = Depends(database.get_db)):
    return db.query(models.Employee).all()


# =====================================================
# 📌 GET ONE EMPLOYEE
# =====================================================
@router.get("/{id}", response_model=schemas.EmployeeOut)
def get_one(id: int, db: Session = Depends(database.get_db)):
    emp = db.query(models.Employee).filter(models.Employee.id == id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")
    return emp


# =====================================================
# 📌 CREATE EMPLOYEE  ⭐ THÊM THÔNG BÁO
# =====================================================
@router.post("/", response_model=schemas.EmployeeOut)
def create(item: schemas.EmployeeCreate, db: Session = Depends(database.get_db)):
    new_emp = models.Employee(**item.model_dump())
    db.add(new_emp)
    db.commit()
    db.refresh(new_emp)

    # ⭐ THÔNG BÁO TẠO NHÂN VIÊN
    push_notify(db, f"Nhân viên {new_emp.name} đã được tạo")

    return new_emp


# =====================================================
# 📌 UPDATE (PUT) – CẬP NHẬT TOÀN BỘ  ⭐ THÊM THÔNG BÁO
# =====================================================
@router.put("/{id}", response_model=schemas.EmployeeOut)
def update(id: int, item: schemas.EmployeeUpdate, db: Session = Depends(database.get_db)):
    emp = db.query(models.Employee).filter(models.Employee.id == id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")

    update_data = item.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(emp, key, value)

    db.commit()
    db.refresh(emp)

    # ⭐ THÔNG BÁO CẬP NHẬT
    push_notify(db, f"Thông tin nhân viên {emp.name} đã được cập nhật")

    return emp


# =====================================================
# 📌 PATCH – CẬP NHẬT TỪNG PHẦN
# =====================================================
@router.patch("/{id}", response_model=schemas.EmployeeOut)
def partial_update(id: int, item: schemas.EmployeePatch, db: Session = Depends(database.get_db)):
    emp = db.query(models.Employee).filter(models.Employee.id == id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")

    patch_data = item.model_dump(exclude_unset=True)
    for key, value in patch_data.items():
        setattr(emp, key, value)

    db.commit()
    db.refresh(emp)

    # ⭐ THÊM THÔNG BÁO CHO PATCH NẾU MUỐN
    push_notify(db, f"Nhân viên {emp.name} đã được cập nhật một phần")

    return emp


# =====================================================
# 📌 DELETE EMPLOYEE  ⭐ THÊM THÔNG BÁO
# =====================================================
@router.delete("/{id}")
def delete(id: int, db: Session = Depends(database.get_db)):
    emp = db.query(models.Employee).filter(models.Employee.id == id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")

    name = emp.name

    db.delete(emp)
    db.commit()

    # ⭐ THÔNG BÁO XÓA
    push_notify(db, f"Nhân viên {name} đã bị xóa khỏi hệ thống")

    return {"message": "Deleted successfully"}


# =====================================================
# 📌 UPLOAD AVATAR (giữ nguyên, có thể thêm notify)
# =====================================================
@router.post("/upload-avatar/{id}", response_model=dict)
async def upload_avatar(id: int, file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    emp = db.query(models.Employee).filter(models.Employee.id == id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")

    upload_dir = "static/avatars"
    os.makedirs(upload_dir, exist_ok=True)

    ext = file.filename.split(".")[-1]
    filename = f"emp_{id}.{ext}"
    filepath = os.path.join(upload_dir, filename)

    with open(filepath, "wb") as buffer:
        buffer.write(await file.read())

    emp.avatar = f"/static/avatars/{filename}"
    db.commit()
    db.refresh(emp)

    # ⭐ THÔNG BÁO CẬP NHẬT ẢNH ĐẠI DIỆN
    push_notify(db, f"Nhân viên {emp.name} đã cập nhật ảnh đại diện")

    return {"avatar": emp.avatar}
