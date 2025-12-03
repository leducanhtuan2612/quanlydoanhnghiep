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
    Task,
)

router = APIRouter(prefix="/employee-home", tags=["Employee Home"])


@router.get("/{employee_id}")
def get_employee_home(employee_id: int, db: Session = Depends(get_db)):
    today = date.today()

    # =========================
    # 1. NHÂN VIÊN
    # =========================
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(404, "Không tìm thấy nhân viên")

    # =========================
    # 2. CHẤM CÔNG HÔM NAY
    # =========================
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

    # =========================
    # 3. LỊCH SỬ CHẤM CÔNG (7 NGÀY)
    # =========================
    history_rows = (
        db.query(Attendance)
        .filter(Attendance.employee_id == employee_id)
        .order_by(Attendance.date.desc())
        .limit(7)
        .all()
    )

    attendance_history = [
        {"date": str(r.date), "status": r.status} for r in history_rows
    ]

    # =========================
    # 4. KPI THÁNG NÀY
    # =========================
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

    # =========================
    # 5. PHÚC LỢI ĐÃ ĐĂNG KÝ
    # =========================
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
        p = db.query(BenefitProgram).filter(BenefitProgram.id == r.benefit_id).first()
        if p:
            benefits.append(
                {
                    "id": p.id,
                    "title": p.title,
                    "registration_end": str(p.registration_end),
                    "location": p.location,
                }
            )

    # =========================
    # 6. HỢP ĐỒNG LAO ĐỘNG
    # =========================
    contract_rows = (
        db.query(Contract)
        .filter(Contract.employee_id == employee_id)
        .order_by(Contract.start_date.desc())
        .all()
    )

    contracts = [
        {
            "id": c.id,
            "type": c.contract_type,
            "start": str(c.start_date),
            "end": str(c.end_date) if c.end_date else None,
            "status": c.status,
        }
        for c in contract_rows
    ]

    # =========================
    # 7. THÔNG BÁO MỚI NHẤT
    # =========================
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
            "time": str(n.time),
            "created_at": str(n.created_at),
        }
        for n in notifications_rows
    ]

    # =========================
    # 8. SẢN PHẨM SẮP HẾT (chỉ phòng kho)
    # =========================
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

    # =========================
    # 9. CÔNG VIỆC ĐƯỢC GIAO (TASKS)
    # =========================
    task_rows = (
        db.query(Task)
        .filter(Task.assigned_to_id == employee_id)
        .order_by(Task.deadline.asc().nulls_last())
        .all()
    )

    tasks = [
        {
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "status": t.status,
            "progress": t.progress,
            "priority": t.priority,
            "deadline": str(t.deadline) if t.deadline else None,
        }
        for t in task_rows
    ]

    # ---- TÓM TẮT TASKS ----
    tasks_summary = {
        "total": len(task_rows),
        "todo": len([t for t in task_rows if t.status == "todo"]),
        "in_progress": len([t for t in task_rows if t.status == "in_progress"]),
        "done": len([t for t in task_rows if t.status == "done"]),
    }

    # =========================
    # RETURN FULL PACKAGE
    # =========================
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
        "tasks": tasks,
        "tasks_summary": tasks_summary,
    }
