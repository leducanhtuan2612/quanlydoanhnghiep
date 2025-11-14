from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app import models, schemas, database
import shutil
import uuid

router = APIRouter(prefix="/employee-profiles", tags=["Employee Profiles"])
get_db = database.get_db

# 📌 Lấy danh sách
@router.get("/", response_model=list[schemas.EmployeeProfileOut])
def get_all(db: Session = Depends(get_db)):
    return db.query(models.EmployeeProfile).all()

# 📌 Tạo mới hồ sơ
@router.post("/", response_model=schemas.EmployeeProfileOut)
def create(profile: schemas.EmployeeProfileCreate, db: Session = Depends(get_db)):
    new_profile = models.EmployeeProfile(**profile.dict())
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    return new_profile

# 📌 Lấy chi tiết
@router.get("/{id}", response_model=schemas.EmployeeProfileOut)
def get_one(id: int, db: Session = Depends(get_db)):
    profile = db.query(models.EmployeeProfile).filter(models.EmployeeProfile.id == id).first()
    if not profile:
        raise HTTPException(404, "Employee profile not found")
    return profile

# 📌 Cập nhật
@router.put("/{id}", response_model=schemas.EmployeeProfileOut)
def update(id: int, data: schemas.EmployeeProfileUpdate, db: Session = Depends(get_db)):
    profile = db.query(models.EmployeeProfile).filter(models.EmployeeProfile.id == id).first()
    if not profile:
        raise HTTPException(404, "Employee profile not found")

    for k, v in data.dict(exclude_unset=True).items():
        setattr(profile, k, v)

    db.commit()
    db.refresh(profile)
    return profile

# 📌 Upload avatar
@router.post("/{id}/avatar")
def upload_avatar(id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    ext = file.filename.split(".")[-1]
    avatar_name = f"{uuid.uuid4()}.{ext}"
    path = f"static/avatars/{avatar_name}"

    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    profile = db.query(models.EmployeeProfile).filter(models.EmployeeProfile.id == id).first()
    profile.avatar = avatar_name
    db.commit()

    return {"avatar": avatar_name}
