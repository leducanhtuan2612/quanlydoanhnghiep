# ==========================================================
# 📁 app/routers/ai_chat.py
# Trợ lý TUẤN AI – phiên bản hoàn chỉnh
# Chỉ tính đơn HOÀN THÀNH – hỗ trợ nhiều câu thông minh
# ==========================================================

from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from datetime import date, datetime
from app import database, models

router = APIRouter(prefix="/ai", tags=["Trợ lý Tuấn AI"])


# ==========================================================
# 🔧 HÀM TIỆN ÍCH
# ==========================================================

def normalize(text: str):
    return text.lower().strip()

def contains(text: str, *words):
    return any(w in text for w in words)

def suggest(*items):
    s = "• " + "\n• ".join(items)
    return f"\n\n👉 Bạn có thể hỏi thêm:\n{s}"

def safe_total(o):
    """Ưu tiên total → amount → 0"""
    if hasattr(o, "total") and o.total:
        return o.total
    if hasattr(o, "amount") and o.amount:
        return o.amount
    return 0


# ==========================================================
# 📊 CHỈ LẤY ĐƠN HOÀN THÀNH
# ==========================================================

def completed_orders(db):
    orders = db.query(models.Order).all()
    result = []

    for o in orders:
        status = (o.status or "").lower()
        if status in ["hoàn thành", "completed", "thành công"]:
            result.append(o)

    return result


# ==========================================================
# 📊 DOANH THU
# ==========================================================

def get_revenue_total(db):
    """Chỉ tính đơn hoàn thành"""
    orders = completed_orders(db)
    return sum(safe_total(o) for o in orders)


def get_revenue_monthly(db):
    orders = completed_orders(db)
    monthly = {}

    for o in orders:
        if not getattr(o, "date", None):
            continue

        m = o.date.month
        monthly[m] = monthly.get(m, 0) + safe_total(o)

    return monthly


def get_revenue_today(db):
    today = date.today()
    orders = completed_orders(db)
    return sum(
        safe_total(o) for o in orders
        if o.date and o.date == today
    )


def get_revenue_year(db):
    year = date.today().year
    orders = completed_orders(db)
    return sum(
        safe_total(o) for o in orders
        if o.date and o.date.year == year
    )


# ==========================================================
# 📦 SẢN PHẨM – TOP BÁN CHẠY
# ==========================================================

def get_top_products(db, limit=3):
    prods = db.query(models.Product).all()
    orders = completed_orders(db)

    count = {}
    for o in orders:
        pid = o.product_id
        count[pid] = count.get(pid, 0) + 1

    result = []
    for p in prods:
        result.append({
            "name": p.name,
            "sold": count.get(p.id, 0)
        })

    result.sort(key=lambda x: x["sold"], reverse=True)
    return result[:limit]


# ==========================================================
# 👥 KHÁCH HÀNG – TOP CHI NHIỀU
# ==========================================================

def get_top_customers(db, limit=3):
    customers = db.query(models.Customer).all()
    orders = completed_orders(db)

    money = {}
    for o in orders:
        cid = o.customer_id
        money[cid] = money.get(cid, 0) + safe_total(o)

    result = []
    for c in customers:
        result.append({
            "name": c.name,
            "spent": money.get(c.id, 0)
        })

    result.sort(key=lambda x: x["spent"], reverse=True)
    return result[:limit]


# ==========================================================
# 🤖 CHATBOT CHÍNH
# ==========================================================

