# ==========================================================
# 📦 ROUTER: QUẢN LÝ ĐƠN HÀNG
# ==========================================================
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app import models, schemas, database
from app.utils.notify import push_notify
from pydantic import BaseModel

router = APIRouter(prefix="/orders", tags=["Orders"])


# ----------------------------------------------------------
# DTO nhận trạng thái từ BODY (để trừ kho hoạt động)
# ----------------------------------------------------------
class StatusUpdate(BaseModel):
    status: str


# ==========================================================
# 📋 Lấy danh sách đơn hàng
# ==========================================================
@router.get("/", response_model=list[schemas.OrderOut])
def get_orders(db: Session = Depends(database.get_db)):
    orders = db.query(models.Order).order_by(models.Order.id.desc()).all()

    result = []
    for o in orders:
        result.append({
            "id": o.id,
            "customer_id": o.customer_id,
            "product_id": o.product_id,
            "customer_name": o.customer.name if o.customer else None,
            "product_name": o.product.name if o.product else None,
            "date": o.date,
            "status": o.status,
            "quantity": o.quantity,
            "amount": o.amount,
            "category": o.category,
            "region": o.region,
        })
    return result


# ==========================================================
# 📝 Tạo đơn hàng mới
# ==========================================================
@router.post("/", response_model=schemas.OrderOut)
def create_order(order: schemas.OrderCreate, db: Session = Depends(database.get_db)):
    product = db.query(models.Product).filter(models.Product.id == order.product_id).first()
    customer = db.query(models.Customer).filter(models.Customer.id == order.customer_id).first()

    if not product:
        raise HTTPException(404, "❌ Sản phẩm không tồn tại")
    if not customer:
        raise HTTPException(404, "❌ Khách hàng không tồn tại")

    if product.stock < order.quantity:
        raise HTTPException(400, "⚠️ Số lượng sản phẩm không đủ trong kho")

    new_order = models.Order(**order.dict())
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    # ⭐ THÔNG BÁO
    push_notify(db, f"Đơn hàng #{new_order.id} đã được tạo")

    return {
        **order.dict(),
        "id": new_order.id,
        "customer_name": customer.name,
        "product_name": product.name,
        "date": new_order.date,
        "remaining_stock": product.stock
    }


# ==========================================================
# 🔁 Cập nhật trạng thái đơn hàng (DÙNG BODY)
# ==========================================================
@router.put("/{order_id}/status", response_model=schemas.OrderOut)
def update_order_status(order_id: int, data: StatusUpdate, db: Session = Depends(database.get_db)):

    new_status = data.status

    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "❌ Không tìm thấy đơn hàng")

    product = db.query(models.Product).filter(models.Product.id == order.product_id).first()
    if not product:
        raise HTTPException(404, "❌ Sản phẩm không tồn tại")

    old_status = order.status

    # ⭐ HOÀN THÀNH → TRỪ KHO
    if new_status == "Hoàn thành" and old_status != "Hoàn thành":
        if product.stock < order.quantity:
            raise HTTPException(400, "⚠️ Không đủ hàng để hoàn thành đơn")
        product.stock -= order.quantity
        push_notify(db, f"Đơn hàng #{order.id} đã hoàn thành (trừ kho)")

    # ⭐ HỦY → HOÀN KHO
    elif new_status == "Đã hủy" and old_status == "Hoàn thành":
        product.stock += order.quantity
        push_notify(db, f"Đơn hàng #{order.id} đã bị hủy (hoàn kho)")

    order.status = new_status
    db.commit()
    db.refresh(order)
    db.refresh(product)

    return {
        "id": order.id,
        "customer_id": order.customer_id,
        "product_id": order.product_id,
        "customer_name": order.customer.name,
        "product_name": order.product.name,
        "date": order.date,
        "status": order.status,
        "quantity": order.quantity,
        "amount": order.amount,
        "category": order.category,
        "region": order.region,
        "remaining_stock": product.stock
    }


# ==========================================================
# 📊 Summary API
# ==========================================================
@router.get("/summary-by-category")
def get_summary_by_category(db: Session = Depends(database.get_db)):

    # Gộp theo tên chuẩn hóa (chữ thường)
    data = (
        db.query(
            func.lower(models.Order.category).label("category_norm"),
            func.sum(models.Order.amount).label("total")
        )
        .filter(models.Order.status == "Hoàn thành")
        .group_by(func.lower(models.Order.category))
        .all()
    )

    # Trả về dạng đẹp cho FE
    return [
        {
            "category": (cat or "khác").title(),   # vd: “vật liệu” → “Vật Liệu”
            "total": float(total or 0)
        }
        for cat, total in data
    ]



@router.get("/summary-by-region")
def get_summary_by_region(db: Session = Depends(database.get_db)):
    data = (
        db.query(models.Order.region, func.sum(models.Order.amount))
        .filter(models.Order.status == "Hoàn thành")
        .group_by(models.Order.region)
        .all()
    )
    return [{"region": r, "total": float(t)} for r, t in data]


@router.get("/summary-by-month")
def get_summary_by_month(db: Session = Depends(database.get_db)):
    data = (
        db.query(
            extract("month", models.Order.date).label("month"),
            func.sum(models.Order.amount)
        )
        .filter(models.Order.status == "Hoàn thành")
        .group_by("month")
        .order_by("month")
        .all()
    )
    return [{"month": int(m), "total": float(t)} for m, t in data]


@router.get("/summary-all")
def get_summary_all(db: Session = Depends(database.get_db)):
    return {
        "by_category": get_summary_by_category(db),
        "by_region": get_summary_by_region(db),
        "by_month": get_summary_by_month(db),
    }
