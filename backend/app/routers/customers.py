from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app import models, schemas, database
from app.utils.notify import push_notify   # ⭐ THÊM THÔNG BÁO

router = APIRouter(prefix="/customers", tags=["Customers"])


# ======================================================
# GET ALL CUSTOMERS
# ======================================================
@router.get("/", response_model=list[schemas.CustomerOut])
def get_all(db: Session = Depends(database.get_db)):
    return db.query(models.Customer).all()


# ======================================================
# CREATE CUSTOMER  ⭐ THÊM THÔNG BÁO
# ======================================================
@router.post("/", response_model=schemas.CustomerOut)
def create(item: schemas.CustomerCreate, db: Session = Depends(database.get_db)):
    new_item = models.Customer(**item.dict())
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    # ⭐ GỬI THÔNG BÁO
    push_notify(db, f"Khách hàng mới: {new_item.name} đã được thêm")

    return new_item


# ======================================================
# UPDATE CUSTOMER  ⭐ THÊM THÔNG BÁO
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

    # ⭐ THÔNG BÁO CẬP NHẬT
    push_notify(db, f"Thông tin khách hàng {obj.name} đã được cập nhật")

    return obj


# ======================================================
# DELETE CUSTOMER  ⭐ THÊM THÔNG BÁO
# ======================================================
@router.delete("/{id}")
def delete(id: int, db: Session = Depends(database.get_db)):
    obj = db.query(models.Customer).filter(models.Customer.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Customer not found")

    name = obj.name

    db.delete(obj)
    db.commit()

    # ⭐ THÔNG BÁO XÓA KHÁCH HÀNG
    push_notify(db, f"Khách hàng {name} đã bị xóa khỏi hệ thống")

    return {"message": "Deleted successfully"}



# ======================================================
# CRM: GET CUSTOMER DETAIL (notes + orders)
# ======================================================
@router.get("/{customer_id}/detail", response_model=schemas.CustomerDetailCRM)
def get_customer_detail(customer_id: int, db: Session = Depends(database.get_db)):

    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    notes = (
        db.query(models.CustomerNote)
        .filter(models.CustomerNote.customer_id == customer_id)
        .order_by(models.CustomerNote.created_at.desc())
        .all()
    )

    orders = (
        db.query(models.Order)
        .filter(models.Order.customer_id == customer_id)
        .order_by(models.Order.date.desc())
        .all()
    )

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