@router.post("/chat")
def ai_chat(prompt: str = Body(..., embed=True),
            db: Session = Depends(database.get_db)):

    p = normalize(prompt)

    # THỐNG KÊ
    orders_done = completed_orders(db)
    revenue_total = get_revenue_total(db)
    revenue_today = get_revenue_today(db)
    revenue_year = get_revenue_year(db)

    employees_count = db.query(models.Employee).count()
    customers_count = db.query(models.Customer).count()
    products_count = db.query(models.Product).count()

    today = date.today().strftime("%d/%m/%Y")

    # ----------------------------------------------------------
    # 1. Chào hỏi
    # ----------------------------------------------------------

    if contains(p, "chào", "hello", "hi", "hey"):
        return {
            "reply": (
                "Xin chào 👋! Tôi là **Trợ lý Tuấn AI**.\n"
                "Tôi có thể giúp bạn xem doanh thu, đơn hàng, khách hàng, sản phẩm, kho…"
                + suggest("Doanh thu hiện tại?", "Bao nhiêu đơn hoàn thành?")
            )
        }

    # ----------------------------------------------------------
    # 2. Hôm nay
    # ----------------------------------------------------------

    if contains(p, "hôm nay", "today"):
        return {
            "reply": (
                f"📅 Hôm nay là **{today}**.\n"
                f"💰 Doanh thu hôm nay: **{revenue_today:,.0f} VNĐ**."
                + suggest("Doanh thu tháng này?", "Có bao nhiêu đơn hôm nay?")
            )
        }

    # ----------------------------------------------------------
    # 3. Doanh thu tổng
    # ----------------------------------------------------------

    if contains(p, "doanh thu", "revenue"):
        return {
            "reply": (
                f"💰 **Doanh thu tích lũy (đơn hoàn thành): {revenue_total:,.0f} VNĐ**.\n"
                + suggest(
                    "Doanh thu hôm nay?",
                    "Doanh thu theo từng tháng?",
                    "Doanh thu năm nay?",
                    "Top khách hàng chi nhiều?"
                )
            )
        }

    # ----------------------------------------------------------
    # 4. Doanh thu theo tháng
    # ----------------------------------------------------------

    if contains(p, "theo tháng", "doanh thu tháng"):
        monthly = get_revenue_monthly(db)

        if not monthly:
            return { "reply": "Hiện chưa có đơn hoàn thành nào để thống kê theo tháng." }

        text = "📊 **Doanh thu theo từng tháng:**\n"
        for m, v in sorted(monthly.items()):
            text += f"- Tháng {m}: **{v:,.0f} VNĐ**\n"

        return {"reply": text}

    # ----------------------------------------------------------
    # 5. Doanh thu năm nay
    # ----------------------------------------------------------

    if contains(p, "năm nay", "doanh thu năm"):
        return {
            "reply": (
                f"📆 **Doanh thu năm nay** là **{revenue_year:,.0f} VNĐ**."
                + suggest("Doanh thu theo tháng?", "Top sản phẩm bán chạy?")
            )
        }

    # ----------------------------------------------------------
    # 6. Đơn hàng
    # ----------------------------------------------------------

    if contains(p, "đơn hoàn thành", "đơn thành công"):
        return {
            "reply": f"📦 Tổng số đơn hoàn thành: **{len(orders_done)}**."
        }

    if contains(p, "đơn hàng", "order"):
        total = db.query(models.Order).count()
        return {
            "reply": (
                f"📦 Tổng đơn hàng: **{total}**\n"
                f"✔ Đơn hoàn thành: **{len(orders_done)}**"
                + suggest("Doanh thu từ đơn hoàn thành?", "Top sản phẩm bán chạy?")
            )
        }

    # ----------------------------------------------------------
    # 7. Sản phẩm
    # ----------------------------------------------------------

    if contains(p, "sản phẩm bán chạy", "top sản phẩm"):
        top = get_top_products(db)
        text = "🔥 **Top sản phẩm bán chạy:**\n"
        for i, t in enumerate(top, 1):
            text += f"{i}. {t['name']} — {t['sold']} lượt mua\n"
        return {"reply": text}

    if contains(p, "sản phẩm", "product"):
        return {
            "reply": (
                f"📦 Hệ thống đang quản lý **{products_count} sản phẩm**."
                + suggest("Sản phẩm bán chạy?", "Sản phẩm còn hàng?")
            )
        }

    # ----------------------------------------------------------
    # 8. Khách hàng
    # ----------------------------------------------------------

    if contains(p, "top khách", "khách chi nhiều"):
        top = get_top_customers(db)
        text = "👑 **Top khách hàng chi nhiều nhất:**\n"
        for i, t in enumerate(top, 1):
            text += f"{i}. {t['name']} — {t['spent']:,.0f} VNĐ\n"
        return {"reply": text}

    if contains(p, "khách hàng", "customer"):
        return {
            "reply": (
                f"Hệ thống hiện có **{customers_count} khách hàng** 👥."
                + suggest("Top khách hàng chi nhiều?", "Khách hàng mới nhất?")
            )
        }

    # ----------------------------------------------------------
    # 9. Nhân viên
    # ----------------------------------------------------------

    if contains(p, "nhân viên", "employee", "staff"):
        return {
            "reply": (
                f"👨‍💼 Công ty hiện có **{employees_count} nhân viên**."
                + suggest("Danh sách nhân viên?", "Nhân viên mới?")
            )
        }

    # ----------------------------------------------------------
    # 10. Cảm ơn – tạm biệt
    # ----------------------------------------------------------

    if contains(p, "cảm ơn", "thanks"):
        return { "reply": "Không có gì ạ 😊. Tôi luôn sẵn sàng hỗ trợ bạn!" }

    if contains(p, "tạm biệt", "bye"):
        return { "reply": "Tạm biệt 👋. Chúc bạn một ngày làm việc hiệu quả!" }


    # ----------------------------------------------------------
    # ❓ FALLBACK
    # ----------------------------------------------------------

    return {
        "reply": (
            "Tôi chưa hiểu rõ câu hỏi của bạn 😅.\n"
            "Bạn có thể hỏi về doanh thu, đơn hàng, khách hàng, sản phẩm…"
            + suggest("Doanh thu hiện tại?", "Top khách hàng?", "Sản phẩm bán chạy?")
        )
    }
