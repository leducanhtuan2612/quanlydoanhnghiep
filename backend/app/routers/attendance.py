# app/routers/attendance.py

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import extract
from datetime import date, datetime, time
from io import BytesIO
from typing import List

from app.database import get_db
from app.models import Employee, Attendance
from app.schemas import AttendanceOut
import openpyxl

router = APIRouter(prefix="/attendance", tags=["Attendance"])

# ======================
# CẤU HÌNH GIỜ LÀM VIỆC
# ======================
WORK_LATE_LIMIT = time(8, 15)
WORK_EARLY_LIMIT = time(16, 30)


def calculate_status(check_in: time | None, check_out: time | None) -> str:
    """Tính trạng thái theo giờ vào/ra"""
    if check_in and check_in > WORK_LATE_LIMIT:
        return "Late"
    if check_out and check_out < WORK_EARLY_LIMIT:
        return "Early"
    return "On time"


# ================================
# 📌 Lấy chấm công theo ngày
# /attendance?employee_id=1&date=2025-01-01
# ================================
@router.get("", response_model=List[AttendanceOut])
def get_attendance(
    employee_id: int = Query(...),
    date_value: date = Query(..., alias="date"),
    db: Session = Depends(get_db),
):
    records = (
        db.query(Attendance)
        .filter(Attendance.employee_id == employee_id, Attendance.date == date_value)
        .all()
    )

    return [
        AttendanceOut(
            id=r.id,
            employee_name=r.employee.name,
            date=r.date,
            check_in=r.check_in,
            check_out=r.check_out,
            status=r.status,
        )
        for r in records
    ]


# ================================
# 📌 Check-in cho NGÀY BẤT KỲ
# ================================
@router.post("/{employee_id}/check-in", response_model=AttendanceOut)
def check_in(
    employee_id: int,
    date_value: date = Query(..., alias="date"),
    db: Session = Depends(get_db),
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(404, "Nhân viên không tồn tại")

    now = datetime.now().time()

    record = (
        db.query(Attendance)
        .filter(Attendance.employee_id == employee_id, Attendance.date == date_value)
        .first()
    )

    if not record:
        record = Attendance(
            employee_id=employee_id,
            date=date_value,
            check_in=now,
        )
        db.add(record)
    else:
        record.check_in = now

    record.status = calculate_status(record.check_in, record.check_out)

    db.commit()
    db.refresh(record)

    return AttendanceOut(
        id=record.id,
        employee_name=emp.name,
        date=record.date,
        check_in=record.check_in,
        check_out=record.check_out,
        status=record.status,
    )


# ================================
# 📌 Check-out cho NGÀY BẤT KỲ
# ================================
@router.post("/{employee_id}/check-out", response_model=AttendanceOut)
def check_out(
    employee_id: int,
    date_value: date = Query(..., alias="date"),
    db: Session = Depends(get_db),
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(404, "Nhân viên không tồn tại")

    record = (
        db.query(Attendance)
        .filter(Attendance.employee_id == employee_id, Attendance.date == date_value)
        .first()
    )

    if not record:
        raise HTTPException(400, "Chưa check-in trong ngày này")

    record.check_out = datetime.now().time()
    record.status = calculate_status(record.check_in, record.check_out)

    db.commit()
    db.refresh(record)

    return AttendanceOut(
        id=record.id,
        employee_name=emp.name,
        date=record.date,
        check_in=record.check_in,
        check_out=record.check_out,
        status=record.status,
    )


# ================================
# 📌 Admin UPDATE giờ vào/ra
# ================================
@router.put("/update/{attendance_id}")
def update_attendance(
    attendance_id: int,
    data: dict,
    db: Session = Depends(get_db),
):
    record = db.query(Attendance).filter(Attendance.id == attendance_id).first()

    if not record:
        raise HTTPException(404, "Không tìm thấy bản ghi để sửa")

    if data.get("check_in"):
        record.check_in = datetime.strptime(data["check_in"], "%H:%M").time()

    if data.get("check_out"):
        record.check_out = datetime.strptime(data["check_out"], "%H:%M").time()

    record.status = calculate_status(record.check_in, record.check_out)

    db.commit()
    db.refresh(record)

    return {"message": "Đã cập nhật", "attendance": record.id}


# ================================
# 📌 Admin DELETE bản ghi
# ================================
@router.delete("/delete/{attendance_id}")
def delete_attendance(attendance_id: int, db: Session = Depends(get_db)):
    record = db.query(Attendance).filter(Attendance.id == attendance_id).first()

    if not record:
        raise HTTPException(404, "Không tìm thấy bản ghi để xoá")

    db.delete(record)
    db.commit()

    return {"message": "Xoá thành công"}


# ================================
# 📌 Lấy lịch sử theo tháng
# ================================
@router.get("/monthly/{employee_id}", response_model=List[AttendanceOut])
def get_monthly_attendance(
    employee_id: int, year: int, month: int, db: Session = Depends(get_db)
):
    records = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == employee_id,
            extract("year", Attendance.date) == year,
            extract("month", Attendance.date) == month,
        )
        .order_by(Attendance.date.asc())
        .all()
    )

    return [
        AttendanceOut(
            id=r.id,
            employee_name=r.employee.name,
            date=r.date,
            check_in=r.check_in,
            check_out=r.check_out,
            status=r.status,
        )
        for r in records
    ]


# ================================
# 📌 Export Excel theo tháng
# ================================
@router.get("/export/{employee_id}")
def export_attendance_excel(
    employee_id: int, year: int, month: int, db: Session = Depends(get_db)
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(404, "Nhân viên không tồn tại")

    records = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == employee_id,
            extract("year", Attendance.date) == year,
            extract("month", Attendance.date) == month,
        )
        .order_by(Attendance.date.asc())
        .all()
    )

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Attendance"
    ws.append(["Ngày", "Giờ vào", "Giờ ra", "Trạng thái"])

    for r in records:
        ws.append(
            [
                r.date.strftime("%Y-%m-%d"),
                r.check_in.strftime("%H:%M:%S") if r.check_in else "",
                r.check_out.strftime("%H:%M:%S") if r.check_out else "",
                r.status,
            ]
        )

    stream = BytesIO()
    wb.save(stream)
    stream.seek(0)

    filename = f"attendance_{employee_id}_{year}_{month}.xlsx"

    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
