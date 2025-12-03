# ==========================================================
# 📦 ROUTER: QUẢN LÝ ĐƠN HÀNG (ĐỒNG BỘ VỚI KHO)
# ==========================================================
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from pydantic import BaseModel
from datetime import date

from app import models, schemas, database
from app.utils.notify import push_notify
from app.routers.inventory import create_export_record, create_return_record

router = APIRouter(prefix="/orders", tags=["Orders"])
get_db = database.get_db


# ==========================================================
# 📌 DTO nhận trạng thái từ FE
# ==========================================================
class StatusUpdate(BaseModel):
    status: str


# ==========================================================
# 📋 Lấy danh sách đơn hàng
# ==========================================================
@router.get("/", response_model=list[schemas.OrderOut])
def get_orders(db: Session = Depends(get_db)):
    orders = (
        db.query(models.Order)
        .order_by(models.Order.id.desc())
        .all()
    )

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
            # nếu muốn xem luôn tồn kho hiện tại:
            "remaining_stock": o.product.stock if o.product else None,
        })

    return result


# ==========================================================
# 📝 Tạo đơn hàng mới
# ==========================================================
@router.post("/", response_model=schemas.OrderOut)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == order.product_id).first()
    customer = db.query(models.Customer).filter(models.Customer.id == order.customer_id).first()

    if not product:
        raise HTTPException(404, "❌ Sản phẩm không tồn tại")

    if not customer:
        raise HTTPException(404, "❌ Khách hàng không tồn tại")

    # luôn kiểm tra tồn kho
    if product.stock < order.quantity:
        raise HTTPException(400, f"⚠️ Số lượng sản phẩm không đủ trong kho (còn {product.stock})")

    # Tạo đơn hàng (chưa đụng tới kho)
    new_order = models.Order(**order.dict())
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    # Nếu ngay từ đầu chọn trạng thái HOÀN THÀNH -> tạo phiếu xuất kho + trừ kho
    if new_order.status == "Hoàn thành":
        # double check tồn kho
        if product.stock < new_order.quantity:
            raise HTTPException(400, f"Không đủ hàng để hoàn thành đơn (tồn kho: {product.stock})")

        # dùng helper của inventory để vừa log, vừa trừ stock
        create_export_record(db, new_order.product_id, new_order.quantity, new_order.id)
        db.refresh(product)

    # Gửi thông báo
    push_notify(db, f"Đơn hàng #{new_order.id} đã được tạo")

    return {
        "id": new_order.id,
        "customer_id": new_order.customer_id,
        "product_id": new_order.product_id,
        "customer_name": customer.name,
        "product_name": product.name,
        "date": new_order.date,
        "status": new_order.status,
        "quantity": new_order.quantity,
        "amount": new_order.amount,      # 💰 doanh thu giữ nguyên
        "category": new_order.category,
        "region": new_order.region,
        "remaining_stock": product.stock
    }


# ==========================================================
# 🔁 Cập nhật trạng thái đơn hàng (TRỪ KHO / HOÀN KHO)
# ==========================================================
@router.put("/{order_id}/status", response_model=schemas.OrderOut)
def update_order_status(
    order_id: int,
    data: StatusUpdate,
    db: Session = Depends(get_db)
):
    new_status = data.status

    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Không tìm thấy đơn hàng")

    product = db.query(models.Product).filter(models.Product.id == order.product_id).first()
    if not product:
        raise HTTPException(404, "Không tìm thấy sản phẩm")

    old_status = order.status

    # 1️⃣ KHÔNG HOÀN THÀNH → HOÀN THÀNH  => XUẤT KHO
    if new_status == "Hoàn thành" and old_status != "Hoàn thành":
        if product.stock < order.quantity:
            raise HTTPException(
                400,
                f"Không đủ hàng để hoàn thành đơn (tồn kho: {product.stock})"
            )

        # tạo phiếu xuất kho + trừ stock
        create_export_record(db, order.product_id, order.quantity, order.id)
        db.refresh(product)

    # 2️⃣ HOÀN THÀNH → TRẠNG THÁI KHÁC  => HOÀN KHO
    elif old_status == "Hoàn thành" and new_status != "Hoàn thành":
        # tạo phiếu hoàn kho + cộng stock
        create_return_record(db, order.product_id, order.quantity, order.id)
        db.refresh(product)

    # Cập nhật trạng thái đơn hàng
    order.status = new_status
    db.commit()
    db.refresh(order)
    db.refresh(product)

    # Thông báo (tuỳ thích)
    if new_status == "Hoàn thành":
        push_notify(db, f"Đơn hàng #{order.id} đã HOÀN THÀNH")
    elif new_status == "Đã hủy":
        push_notify(db, f"Đơn hàng #{order.id} đã bị HỦY")

    return {
        "id": order.id,
        "customer_id": order.customer_id,
        "product_id": order.product_id,
        "customer_name": order.customer.name if order.customer else None,
        "product_name": order.product.name if order.product else None,
        "date": order.date,
        "status": order.status,
        "quantity": order.quantity,
        "amount": order.amount,      # 💰 doanh thu không đổi
        "category": order.category,
        "region": order.region,
        "remaining_stock": product.stock
    }


# ==========================================================
# 📊 Summary theo danh mục
#  👉 Vẫn GIỮ NGUYÊN: chỉ tính đơn "Hoàn thành"
# ==========================================================
@router.get("/summary-by-category")
def get_summary_by_category(db: Session = Depends(get_db)):
    data = (
        db.query(
            func.lower(models.Order.category).label("category_norm"),
            func.sum(models.Order.amount).label("total")
        )
        .filter(models.Order.status == "Hoàn thành")
        .group_by(func.lower(models.Order.category))
        .all()
    )

    return [
        {
            "category": (cat or "khác").title(),
            "total": float(total or 0)
        }
        for cat, total in data
    ]


# ==========================================================
# 📊 Summary theo khu vực
# ==========================================================
@router.get("/summary-by-region")
def get_summary_by_region(db: Session = Depends(get_db)):
    data = (
        db.query(models.Order.region, func.sum(models.Order.amount))
        .filter(models.Order.status == "Hoàn thành")
        .group_by(models.Order.region)
        .all()
    )

    return [{"region": r, "total": float(t)} for r, t in data]


# ==========================================================
# 📊 Summary theo tháng
# ==========================================================
@router.get("/summary-by-month")
def get_summary_by_month(db: Session = Depends(get_db)):
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


# ==========================================================
# 📊 Summary tổng hợp
# ==========================================================
@router.get("/summary-all")
def get_summary_all(db: Session = Depends(get_db)):
    return {
        "by_category": get_summary_by_category(db),
        "by_region": get_summary_by_region(db),
        "by_month": get_summary_by_month(db),
    }
