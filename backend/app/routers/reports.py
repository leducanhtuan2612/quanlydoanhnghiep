from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app import models, database

router = APIRouter(prefix="/reports", tags=["Reports"])

# ============================================================
# 📊 1️⃣ API: BÁO CÁO TỔNG HỢP (cho trang “Báo cáo”)
# ============================================================
@router.get("/summary")
def get_summary(db: Session = Depends(database.get_db)):
    """
    Báo cáo tổng hợp:
    ✅ Thống kê số lượng nhân viên, khách hàng, sản phẩm
    ✅ Tính tổng tồn kho
    ✅ Biểu đồ tồn kho và cơ cấu tổng thể
    ✅ Top 5 sản phẩm tồn kho cao nhất
    """

    # --- A. TỔNG QUAN ---
    employees_count = db.query(models.Employee).count()
    customers_count = db.query(models.Customer).count()
    products_count = db.query(models.Product).count()
    inventory_items = db.query(models.Inventory).all()

    total_stock = sum((i.quantity or 0) for i in inventory_items)

    overview = {
        "employees_count": employees_count,
        "customers_count": customers_count,
        "products_count": products_count,
        "total_stock": total_stock,
    }

    # --- B. BIỂU ĐỒ ---
    # Biểu đồ tồn kho theo sản phẩm
    inventory_chart = [
        {
            "name": i.product.name if i.product else "Không xác định",
            "stock": int(i.quantity or 0),
        }
        for i in inventory_items
    ]

    # Biểu đồ cơ cấu tổng thể
    entity_chart = [
        {"name": "Nhân viên", "value": employees_count},
        {"name": "Khách hàng", "value": customers_count},
        {"name": "Sản phẩm", "value": products_count},
    ]

    # --- C. TOP 5 SẢN PHẨM TỒN KHO ---
    top_products = sorted(inventory_chart, key=lambda x: x["stock"], reverse=True)[:5]

    # --- D. KẾT QUẢ ---
    return {
        "overview": overview,
        "charts": {
            "inventory": inventory_chart,
            "entities": entity_chart,
        },
        "top_products": top_products,
    }


# ============================================================
# 💰 2️⃣ API: BÁO CÁO DOANH THU (cho trang “Doanh thu”)
# ============================================================
@router.get("/revenue")
def get_revenue_report(db: Session = Depends(database.get_db)):
    """
    Báo cáo doanh thu tổng hợp:
    ✅ Chỉ tính các đơn hàng có trạng thái 'Hoàn thành'
    ✅ Gom theo tháng, danh mục, khu vực
    ✅ Tính tổng doanh thu toàn hệ thống
    """

    # --- Bộ lọc chỉ lấy đơn hoàn thành ---
    completed_orders = db.query(models.Order).filter(models.Order.status == "Hoàn thành")

    # --- A. DOANH THU THEO THÁNG ---
    by_month = (
        completed_orders
        .with_entities(
            func.extract("month", models.Order.date).label("month"),
            func.sum(models.Order.amount).label("total"),
        )
        .group_by(func.extract("month", models.Order.date))
        .order_by(func.extract("month", models.Order.date))
        .all()
    )

    by_month_data = [
        {"month": int(m[0]), "total": float(m[1] or 0)} for m in by_month
    ]

    # --- B. DOANH THU THEO DANH MỤC ---
    by_category = (
        completed_orders
        .join(models.Product, models.Order.product_id == models.Product.id)
        .with_entities(
            models.Product.category,
            func.sum(models.Order.amount).label("total"),
        )
        .group_by(models.Product.category)
        .all()
    )

    allowed_categories = ["Vật liệu", "Nông cụ", "Hạt giống", "Khác"]
    by_category_data = []
    for c, total in by_category:
        name = c if c in allowed_categories else "Khác"
        by_category_data.append({"category": name, "total": float(total or 0)})

    # --- C. DOANH THU THEO KHU VỰC ---
    by_region = (
        completed_orders
        .with_entities(
            models.Order.region,
            func.sum(models.Order.amount).label("total"),
        )
        .group_by(models.Order.region)
        .all()
    )

    by_region_data = [
        {"region": r[0] or "Không xác định", "total": float(r[1] or 0)}
        for r in by_region
    ]

    # --- D. TỔNG DOANH THU TOÀN HỆ THỐNG ---
    total_revenue = sum(item["total"] for item in by_month_data)

    # --- E. KẾT QUẢ ---
    return {
        "total_revenue": total_revenue,
        "by_month": by_month_data,
        "by_category": by_category_data,
        "by_region": by_region_data,
    }
