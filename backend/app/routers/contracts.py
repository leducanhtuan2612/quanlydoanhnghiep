# app/routers/contracts.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Contract
from app.schemas import ContractCreate, ContractResponse

router = APIRouter(prefix="/contracts", tags=["contracts"])


@router.get("", response_model=list[ContractResponse])
def get_contracts(employee_id: int, db: Session = Depends(get_db)):
    """
    Lấy danh sách hợp đồng của 1 nhân viên.
    GET /contracts?employee_id=1
    """
    return (
        db.query(Contract)
        .filter(Contract.employee_id == employee_id)
        .order_by(Contract.start_date.desc())
        .all()
    )


@router.post("", response_model=ContractResponse)
def create_contract(payload: ContractCreate, db: Session = Depends(get_db)):
    """
    Tạo hợp đồng mới cho nhân viên.
    LƯƠNG CƠ BẢN = 7.000.000 CỐ ĐỊNH.
    """
    new_c = Contract(
        employee_id=payload.employee_id,
        contract_type=payload.contract_type,
        start_date=payload.start_date,
        end_date=payload.end_date,
        basic_salary=7_000_000,  # ⭐ LƯƠNG CỐ ĐỊNH 7TR
        note=payload.note,
        status="active",
    )

    db.add(new_c)
    db.commit()
    db.refresh(new_c)
    return new_c


@router.put("/{contract_id}/end")
def end_contract(contract_id: int, db: Session = Depends(get_db)):
    """
    Chấm dứt hợp đồng.
    PUT /contracts/{id}/end
    """
    c = db.query(Contract).filter(Contract.id == contract_id).first()
    if c:
        c.status = "ended"
        db.commit()
    return {"message": "ok"}
