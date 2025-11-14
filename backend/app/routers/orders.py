# ==========================================================
# 📦 ROUTER: QUẢN LÝ ĐƠN HÀNG
# ==========================================================
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app import models, schemas, database

router = APIRouter(prefix="/orders", tags=["Orders"])


# ==========================================================
# 📋 Lấy danh sách đơn hàng
# ==========================================================
@router.get("/", response_model=list[schemas.OrderOut])
def get_orders(db: Session = Depends(database.get_db)):
    """
    Lấy toàn bộ danh sách đơn hàng.
    Trả về cả tên khách hàng & sản phẩm để hiển thị ở frontend.
    """
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
# 📝 Tạo đơn hàng mới (❌ KHÔNG trừ kho ngay)
# ==========================================================
@router.post("/", response_model=schemas.OrderOut)
def create_order(order: schemas.OrderCreate, db: Session = Depends(database.get_db)):
    """
    Tạo đơn hàng mới:
      - Kiểm tra khách hàng & sản phẩm tồn tại
      - KHÔNG trừ kho ngay, chỉ trừ khi trạng thái chuyển sang "Hoàn thành"
    """
    product = db.query(models.Product).filter(models.Product.id == order.product_id).first()
    customer = db.query(models.Customer).filter(models.Customer.id == order.customer_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="❌ Sản phẩm không tồn tại")
    if not customer:
        raise HTTPException(status_code=404, detail="❌ Khách hàng không tồn tại")

    if product.stock < order.quantity:
        raise HTTPException(status_code=400, detail="⚠️ Số lượng trong kho không đủ")

    # ✅ Tạo đơn hàng (chưa trừ kho)
    new_order = models.Order(**order.dict())
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    return {
        "id": new_order.id,
        "customer_id": customer.id,
        "product_id": product.id,
        "customer_name": customer.name,
        "product_name": product.name,
        "date": new_order.date,
        "status": new_order.status,
        "quantity": new_order.quantity,
        "amount": new_order.amount,
        "category": new_order.category,
        "region": new_order.region,
        "remaining_stock": product.stock,  # chưa trừ kho
    }


# ==========================================================
# 🔁 Cập nhật trạng thái đơn hàng (chỉ trừ khi "Hoàn thành")
# ==========================================================
@router.put("/{order_id}/status", response_model=schemas.OrderOut)
def update_order_status(order_id: int, status: str, db: Session = Depends(database.get_db)):
    """
    Cập nhật trạng thái đơn hàng:
      - Nếu chuyển sang "Hoàn thành" => trừ kho
      - Nếu chuyển từ "Hoàn thành" sang "Đã hủy" => hoàn kho
      - Các trạng thái khác không ảnh hưởng đến tồn kho
    """
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="❌ Không tìm thấy đơn hàng")

    product = db.query(models.Product).filter(models.Product.id == order.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="❌ Sản phẩm không tồn tại")

    old_status = order.status
    new_status = status

    # ✅ Nếu chuyển sang "Hoàn thành" và chưa hoàn thành trước đó → trừ kho
    if new_status == "Hoàn thành" and old_status != "Hoàn thành":
        if product.stock < order.quantity:
            raise HTTPException(status_code=400, detail="⚠️ Không đủ hàng trong kho để hoàn thành đơn")
        product.stock -= order.quantity

    # ✅ Nếu chuyển từ "Hoàn thành" sang "Đã hủy" → hoàn kho lại
    elif new_status == "Đã hủy" and old_status == "Hoàn thành":
        product.stock += order.quantity

    # ✅ Cập nhật trạng thái
    order.status = new_status

    db.commit()
    db.refresh(order)
    db.refresh(product)

    return {
        "id": order.id,
        "customer_id": order.customer_id,
        "product_id": order.product_id,
        "customer_name": order.customer.name if order.customer else None,
        "product_name": order.product.name if order.product else None,
        "date": order.date,
        "status": order.status,
        "quantity": order.quantity,
        "amount": order.amount,
        "category": order.category,
        "region": order.region,
        "remaining_stock": product.stock,
    }


# ==========================================================
# 📊 Thống kê doanh thu theo DANH MỤC (chỉ tính đơn Hoàn thành)
# ==========================================================
@router.get("/summary-by-category")
def get_summary_by_category(db: Session = Depends(database.get_db)):
    result = (
        db.query(models.Order.category, func.sum(models.Order.amount).label("total"))
        .filter(models.Order.status == "Hoàn thành")
        .group_by(models.Order.category)
        .all()
    )
    return [{"category": r[0], "total": float(r[1])} for r in result]


# ==========================================================
# 📊 Thống kê doanh thu theo KHU VỰC (chỉ tính đơn Hoàn thành)
# ==========================================================
@router.get("/summary-by-region")
def get_summary_by_region(db: Session = Depends(database.get_db)):
    result = (
        db.query(models.Order.region, func.sum(models.Order.amount).label("total"))
        .filter(models.Order.status == "Hoàn thành")
        .group_by(models.Order.region)
        .all()
    )
    return [{"region": r[0], "total": float(r[1])} for r in result]


# ==========================================================
# 📅 Thống kê doanh thu theo THÁNG (chỉ tính đơn Hoàn thành)
# ==========================================================
@router.get("/summary-by-month")
def get_summary_by_month(db: Session = Depends(database.get_db)):
    result = (
        db.query(
            extract("month", models.Order.date).label("month"),
            func.sum(models.Order.amount).label("total")
        )
        .filter(models.Order.status == "Hoàn thành")
        .group_by("month")
        .order_by("month")
        .all()
    )
    return [{"month": int(r[0]), "total": float(r[1])} for r in result]


# ==========================================================
# 🧩 Tổng hợp tất cả thống kê (chỉ tính đơn Hoàn thành)
# ==========================================================
@router.get("/summary-all")
def get_summary_all(db: Session = Depends(database.get_db)):
    summary_by_category = (
        db.query(models.Order.category, func.sum(models.Order.amount))
        .filter(models.Order.status == "Hoàn thành")
        .group_by(models.Order.category)
        .all()
    )

    summary_by_region = (
        db.query(models.Order.region, func.sum(models.Order.amount))
        .filter(models.Order.status == "Hoàn thành")
        .group_by(models.Order.region)
        .all()
    )

    summary_by_month = (
        db.query(
            extract("month", models.Order.date).label("month"),
            func.sum(models.Order.amount)
        )
        .filter(models.Order.status == "Hoàn thành")
        .group_by("month")
        .order_by("month")
        .all()
    )

    return {
        "by_category": [{"category": c[0], "total": float(c[1])} for c in summary_by_category],
        "by_region": [{"region": r[0], "total": float(r[1])} for r in summary_by_region],
        "by_month": [{"month": int(m[0]), "total": float(m[1])} for m in summary_by_month],
    }
