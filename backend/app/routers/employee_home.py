from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import extract
from datetime import date

from app.database import get_db
from app.models import (
    Employee,
    Attendance,
    BenefitRegistration,
    BenefitProgram,
    Contract,
    Notification,
    Product,
)

router = APIRouter(prefix="/employee-home", tags=["Employee Home"])


@router.get("/{employee_id}")
def get_employee_home(employee_id: int, db: Session = Depends(get_db)):
    today = date.today()

    # 1. Nhân viên
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(404, "Không tìm thấy nhân viên")

    # 2. Chấm công hôm nay
    att_today = (
        db.query(Attendance)
        .filter(Attendance.employee_id == employee_id, Attendance.date == today)
        .first()
    )

    attendance_today = (
        {
            "date": att_today.date,
            "check_in": att_today.check_in,
            "check_out": att_today.check_out,
            "status": att_today.status,
        }
        if att_today
        else None
    )

    # 3. Lịch sử 7 ngày gần nhất
    history_rows = (
        db.query(Attendance)
        .filter(Attendance.employee_id == employee_id)
        .order_by(Attendance.date.desc())
        .limit(7)
        .all()
    )

    attendance_history = [
        {"date": r.date, "status": r.status} for r in history_rows
    ]

    # 4. KPI trong tháng hiện tại
    year, month = today.year, today.month
    month_rows = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == employee_id,
            extract("year", Attendance.date) == year,
            extract("month", Attendance.date) == month,
        )
        .all()
    )

    kpi = {
        "total_days": len(month_rows),
        "late_days": sum(1 for r in month_rows if r.status == "Late"),
        "early_days": sum(1 for r in month_rows if r.status == "Early"),
        "ontime_days": sum(1 for r in month_rows if r.status == "On time"),
    }

    # 5. Phúc lợi đã đăng ký
    regs = (
        db.query(BenefitRegistration)
        .filter(
            BenefitRegistration.employee_id == employee_id,
            BenefitRegistration.status == "registered",
        )
        .all()
    )

    benefits = []
    for r in regs:
        p = (
            db.query(BenefitProgram)
            .filter(BenefitProgram.id == r.benefit_id)
            .first()
        )
        if p:
            benefits.append(
                {
                    "id": p.id,
                    "title": p.title,
                    "registration_end": p.registration_end,
                    "location": p.location,
                }
            )

    # 6. Hợp đồng
    contracts_rows = (
        db.query(Contract)
        .filter(Contract.employee_id == employee_id)
        .order_by(Contract.start_date.desc())
        .all()
    )

    contracts = [
        {
            "id": c.id,
            "type": c.contract_type,
            "start": c.start_date,
            "end": c.end_date,
            "status": c.status,
        }
        for c in contracts_rows
    ]

    # 7. Thông báo mới nhất
    notifications_rows = (
        db.query(Notification)
        .order_by(Notification.created_at.desc())
        .limit(5)
        .all()
    )

    notifications = [
        {
            "id": n.id,
            "title": n.title,
            "time": n.time,
            "created_at": n.created_at,
        }
        for n in notifications_rows
    ]

    # 8. Sản phẩm sắp hết (nếu nhân viên phòng kho)
    low_stock = []
    if emp.department and emp.department.lower() == "kho":
        low_stock_rows = (
            db.query(Product)
            .filter(Product.stock < 5)
            .order_by(Product.stock.asc())
            .limit(5)
            .all()
        )
        low_stock = [
            {"id": p.id, "name": p.name, "stock": p.stock}
            for p in low_stock_rows
        ]

    return {
        "employee": {
            "id": emp.id,
            "name": emp.name,
            "position": emp.position,
            "department": emp.department,
            "avatar": emp.avatar,
        },
        "attendance_today": attendance_today,
        "attendance_history": attendance_history,
        "kpi": kpi,
        "benefits": benefits,
        "contracts": contracts,
        "notifications": notifications,
        "low_stock": low_stock,
    }
