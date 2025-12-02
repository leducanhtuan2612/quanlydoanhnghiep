# app/routers/salary.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import extract

from app.database import get_db
from app.models import Employee, Attendance

import openpyxl
from io import BytesIO
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/salary", tags=["Salary"])

# ==========================
# CẤU HÌNH LƯƠNG CHUNG
# ==========================
BASE_SALARY = 7000000     # 7 triệu
WORKING_DAYS = 26
LATE_PENALTY = 50000
EARLY_PENALTY = 50000


# ======================================================
# ⭐ 1) API LẤY LƯƠNG TẤT CẢ NHÂN VIÊN
# ======================================================
@router.get("/all")
def salary_all(year: int, month: int, db: Session = Depends(get_db)):
    employees = db.query(Employee).all()
    result = []

    for emp in employees:
        salary = calc_salary(emp.id, year, month, db)

        result.append({
            "employee_id": emp.id,
            "employee_name": emp.name,
            "month": salary["month_string"],
            "base_salary": salary["base_salary"],
            "daily_salary": salary["daily_salary"],
            "total_days": salary["total_days"],
            "late": salary["late"],
            "early": salary["early"],
            "penalty": salary["penalty"],
            "final_salary": salary["final_salary"],
        })

    return result


# ======================================================
# ⭐ 2) TÍNH LƯƠNG 1 NHÂN VIÊN
# ======================================================
@router.get("/{employee_id}")
def calc_salary(employee_id: int, year: int, month: int, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Nhân viên không tồn tại")

    # Mặc định demo: lương cơ bản chung cho toàn bộ nhân viên
    base_salary = BASE_SALARY
    daily_salary = base_salary / WORKING_DAYS

    # Lấy chấm công của tháng
    records = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == employee_id,
            extract("year", Attendance.date) == year,
            extract("month", Attendance.date) == month,
        )
        .all()
    )

    total_days = 0
    late_count = 0
    early_count = 0

    for r in records:
        if r.check_in and r.check_out:
            total_days += 1

        if r.status == "Late":
            late_count += 1
        elif r.status == "Early":
            early_count += 1

    salary_days = total_days * daily_salary
    penalty = late_count * LATE_PENALTY + early_count * EARLY_PENALTY
    final_salary = max(salary_days - penalty, 0)

    return {
        "employee_id": employee_id,
        "employee_name": emp.name,
        "department": emp.department,
        "position": emp.position,
        "year": year,
        "month": month,
        "month_string": f"{year}-{month:02d}",
        "base_salary": int(base_salary),
        "daily_salary": int(daily_salary),
        "total_days": total_days,
        "late": late_count,
        "early": early_count,
        "penalty": int(penalty),
        "final_salary": int(final_salary),
    }


# ======================================================
# ⭐ 3) XUẤT EXCEL PHIẾU LƯƠNG
# ======================================================
@router.get("/export/{employee_id}")
def export_salary(employee_id: int, year: int, month: int, db: Session = Depends(get_db)):
    salary = calc_salary(employee_id, year, month, db)

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Salary"

    ws.append(["THÔNG TIN NHÂN VIÊN", ""])
    ws.append(["Họ tên", salary["employee_name"]])
    ws.append(["Phòng ban", salary["department"] or ""])
    ws.append(["Chức vụ", salary["position"] or ""])
    ws.append(["Tháng", salary["month_string"]])
    ws.append([])

    ws.append(["THÔNG TIN LƯƠNG", ""])
    ws.append(["Lương cơ bản", salary["base_salary"]])
    ws.append(["Lương mỗi ngày", salary["daily_salary"]])
    ws.append(["Ngày công", salary["total_days"]])
    ws.append(["Đi muộn", salary["late"]])
    ws.append(["Về sớm", salary["early"]])
    ws.append(["Tiền phạt", salary["penalty"]])
    ws.append(["Lương thực lãnh", salary["final_salary"]])

    # Xuất file
    stream = BytesIO()
    wb.save(stream)
    stream.seek(0)

    filename = f"salary_{employee_id}_{year}_{month}.xlsx"

    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
