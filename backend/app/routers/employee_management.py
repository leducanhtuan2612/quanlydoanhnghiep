# app/routers/employee_management.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app import models, database

router = APIRouter(
    prefix="/employee-management",
    tags=["Employee Management"],
)

get_db = database.get_db

print("🔥 Employee Management Router Loaded!")


# -------------------------------------------------------
# 1️⃣ CHẤM CÔNG - ATTENDANCE
# -------------------------------------------------------
@router.get("/attendance")
def get_all_attendance(db: Session = Depends(get_db)):
    attendances = db.query(models.Attendance).all()

    return [
        {
            "id": a.id,
            "employee_name": a.employee.name if a.employee else None,
            "date": a.date,
            "check_in": a.check_in,
            "check_out": a.check_out,
            "status": a.status,
        }
        for a in attendances
    ]


# -------------------------------------------------------
# 2️⃣ LƯƠNG - SALARY
# -------------------------------------------------------
@router.get("/salary")
def get_salary(db: Session = Depends(get_db)):
    employees = db.query(models.Employee).all()
    result = []

    for emp in employees:
        base = float(emp.salary_base or 0)
        bonus = 0
        deduction = 0
        total = base + bonus - deduction

        result.append({
            "id": emp.id,
            "employee_name": emp.name,
            "month": "2025-02",
            "base_salary": base,
            "bonus": bonus,
            "deduction": deduction,
            "total": total,
        })

    return result


# -------------------------------------------------------
# 3️⃣ PHÚC LỢI - BENEFITS
# -------------------------------------------------------
@router.get("/benefits")
def get_benefits(db: Session = Depends(get_db)):
    registrations = db.query(models.BenefitRegistration).all()

    return [
        {
            "id": r.id,
            "employee_name": r.employee.name if r.employee else None,
            "title": r.benefit.title if r.benefit else None,
            "start": r.benefit.registration_start if r.benefit else None,
            "end": r.benefit.registration_end if r.benefit else None,
            "status": r.status,
        }
        for r in registrations
    ]


# -------------------------------------------------------
# 4️⃣ HỢP ĐỒNG - CONTRACTS
# -------------------------------------------------------
@router.get("/contracts")
def get_contracts(db: Session = Depends(get_db)):
    contracts = db.query(models.Contract).all()

    return [
        {
            "id": c.id,
            "employee_name": c.employee.name if c.employee else None,
            "contract_type": c.contract_type,
            "start_date": c.start_date,
            "end_date": c.end_date,
            "basic_salary": c.basic_salary,
            "status": c.status,
            "note": c.note,
        }
        for c in contracts
    ]
