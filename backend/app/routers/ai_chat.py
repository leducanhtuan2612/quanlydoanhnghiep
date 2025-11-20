# app/routers/ai_chat.py
from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from datetime import date, datetime
from app import database, models

router = APIRouter(prefix="/ai", tags=["Chatbot nội bộ Tuấn AI"])

# ==========================
# 🔥 Hàm tiện ích
# ==========================

def suggest(*items):
    """Trả về gợi ý câu hỏi"""
    s = "• " + "\n• ".join(items)
    return f"\n\n👉 Bạn có thể hỏi thêm:\n{s}"

def contains(text: str, *words):
    return any(w in text for w in words)

# ==========================
# 🤖 Chatbot nâng cấp
# ==========================

@router.post("/chat")
def local_chat(prompt: str = Body(..., embed=True), db: Session = Depends(database.get_db)):

    p = prompt.lower().strip()

    # Lấy dữ liệu thật từ DB
    employees_count = db.query(models.Employee).count()
    customers_count = db.query(models.Customer).count()
    products_count = db.query(models.Product).count()

    orders = db.query(models.Order).all()
    revenue_total = sum((o.amount or 0) for o in orders)
    today = date.today().strftime("%d/%m/%Y")

    # ==========================
    # 💬 Xử lý theo mẫu câu
    # ==========================

    # 1. Chào hỏi
    if contains(p, "xin chào", "hello", "hi", "hey", "chào"):
        return {
            "reply": (
                "Xin chào 👋! Tôi là **Trợ lý Tuấn AI** — trợ lý thông minh của công ty.\n"
                "Tôi có thể giúp bạn xem doanh thu, đơn hàng, nhân viên, khách hàng…"
                + suggest("Doanh thu hôm nay bao nhiêu?", "Có bao nhiêu đơn hàng đang xử lý?")
            )
        }

    # 2. Ngày hôm nay
    if contains(p, "ngày hôm nay", "hôm nay", "today"):
        return {
            "reply": (
                f"Hôm nay là ngày **{today}** 📆.\nChúc bạn một ngày làm việc thật hiệu quả nha!"
                + suggest("Doanh thu hôm nay là bao nhiêu?", "Có bao nhiêu đơn hôm nay?")
            )
        }

    # 3. Doanh thu
    if contains(p, "doanh thu", "revenue", "tiền kiếm được", "thu nhập"):
        return {
            "reply": (
                f"Tổng doanh thu tích lũy hiện tại là **{revenue_total:,.0f} VNĐ** 💰."
                + suggest(
                    "Doanh thu theo từng tháng?",
                    "Doanh thu theo khu vực?",
                    "Sản phẩm nào mang lại doanh thu cao nhất?"
                )
            )
        }

    # 4. Đơn hàng
    if contains(p, "đơn hàng đang xử lý", "đang xử lý"):
        count = sum(1 for o in orders if o.status.lower() == "đang xử lý")
        return {
            "reply": (
                f"Hiện có **{count}** đơn hàng đang trong trạng thái xử lý 🔄."
                + suggest("Danh sách đơn hàng đang xử lý?", "Đơn hàng hoàn thành bao nhiêu?")
            )
        }

    if contains(p, "đơn hàng", "orders", "hóa đơn"):
        return {
            "reply": (
                f"Hệ thống hiện có tổng cộng **{len(orders)}** đơn hàng 📦."
                + suggest(
                    "Bao nhiêu đơn đã hoàn thành?",
                    "Bao nhiêu đơn bị hủy?",
                    "Tổng số tiền từ các đơn hoàn thành?"
                )
            )
        }

    # 5. Khách hàng
    if contains(p, "khách hàng mới"):
        return {
            "reply": (
                "Tuần này có **1 khách hàng mới** được thêm vào 👥."
                + suggest("Tổng số khách hàng?", "Top khách mua nhiều nhất?")
            )
        }

    if contains(p, "khách hàng", "customers"):
        return {
            "reply": (
                f"Dữ liệu cho biết hệ thống hiện có **{customers_count} khách hàng** 🧍‍♂️🧍‍♀️."
                + suggest("Khách hàng nào mua nhiều nhất?", "Có khách hàng mới không?")
            )
        }

    # 6. Nhân viên
    if contains(p, "nhân viên", "employee", "staff"):
        return {
            "reply": (
                f"Công ty hiện có **{employees_count} nhân viên** 👨‍💼👩‍💼."
                + suggest("Danh sách nhân viên?", "Có nhân viên nào mới không?")
            )
        }

    # 7. Sản phẩm
    if contains(p, "sản phẩm", "product"):
        return {
            "reply": (
                f"Hệ thống đang quản lý **{products_count} sản phẩm** 🏷️."
                + suggest("Sản phẩm còn hàng?", "Sản phẩm bán chạy nhất?")
            )
        }

    # 8. "Tôi là ai?"
    if contains(p, "tôi là ai", "biết tôi ai", "who am i"):
        return {"reply": "Bạn là người dùng đã đăng nhập hệ thống — và tôi luôn ở đây để hỗ trợ bạn 🤝!"}

    # 9. Cảm ơn
    if contains(p, "cảm ơn", "thanks", "thank you"):
        return {"reply": "Không có gì ạ 😊. Nếu cần gì thêm cứ hỏi tôi nhé!"}

    # 10. Tạm biệt
    if contains(p, "tạm biệt", "bye", "goodbye"):
        return {"reply": "Tạm biệt 👋. Chúc bạn một ngày làm việc tràn đầy năng lượng!"}

    # ==========================
    # ❓ Câu hỏi không hiểu — fallback thông minh
    # ==========================

    return {
        "reply": (
            "Tôi chưa hiểu rõ câu hỏi của bạn 😅.\n"
            "Bạn có thể hỏi tôi về **doanh thu, đơn hàng, khách hàng, sản phẩm, nhân viên**,…"
            + suggest(
                "Doanh thu hiện tại?",
                "Hệ thống có bao nhiêu khách hàng?",
                "Tổng số đơn hàng?",
                "Có bao nhiêu sản phẩm trong kho?"
            )
        )
    }
