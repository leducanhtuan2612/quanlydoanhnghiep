from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.database import get_db
from app.models import BenefitProgram, BenefitRegistration
from app.schemas import (
    BenefitProgramOut,
    BenefitProgramCreate,
    BenefitProgramUpdate,
    BenefitRegistrationOut,
)

router = APIRouter(prefix="/benefits", tags=["Benefits"])


# ==========================
# Danh sách chương trình
# ==========================
@router.get("", response_model=List[BenefitProgramOut])
def list_benefits(employee_id: Optional[int] = None, db: Session = Depends(get_db)):
    programs = db.query(BenefitProgram).order_by(BenefitProgram.created_at.desc()).all()

    # Lấy danh sách đã đăng ký
    registered_ids = set()
    if employee_id:
        regs = (
            db.query(BenefitRegistration)
            .filter(
                BenefitRegistration.employee_id == employee_id,
                BenefitRegistration.status == "registered",
            )
            .all()
        )
        registered_ids = {r.benefit_id for r in regs}

    result = []
    for p in programs:
        result.append(
            BenefitProgramOut(
                id=p.id,
                title=p.title,
                description=p.description,
                registration_start=p.registration_start,
                registration_end=p.registration_end,
                location=p.location,
                status=p.status,
                created_at=p.created_at,
                updated_at=p.updated_at,
                is_registered=p.id in registered_ids,
            )
        )
    return result


# ==========================
# Tạo chương trình
# ==========================
@router.post("", response_model=BenefitProgramOut)
def create_benefit(data: BenefitProgramCreate, db: Session = Depends(get_db)):
    program = BenefitProgram(**data.dict())
    db.add(program)
    db.commit()
    db.refresh(program)

    return BenefitProgramOut(
        **program.__dict__,
        is_registered=False
    )


# ==========================
# Cập nhật chương trình
# ==========================
@router.put("/{benefit_id}", response_model=BenefitProgramOut)
def update_benefit(benefit_id: int, data: BenefitProgramUpdate, db: Session = Depends(get_db)):
    program = db.query(BenefitProgram).filter(BenefitProgram.id == benefit_id).first()
    if not program:
        raise HTTPException(404, "Không tìm thấy chương trình phúc lợi")

    for field, value in data.dict(exclude_unset=True).items():
        setattr(program, field, value)

    db.commit()
    db.refresh(program)

    return BenefitProgramOut(
        **program.__dict__,
        is_registered=False
    )


# ==========================
# Xoá chương trình
# ==========================
@router.delete("/{benefit_id}")
def delete_benefit(benefit_id: int, db: Session = Depends(get_db)):
    program = db.query(BenefitProgram).filter(BenefitProgram.id == benefit_id).first()
    if not program:
        raise HTTPException(404, "Không tìm thấy chương trình")

    db.delete(program)
    db.commit()
    return {"message": "Đã xoá chương trình phúc lợi"}


# ==========================
# Nhân viên đăng ký
# ==========================
@router.post("/{benefit_id}/register", response_model=BenefitRegistrationOut)
def register_benefit(benefit_id: int, employee_id: int, db: Session = Depends(get_db)):
    program = db.query(BenefitProgram).filter(BenefitProgram.id == benefit_id).first()
    if not program:
        raise HTTPException(404, "Không tìm thấy chương trình phúc lợi")

    today = date.today()

    # kiểm tra thời gian
    if program.registration_start and today < program.registration_start:
        raise HTTPException(400, "Chưa đến thời gian đăng ký")

    if program.registration_end and today > program.registration_end:
        raise HTTPException(400, "Đã hết hạn đăng ký")

    # kiểm tra đăng ký trùng
    existing = (
        db.query(BenefitRegistration)
        .filter(
            BenefitRegistration.employee_id == employee_id,
            BenefitRegistration.benefit_id == benefit_id,
            BenefitRegistration.status == "registered",
        )
        .first()
    )
    if existing:
        raise HTTPException(400, "Bạn đã đăng ký chương trình này rồi")

    reg = BenefitRegistration(
        benefit_id=benefit_id,
        employee_id=employee_id,
        status="registered",
    )
    db.add(reg)
    db.commit()
    db.refresh(reg)
    return reg


# ==========================
# Nhân viên hủy đăng ký
# ==========================
@router.delete("/{benefit_id}/register")
def cancel_registration(benefit_id: int, employee_id: int, db: Session = Depends(get_db)):
    reg = (
        db.query(BenefitRegistration)
        .filter(
            BenefitRegistration.benefit_id == benefit_id,
            BenefitRegistration.employee_id == employee_id,
            BenefitRegistration.status == "registered",
        )
        .first()
    )
    if not reg:
        raise HTTPException(404, "Bạn chưa đăng ký chương trình này")

    reg.status = "cancelled"
    db.commit()
    return {"message": "Đã hủy đăng ký thành công"}
