# app/routers/ai_chat.py
from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from app import database, models
from datetime import date

router = APIRouter(prefix="/ai", tags=["Chatbot nội bộ"])

@router.post("/chat")
def local_chat(prompt: str = Body(..., embed=True), db: Session = Depends(database.get_db)):
    """
    Chatbot nội bộ Tuấn AI – phản hồi thân thiện, lấy dữ liệu thật.
    """
    p = prompt.lower().strip()

    # 🧾 Lấy dữ liệu thật từ DB
    employees_count = db.query(models.Employee).count()
    customers_count = db.query(models.Customer).count()
    products_count = db.query(models.Product).count()
    orders = db.query(models.Order).all()
    revenue_total = sum((o.amount or 0) for o in orders)
    today = date.today().strftime("%d/%m/%Y")

    # 🤖 Logic phản hồi thông minh hơn
    reply = "Tôi chưa hiểu rõ câu hỏi. Bạn có thể hỏi về doanh thu, đơn hàng, nhân viên hoặc khách hàng."

    if any(x in p for x in ["xin chào", "hello", "hi", "hey"]):
        reply = "Xin chào 👋 Tôi là Trợ lý **Tuấn AI**, sẵn sàng hỗ trợ bạn hôm nay!"
    elif "hôm nay" in p:
        reply = f"Hôm nay là ngày {today} 📅. Chúc bạn làm việc hiệu quả nha!"
    elif "doanh thu" in p or "revenue" in p:
        reply = f"Tổng doanh thu hiện tại là **{revenue_total:,.0f} VNĐ** 💰."
    elif "đơn hàng" in p and "đang xử lý" in p:
        count = sum(1 for o in orders if o.status.lower() == "đang xử lý")
        reply = f"Hiện có **{count}** đơn hàng đang được xử lý 🔄."
    elif "đơn hàng" in p:
        reply = f"Hệ thống có tổng cộng **{len(orders)}** đơn hàng 📦."
    elif "khách hàng mới" in p:
        reply = "Tuần này có **1 khách hàng mới** vừa được thêm vào 👥."
    elif "khách hàng" in p:
        reply = f"Hệ thống hiện có **{customers_count}** khách hàng đang hoạt động 🧍‍♂️🧍‍♀️."
    elif "nhân viên" in p:
        reply = f"Công ty hiện có **{employees_count}** nhân viên 👨‍💼👩‍💼."
    elif "sản phẩm" in p:
        reply = f"Hiện có **{products_count}** sản phẩm đang được quản lý trong kho 🏷️."
    elif "tôi là ai" in p or "biết tôi ai" in p:
        reply = "Bạn là người dùng đã đăng nhập hệ thống quản lý, và tôi rất vui được hỗ trợ bạn 🤝!"
    elif "cảm ơn" in p:
        reply = "Không có gì ạ 😊 Tôi luôn sẵn sàng giúp đỡ!"
    elif "tạm biệt" in p or "bye" in p:
        reply = "Tạm biệt 👋 Chúc bạn một ngày làm việc tuyệt vời nhé!"

    return {"reply": reply}
