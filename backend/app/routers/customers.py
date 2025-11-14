from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app import models, schemas, database

router = APIRouter(prefix="/customers", tags=["Customers"])


# ======================================================
# GET ALL CUSTOMERS
# ======================================================
@router.get("/", response_model=list[schemas.CustomerOut])
def get_all(db: Session = Depends(database.get_db)):
    return db.query(models.Customer).all()


# ======================================================
# CREATE CUSTOMER
# ======================================================
@router.post("/", response_model=schemas.CustomerOut)
def create(item: schemas.CustomerCreate, db: Session = Depends(database.get_db)):
    new_item = models.Customer(**item.dict())
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


# ======================================================
# UPDATE CUSTOMER
# ======================================================
@router.put("/{id}", response_model=schemas.CustomerOut)
def update(id: int, item: schemas.CustomerCreate, db: Session = Depends(database.get_db)):

    obj = db.query(models.Customer).filter(models.Customer.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Customer not found")

    for key, value in item.dict().items():
        setattr(obj, key, value)

    db.commit()
    db.refresh(obj)
    return obj


# ======================================================
# DELETE CUSTOMER
# ======================================================
@router.delete("/{id}")
def delete(id: int, db: Session = Depends(database.get_db)):
    obj = db.query(models.Customer).filter(models.Customer.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Customer not found")

    db.delete(obj)
    db.commit()
    return {"message": "Deleted successfully"}



# ======================================================
# CRM: GET CUSTOMER DETAIL (notes + orders)
# ======================================================
@router.get("/{customer_id}/detail", response_model=schemas.CustomerDetailCRM)
def get_customer_detail(customer_id: int, db: Session = Depends(database.get_db)):

    # Lấy thông tin khách hàng
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Lấy ghi chú (mới nhất trước)
    notes = (
        db.query(models.CustomerNote)
        .filter(models.CustomerNote.customer_id == customer_id)
        .order_by(models.CustomerNote.created_at.desc())
        .all()
    )

    # Lấy lịch sử đơn hàng
    orders = (
        db.query(models.Order)
        .filter(models.Order.customer_id == customer_id)
        .order_by(models.Order.date.desc())
        .all()
    )

    # Chuyển Order → OrderShort
    orders_short = [
        schemas.OrderShort(
            id=o.id,
            date=o.date,
            amount=o.amount,
            status=o.status
        )
        for o in orders
    ]

    return schemas.CustomerDetailCRM(
        customer=customer,
        notes=notes,
        orders=orders_short,
    )
