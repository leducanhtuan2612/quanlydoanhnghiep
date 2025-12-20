from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app import models, schemas, database

router = APIRouter(prefix="/analysis/customers", tags=["Customer Analysis"])


@router.get("/{customer_id}")
def analyze_customer(customer_id: int, db: Session = Depends(database.get_db)):

    customer = db.query(models.Customer).filter_by(id=customer_id).first()
    if not customer:
        raise HTTPException(404, "Không tìm thấy khách hàng")

    orders = db.query(models.Order).filter_by(customer_id=customer_id).all()

    # ---- Tính toán ----
    total_spent = sum(o.amount for o in orders)
    total_orders = len(orders)

    if orders:
        last_order = max(orders, key=lambda x: x.date)
        last_date = last_order.date
    else:
        last_date = None

    # Doanh thu theo tháng
    monthly = {}
    for o in orders:
        key = f"{o.date.year}-{o.date.month:02d}"
        monthly[key] = monthly.get(key, 0) + o.amount

    # Top sản phẩm
    prod_count = {}
    for o in orders:
        prod_count[o.product_id] = prod_count.get(o.product_id, 0) + 1

    top_products = []
    for pid, qty in sorted(prod_count.items(), key=lambda x: x[1], reverse=True):
        p = db.query(models.Product).filter_by(id=pid).first()
        top_products.append({
            "product_name": p.name if p else "Không xác định",
            "count": qty
        })

    # Customer Value Score
    score = (
        (total_spent / 1_000_000) * 0.6 +
        total_orders * 0.3 +
        (1 if last_date else 0) * 0.1
    )

    return {
        "customer": {
            "id": customer.id,
            "name": customer.name,
            "email": customer.email,
            "phone": customer.phone,
            "address": customer.address
        },
        "stats": {
            "total_spent": total_spent,
            "total_orders": total_orders,
            "last_order_date": last_date,
            "value_score": round(score, 2)
        },
        "monthly_revenue": monthly,
        "top_products": top_products,
        "orders": [
            {
                "id": o.id,
                "amount": o.amount,
                "date": o.date,
                "status": o.status
            }
            for o in orders
        ]
    }
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app import models, database
import statistics

router = APIRouter(prefix="/analysis/customers", tags=["Customer Analysis"])


@router.get("/{customer_id}")
def analyze_customer(customer_id: int, db: Session = Depends(database.get_db)):

    customer = db.query(models.Customer).filter_by(id=customer_id).first()
    if not customer:
        raise HTTPException(404, "Không tìm thấy khách hàng")

    orders = db.query(models.Order).filter_by(customer_id=customer_id).all()
    if not orders:
        return {"error": "Khách chưa có đơn hàng để phân tích"}

    # Tổng chi tiêu
    total_spent = sum(o.amount for o in orders)

    # Số đơn
    total_orders = len(orders)

    # Lần mua gần nhất
    last_order = max(orders, key=lambda x: x.date)
    last_date = last_order.date

    # Doanh thu từng tháng
    monthly = {}
    for o in orders:
        key = f"{o.date.year}-{o.date.month:02d}"
        monthly[key] = monthly.get(key, 0) + o.amount

    # Doanh thu theo năm
    yearly = {}
    for o in orders:
        yearly[o.date.year] = yearly.get(o.date.year, 0) + o.amount

        # Tần suất mua (khoảng cách theo ngày)
    order_dates = sorted([o.date for o in orders])
    freq_days = []
    for i in range(1, len(order_dates)):
        delta = (order_dates[i] - order_dates[i - 1]).days
        freq_days.append(delta)

    # 👉 Làm tròn tần suất mua
    avg_freq = round(statistics.mean(freq_days)) if freq_days else None



    # TOP sản phẩm
    product_stat = {}
    for o in orders:
        product_stat[o.product_id] = product_stat.get(o.product_id, 0) + 1

    top_products = []
    for pid, qty in sorted(product_stat.items(), key=lambda x: x[1], reverse=True):
        p = db.query(models.Product).filter_by(id=pid).first()
        top_products.append({
            "product_name": p.name if p else "Không xác định",
            "count": qty,
            "category": p.category if p else None
        })

    # TOP danh mục sản phẩm
    category_stat = {}
    for o in orders:
        prod = db.query(models.Product).filter(models.Product.id == o.product_id).first()
        if prod:
            category_stat[prod.category] = category_stat.get(prod.category, 0) + 1

    # Customer Value Score — AI weighted
    score = (
        (total_spent / 1_000_000) * 0.5 +
        total_orders * 0.3 +
        (1 / (avg_freq or 30)) * 0.2
    )

    # AI Summary
    ai_summary = f"""
Khách hàng **{customer.name}** đã mua {total_orders} đơn với tổng giá trị **{total_spent:,} VNĐ**.
- Tần suất mua trung bình: {avg_freq or "Không xác định"} ngày/lần.
- Sản phẩm ưa thích: {top_products[0]['product_name'] if top_products else 'Không có'}
- Danh mục quan tâm: {', '.join(category_stat.keys())}

Dựa trên hành vi mua, khách được phân loại là:
👉 **{'VIP' if score > 8 else 'Tiềm năng' if score > 5 else 'Cơ bản'}**

Gợi ý chăm sóc:
- Gửi ưu đãi sản phẩm họ hay mua.
- Gọi chăm sóc sau {avg_freq or '?'} ngày kể từ lần mua cuối.
"""

    # Return siêu dữ liệu hoàn chỉnh
    return {
        "customer": customer,
        "stats": {
            "total_spent": total_spent,
            "total_orders": total_orders,
            "last_order_date": last_date,
            "avg_buy_freq": avg_freq,
            "value_score": round(score, 2)
        },
        "monthly_revenue": monthly,
        "yearly_revenue": yearly,
        "top_products": top_products,
        "top_categories": category_stat,
        "orders": orders,
        "ai_summary": ai_summary
    }
