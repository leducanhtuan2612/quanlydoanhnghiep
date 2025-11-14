from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import os
from .. import models, schemas, database

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
# 📌 CREATE EMPLOYEE
# =====================================================
@router.post("/", response_model=schemas.EmployeeOut)
def create(item: schemas.EmployeeCreate, db: Session = Depends(database.get_db)):
    new_emp = models.Employee(**item.model_dump())
    db.add(new_emp)
    db.commit()
    db.refresh(new_emp)
    return new_emp


# =====================================================
# 📌 UPDATE (PUT) – CẬP NHẬT TOÀN BỘ
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
    return emp


# =====================================================
# 📌 DELETE EMPLOYEE
# =====================================================
@router.delete("/{id}")
def delete(id: int, db: Session = Depends(database.get_db)):
    emp = db.query(models.Employee).filter(models.Employee.id == id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")

    db.delete(emp)
    db.commit()
    return {"message": "Deleted successfully"}


# =====================================================
# 📌 UPLOAD AVATAR
# =====================================================
@router.post("/upload-avatar/{id}", response_model=dict)
async def upload_avatar(id: int, file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    emp = db.query(models.Employee).filter(models.Employee.id == id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")

    # Folder chứa ảnh
    upload_dir = "static/avatars"
    os.makedirs(upload_dir, exist_ok=True)

    # Tên file cuối
    ext = file.filename.split(".")[-1]
    filename = f"emp_{id}.{ext}"
    filepath = os.path.join(upload_dir, filename)

    # Lưu file
    with open(filepath, "wb") as buffer:
        buffer.write(await file.read())

    # Lưu path vào DB
    emp.avatar = f"/static/avatars/{filename}"
    db.commit()
    db.refresh(emp)

    return {"avatar": emp.avatar}
