from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app import models, schemas, database
import shutil
import uuid
import os

router = APIRouter(prefix="/employee-profiles", tags=["Employee Profiles"])
get_db = database.get_db


# ==========================================================
# 📌 GET ALL PROFILES
# ==========================================================
@router.get("/", response_model=list[schemas.EmployeeProfileOut])
def get_all(db: Session = Depends(get_db)):
    return db.query(models.EmployeeProfile).all()


# ==========================================================
# 📌 CREATE PROFILE
# ==========================================================
@router.post("/", response_model=schemas.EmployeeProfileOut)
def create(profile: schemas.EmployeeProfileCreate, db: Session = Depends(get_db)):
    new_profile = models.EmployeeProfile(**profile.dict())
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    return new_profile


# ==========================================================
# 📌 GET ONE PROFILE
# ==========================================================
@router.get("/{id}", response_model=schemas.EmployeeProfileOut)
def get_one(id: int, db: Session = Depends(get_db)):
    profile = (
        db.query(models.EmployeeProfile)
        .filter(models.EmployeeProfile.id == id)
        .first()
    )
    if not profile:
        raise HTTPException(404, "Employee profile not found")
    return profile


# ==========================================================
# 📌 UPDATE PROFILE
# ==========================================================
@router.put("/{id}", response_model=schemas.EmployeeProfileOut)
def update(id: int, data: schemas.EmployeeProfileUpdate, db: Session = Depends(get_db)):
    profile = (
        db.query(models.EmployeeProfile)
        .filter(models.EmployeeProfile.id == id)
        .first()
    )

    if not profile:
        raise HTTPException(404, "Employee profile not found")

    for k, v in data.dict(exclude_unset=True).items():
        setattr(profile, k, v)

    db.commit()
    db.refresh(profile)
    return profile


# ==========================================================
# 📌 UPLOAD AVATAR (FULL FIXED)
# ==========================================================
@router.post("/{id}/avatar")
def upload_avatar(
    id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    profile = (
        db.query(models.EmployeeProfile)
        .filter(models.EmployeeProfile.id == id)
        .first()
    )

    if not profile:
        raise HTTPException(404, "Employee profile not found")

    # Tạo thư mục nếu chưa có
    os.makedirs("static/avatars", exist_ok=True)

    # Tạo tên file ngẫu nhiên
    ext = file.filename.split(".")[-1].lower()
    avatar_name = f"{uuid.uuid4()}.{ext}"
    file_path = f"static/avatars/{avatar_name}"

    # Lưu file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Lưu đường dẫn vào DB
    profile.avatar = f"/static/avatars/{avatar_name}"
    db.commit()
    db.refresh(profile)

    return {"avatar": profile.avatar}
