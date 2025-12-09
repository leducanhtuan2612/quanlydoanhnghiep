# app/routers/manager.py
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, and_
from sqlalchemy.orm import Session

from app import models, database, schemas

router = APIRouter(prefix="/manager", tags=["Manager"])


# ==========================================================
# 🧾 Pydantic Schemas cho Manager Dashboard
# ==========================================================

class TaskBlock(BaseModel):
    total: int
    todo: int
    in_progress: int
    done: int
    overdue: int


class OrderBlock(BaseModel):
    total: int
    pending: int
    completed: int
    canceled: int


class ManagerStatsOut(BaseModel):
    employees: int
    active_employees: int
    customers: int
    inventory_low: int
    tasks: TaskBlock
    orders: OrderBlock


class DeptItemOut(BaseModel):
    department: Optional[str] = None
    total: int


class RevenueItemOut(BaseModel):
    month: str  # ví dụ "2025-01"
    total: float


# ==========================================================
# 🔌 Dependency DB
# ==========================================================

def get_db():
    db = database.get_db()
    try:
        yield next(db)
    finally:
        try:
            db.close()
        except Exception:
            pass


# ==========================================================
# 1. THỐNG KÊ TỔNG HỢP CHO QUẢN LÝ
# ==========================================================

@router.get("/stats", response_model=ManagerStatsOut)
def get_manager_stats(db: Session = Depends(get_db)):
    today = date.today()

    # Nhân viên
    employees = db.query(func.count(models.Employee.id)).scalar() or 0
    active_employees = (
        db.query(func.count(models.Employee.id))
        .filter(models.Employee.active.is_(True))
        .scalar()
        or 0
    )

    # Khách hàng
    customers = db.query(func.count(models.Customer.id)).scalar() or 0

    # Sản phẩm sắp hết (ví dụ: tồn < 10)
    inventory_low = (
        db.query(func.count(models.Inventory.id))
        .filter(models.Inventory.quantity < 10)
        .scalar()
        or 0
    )

    # Công việc
    total_tasks = db.query(func.count(models.Task.id)).scalar() or 0
    todo = (
        db.query(func.count(models.Task.id))
        .filter(models.Task.status == "todo")
        .scalar()
        or 0
    )
    in_progress = (
        db.query(func.count(models.Task.id))
        .filter(models.Task.status == "in_progress")
        .scalar()
        or 0
    )
    done = (
        db.query(func.count(models.Task.id))
        .filter(models.Task.status == "done")
        .scalar()
        or 0
    )
    overdue = (
        db.query(func.count(models.Task.id))
        .filter(
            models.Task.deadline.isnot(None),
            models.Task.deadline < today,
            models.Task.status != "done",
        )
        .scalar()
        or 0
    )

    # Đơn hàng
    total_orders = db.query(func.count(models.Order.id)).scalar() or 0
    pending = (
        db.query(func.count(models.Order.id))
        .filter(models.Order.status.in_(["Đang xử lý", "pending"]))
        .scalar()
        or 0
    )
    completed = (
        db.query(func.count(models.Order.id))
        .filter(models.Order.status.in_(["Hoàn thành", "completed"]))
        .scalar()
        or 0
    )
    canceled = (
        db.query(func.count(models.Order.id))
        .filter(models.Order.status.in_(["Đã hủy", "canceled"]))
        .scalar()
        or 0
    )

    return ManagerStatsOut(
        employees=employees,
        active_employees=active_employees,
        customers=customers,
        inventory_low=inventory_low,
        tasks=TaskBlock(
            total=total_tasks,
            todo=todo,
            in_progress=in_progress,
            done=done,
            overdue=overdue,
        ),
        orders=OrderBlock(
            total=total_orders,
            pending=pending,
            completed=completed,
            canceled=canceled,
        ),
    )


# ==========================================================
# 2. NHÂN VIÊN THEO PHÒNG BAN
# ==========================================================

@router.get(
    "/employees-by-department",
    response_model=List[DeptItemOut],
)
def get_employees_by_department(db: Session = Depends(get_db)):
    rows = (
        db.query(
            models.Employee.department,
            func.count(models.Employee.id).label("total"),
        )
        .group_by(models.Employee.department)
        .all()
    )

    return [
        DeptItemOut(department=dept, total=total or 0) for dept, total in rows
    ]


# ==========================================================
# 3. DOANH THU THEO THÁNG
#    (PostgreSQL: dùng to_char(date, 'YYYY-MM'))
# ==========================================================

@router.get(
    "/revenue-monthly",
    response_model=List[RevenueItemOut],
)
def get_revenue_monthly(db: Session = Depends(get_db)):
    # Với PostgreSQL
    month_expr = func.to_char(models.Order.date, "YYYY-MM").label("month")

    rows = (
        db.query(
            month_expr,
            func.coalesce(func.sum(models.Order.amount), 0).label("total"),
        )
        .group_by(month_expr)
        .order_by(month_expr)
        .all()
    )

    return [RevenueItemOut(month=m, total=float(t or 0)) for m, t in rows]


# ==========================================================
# 4. TÓM TẮT CÔNG VIỆC
# ==========================================================

@router.get("/task-summary", response_model=TaskBlock)
def get_task_summary(db: Session = Depends(get_db)):
    today = date.today()

    total_tasks = db.query(func.count(models.Task.id)).scalar() or 0
    todo = (
        db.query(func.count(models.Task.id))
        .filter(models.Task.status == "todo")
        .scalar()
        or 0
    )
    in_progress = (
        db.query(func.count(models.Task.id))
        .filter(models.Task.status == "in_progress")
        .scalar()
        or 0
    )
    done = (
        db.query(func.count(models.Task.id))
        .filter(models.Task.status == "done")
        .scalar()
        or 0
    )
    overdue = (
        db.query(func.count(models.Task.id))
        .filter(
            models.Task.deadline.isnot(None),
            models.Task.deadline < today,
            models.Task.status != "done",
        )
        .scalar()
        or 0
    )

    return TaskBlock(
        total=total_tasks,
        todo=todo,
        in_progress=in_progress,
        done=done,
        overdue=overdue,
    )


# ==========================================================
# 5. DANH SÁCH NHÂN VIÊN GẦN NHẤT
# ==========================================================

@router.get(
    "/employees",
    response_model=List[schemas.EmployeeOut],
)
def get_latest_employees(db: Session = Depends(get_db)):
    employees = (
        db.query(models.Employee)
        .order_by(models.Employee.created_at.desc())
        .limit(10)
        .all()
    )
    return employees


# ==========================================================
# 6. DANH SÁCH TASK GẦN NHẤT
# ==========================================================

@router.get(
    "/recent-tasks",
    response_model=List[schemas.TaskOut],
)
def get_recent_tasks(db: Session = Depends(get_db)):
    tasks = (
        db.query(models.Task)
        .order_by(models.Task.created_at.desc())
        .limit(10)
        .all()
    )
    return tasks
