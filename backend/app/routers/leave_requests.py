from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, date

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/leave-requests", tags=["Nghỉ phép"])

# ==========================
# HẰNG SỐ NGHIỆP VỤ (TIẾNG VIỆT)
# ==========================
LEAVE_TYPES = {"hàng năm", "ốm", "không lương"}
STATUSES = {"đang chờ xử lý", "đã duyệt", "bị từ chối", "đã hủy"}


# ==========================
# VALIDATE TẠO ĐƠN
# ==========================
def _validate_create(data: schemas.LeaveRequestCreate):
    if data.leave_type not in LEAVE_TYPES:
        raise HTTPException(
            400,
            "Loại nghỉ không hợp lệ (hàng năm / ốm / không lương)",
        )

    if data.end_date < data.start_date:
        raise HTTPException(
            400,
            "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu",
        )


# ==========================
# TẠO ĐƠN NGHỈ
# ==========================
@router.post("/", response_model=schemas.LeaveRequestOut)
def create_leave(
    data: schemas.LeaveRequestCreate,
    db: Session = Depends(get_db),
):
    _validate_create(data)

    # ❗ Kiểm tra trùng ngày với đơn đang chờ hoặc đã duyệt
    overlap = (
        db.query(models.LeaveRequest)
        .filter(
            models.LeaveRequest.employee_id == data.employee_id,
            models.LeaveRequest.status.in_(
                ["đang chờ xử lý", "đã duyệt"]
            ),
            models.LeaveRequest.start_date <= data.end_date,
            models.LeaveRequest.end_date >= data.start_date,
        )
        .first()
    )

    if overlap:
        raise HTTPException(
            400,
            "Khoảng thời gian xin nghỉ bị trùng với đơn khác đang chờ xử lý hoặc đã được duyệt",
        )

    leave = models.LeaveRequest(
        employee_id=data.employee_id,
        leave_type=data.leave_type,
        start_date=data.start_date,
        end_date=data.end_date,
        reason=data.reason,
        status="đang chờ xử lý",
    )

    db.add(leave)
    db.commit()
    db.refresh(leave)
    return leave


# ==========================
# NHÂN VIÊN XEM ĐƠN CỦA MÌNH
# ==========================
@router.get(
    "/employee/{employee_id}",
    response_model=list[schemas.LeaveRequestOut],
)
def my_leaves(
    employee_id: int,
    status: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    q = db.query(models.LeaveRequest).filter(
        models.LeaveRequest.employee_id == employee_id
    )

    if status:
        if status not in STATUSES:
            raise HTTPException(400, "Trạng thái không hợp lệ")
        q = q.filter(models.LeaveRequest.status == status)

    return q.order_by(models.LeaveRequest.created_at.desc()).all()


# ==========================
# ADMIN / MANAGER XEM TẤT CẢ ĐƠN
# ==========================
@router.get("/", response_model=list[schemas.LeaveRequestOut])
def list_all(
    status: str | None = Query(default=None),
    employee_id: int | None = Query(default=None),
    from_date: date | None = Query(default=None),
    to_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
):
    q = db.query(models.LeaveRequest)

    if status:
        if status not in STATUSES:
            raise HTTPException(400, "Trạng thái không hợp lệ")
        q = q.filter(models.LeaveRequest.status == status)

    if employee_id:
        q = q.filter(models.LeaveRequest.employee_id == employee_id)

    if from_date:
        q = q.filter(models.LeaveRequest.end_date >= from_date)

    if to_date:
        q = q.filter(models.LeaveRequest.start_date <= to_date)

    return q.order_by(models.LeaveRequest.created_at.desc()).all()


# ==========================
# ADMIN / MANAGER DUYỆT / TỪ CHỐI
# ==========================
@router.put("/{leave_id}/decision", response_model=schemas.LeaveRequestOut)
def decide_leave(
    leave_id: int,
    body: schemas.LeaveDecision,
    db: Session = Depends(get_db),
):
    if body.status not in ["đã duyệt", "bị từ chối"]:
        raise HTTPException(
            400,
            "Trạng thái xử lý chỉ được là: đã duyệt hoặc bị từ chối",
        )

    leave = db.query(models.LeaveRequest).filter(
        models.LeaveRequest.id == leave_id
    ).first()

    if not leave:
        raise HTTPException(404, "Không tìm thấy đơn nghỉ phép")

    if leave.status != "đang chờ xử lý":
        raise HTTPException(
            400,
            "Chỉ có thể xử lý đơn đang chờ xử lý",
        )

    leave.status = body.status
    leave.decision_note = body.decision_note
    leave.approved_by_id = body.approved_by_id
    leave.decided_at = datetime.utcnow()

    db.commit()
    db.refresh(leave)
    return leave


# ==========================
# NHÂN VIÊN HỦY ĐƠN
# ==========================
@router.put("/{leave_id}/cancel", response_model=schemas.LeaveRequestOut)
def cancel_leave(
    leave_id: int,
    employee_id: int = Query(...),
    db: Session = Depends(get_db),
):
    leave = db.query(models.LeaveRequest).filter(
        models.LeaveRequest.id == leave_id
    ).first()

    if not leave:
        raise HTTPException(404, "Không tìm thấy đơn nghỉ phép")

    if leave.employee_id != employee_id:
        raise HTTPException(403, "Bạn không có quyền hủy đơn này")

    if leave.status != "đang chờ xử lý":
        raise HTTPException(
            400,
            "Chỉ được hủy đơn khi đang chờ xử lý",
        )

    leave.status = "đã hủy"
    db.commit()
    db.refresh(leave)
    return leave
