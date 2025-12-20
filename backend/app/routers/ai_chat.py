# ==========================================================
# 📁 app/routers/ai_chat.py
# TRỢ LÝ TUẤN AI 3.0 – BẢN FULL
# Hỗ trợ nhiều chủ đề: Doanh thu, Đơn hàng, Kho, Nhân viên,
# Hợp đồng, Lương, Chấm công, Task, Phúc lợi, CRM, Thông báo...
# ==========================================================

from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta

from app import database, models

router = APIRouter(prefix="/ai", tags=["Trợ lý Tuấn AI"])


# ==========================================================
# 🔧 HÀM TIỆN ÍCH
# ==========================================================

def normalize(text: str) -> str:
    return (text or "").lower().strip()


def contains(text: str, *words: str) -> bool:
    return any(w in text for w in words)


def suggest(*items: str) -> str:
    if not items:
        return ""
    s = "• " + "\n• ".join(items)
    return f"\n\n👉 Bạn có thể hỏi thêm:\n{s}"


def format_money(v: float | int | None) -> str:
    v = v or 0
    return f"{v:,.0f} VNĐ"


def safe_total(o) -> float:
    """Ưu tiên total → amount → 0"""
    if hasattr(o, "total") and o.total is not None:
        return float(o.total)
    if hasattr(o, "amount") and o.amount is not None:
        return float(o.amount)
    return 0.0


def today_str() -> str:
    return date.today().strftime("%d/%m/%Y")


# ==========================================================
# 🔎 HÀM LẤY DỮ LIỆU (CÓ XỬ LÝ TRƯỜNG HỢP CHƯA CÓ BẢNG)
# ==========================================================

def get_model(name: str):
    """Lấy model trong app.models, trả None nếu chưa định nghĩa."""
    return getattr(models, name, None)


# ---------- ĐƠN HÀNG & DOANH THU ----------

def completed_orders(db: Session):
    Order = get_model("Order")
    if not Order:
        return []
    orders = db.query(Order).all()
    result = []
    for o in orders:
        status = normalize(getattr(o, "status", "") or "")
        if status in ["hoàn thành", "completed", "thành công", "success"]:
            result.append(o)
    return result


def all_orders(db: Session):
    Order = get_model("Order")
    if not Order:
        return []
    return db.query(Order).all()


def get_revenue_total(db: Session) -> float:
    return sum(safe_total(o) for o in completed_orders(db))


def get_revenue_today(db: Session) -> float:
    today = date.today()
    return sum(
        safe_total(o) for o in completed_orders(db)
        if getattr(o, "date", None) == today
    )


def get_revenue_year(db: Session, year: int | None = None) -> float:
    if year is None:
        year = date.today().year
    return sum(
        safe_total(o) for o in completed_orders(db)
        if getattr(o, "date", None) and o.date.year == year
    )


def get_revenue_monthly(db: Session, year: int | None = None) -> dict[int, float]:
    if year is None:
        year = date.today().year
    monthly: dict[int, float] = {}
    for o in completed_orders(db):
        d = getattr(o, "date", None)
        if not d or d.year != year:
            continue
        m = d.month
        monthly[m] = monthly.get(m, 0.0) + safe_total(o)
    return monthly


def get_revenue_last_2_months(db: Session):
    """Trả về (tháng_trước, doanh_thu), (tháng_này, doanh_thu) để so sánh xu hướng."""
    today = date.today()
    this_month = date(today.year, today.month, 1)
    last_month = (this_month - timedelta(days=1)).replace(day=1)

    def _month_revenue(month_date: date) -> float:
        y, m = month_date.year, month_date.month
        return sum(
            safe_total(o) for o in completed_orders(db)
            if getattr(o, "date", None)
            and o.date.year == y and o.date.month == m
        )

    return (
        (last_month.month, _month_revenue(last_month)),
        (this_month.month, _month_revenue(this_month)),
    )


# ---------- SẢN PHẨM & KHO ----------

def all_products(db: Session):
    Product = get_model("Product")
    if not Product:
        return []
    return db.query(Product).all()


def low_stock_products(db: Session, threshold: int = 5):
    products = all_products(db)
    low = []
    for p in products:
        qty = getattr(p, "stock", getattr(p, "quantity", 0)) or 0
        if qty <= threshold:
            low.append((p, qty))
    return low


def top_products(db: Session, limit: int = 5):
    products = all_products(db)
    if not products:
        return []

    # Đếm số lượt xuất hiện trong đơn hoàn thành
    counts: dict[int, int] = {}
    for o in completed_orders(db):
        pid = getattr(o, "product_id", None)
        if pid is None:
            continue
        counts[pid] = counts.get(pid, 0) + 1

    ranked = sorted(
        products,
        key=lambda p: counts.get(getattr(p, "id", 0), 0),
        reverse=True,
    )
    out = []
    for p in ranked[:limit]:
        out.append({
            "name": getattr(p, "name", f"SP#{getattr(p, 'id', '?')}"),
            "sold": counts.get(getattr(p, "id", 0), 0),
        })
    return out


# ---------- KHÁCH HÀNG ----------

def all_customers(db: Session):
    Customer = get_model("Customer")
    if not Customer:
        return []
    return db.query(Customer).all()


def top_customers(db: Session, limit: int = 5):
    customers = all_customers(db)
    if not customers:
        return []

    money: dict[int, float] = {}
    for o in completed_orders(db):
        cid = getattr(o, "customer_id", None)
        if cid is None:
            continue
        money[cid] = money.get(cid, 0.0) + safe_total(o)

    ranked = sorted(
        customers,
        key=lambda c: money.get(getattr(c, "id", 0), 0.0),
        reverse=True,
    )
    out = []
    for c in ranked[:limit]:
        cid = getattr(c, "id", 0)
        out.append({
            "name": getattr(c, "name", f"KH#{cid}"),
            "spent": money.get(cid, 0.0),
        })
    return out


def new_customers(db: Session, limit: int = 5):
    customers = all_customers(db)
    customers.sort(key=lambda c: getattr(c, "id", 0), reverse=True)
    return customers[:limit]


# ---------- NHÂN VIÊN, HỢP ĐỒNG, LƯƠNG ----------

def all_employees(db: Session):
    Employee = get_model("Employee")
    if not Employee:
        return []
    return db.query(Employee).all()


def contracts_expiring_soon(db: Session, days: int = 30):
    Contract = get_model("Contract")
    if not Contract:
        return []
    today = date.today()
    end_limit = today + timedelta(days=days)
    contracts = db.query(Contract).all()
    result = []
    for c in contracts:
        end_date = getattr(c, "end_date", None)
        status = normalize(getattr(c, "status", "") or "")
        if not end_date:
            continue
        if today <= end_date <= end_limit and status not in ["đã kết thúc", "ended"]:
            result.append(c)
    return result


def salary_stats(db: Session):
    Salary = get_model("Salary")
    if not Salary:
        return None

    salaries = db.query(Salary).all()
    if not salaries:
        return None

    totals = [getattr(s, "total", 0.0) or 0.0 for s in salaries]
    if not totals:
        return None

    avg = sum(totals) / len(totals)
    max_salary = max(totals)
    min_salary = min(totals)
    return {
        "count": len(totals),
        "avg": avg,
        "max": max_salary,
        "min": min_salary,
    }


# ---------- TASKS ----------

def all_tasks(db: Session):
    Task = get_model("Task")
    if not Task:
        return []
    return db.query(Task).all()


def tasks_summary(db: Session):
    tasks = all_tasks(db)
    summary = {"total": 0, "todo": 0, "in_progress": 0, "done": 0, "overdue": 0}
    today = date.today()

    for t in tasks:
        summary["total"] += 1
        status = normalize(getattr(t, "status", "todo") or "todo")
        deadline = getattr(t, "deadline", None)

        if status in ["todo", "to do"]:
            summary["todo"] += 1
        elif status in ["in_progress", "in progress", "doing", "đang làm"]:
            summary["in_progress"] += 1
        elif status in ["done", "hoàn thành", "completed"]:
            summary["done"] += 1

        if deadline and deadline < today and status != "done":
            summary["overdue"] += 1

    return summary


def overdue_tasks(db: Session, limit: int = 5):
    tasks = all_tasks(db)
    today = date.today()
    overdue_list = []

    for t in tasks:
        status = normalize(getattr(t, "status", "todo") or "todo")
        deadline = getattr(t, "deadline", None)
        if deadline and deadline < today and status not in ["done", "completed", "hoàn thành"]:
            overdue_list.append(t)

    overdue_list.sort(key=lambda x: getattr(x, "deadline", today) or today)
    return overdue_list[:limit]


# ---------- CHẤM CÔNG ----------

def attendance_recent(db: Session, days: int = 7):
    Attendance = get_model("Attendance")
    if not Attendance:
        return []
    today = date.today()
    start = today - timedelta(days=days)
    records = db.query(Attendance).all()
    return [a for a in records if start <= getattr(a, "date", today) <= today]


def late_attendance(db: Session, days: int = 7):
    recents = attendance_recent(db, days=days)
    out = []
    for a in recents:
        status = normalize(getattr(a, "status", "") or "")
        if "late" in status or "trễ" in status:
            out.append(a)
    return out


# ---------- PHÚC LỢI, THÔNG BÁO ----------

def open_benefits(db: Session):
    BenefitProgram = get_model("BenefitProgram")
    if not BenefitProgram:
        return []
    today = date.today()
    programs = db.query(BenefitProgram).all()
    result = []
    for p in programs:
        status = normalize(getattr(p, "status", "open") or "open")
        start = getattr(p, "registration_start", None)
        end = getattr(p, "registration_end", None)
        if status != "open":
            continue
        if start and today < start:
            continue
        if end and today > end:
            continue
        result.append(p)
    return result


def recent_notifications(db: Session, limit: int = 5):
    Notification = get_model("Notification")
    if not Notification:
        return []
    noti = db.query(Notification).all()
    noti.sort(key=lambda n: getattr(n, "created_at", datetime.utcnow()), reverse=True)
    return noti[:limit]


# ==========================================================
# 🤖 TUẤN AI 3.0 – XỬ LÝ HỘI THOẠI
# ==========================================================

@router.post("/chat")
def ai_chat(
    prompt: str = Body(..., embed=True),
    db: Session = Depends(database.get_db),
):
    """
    Chatbot chính: nhận 'prompt' và trả về 'reply'.
    Frontend gọi: POST /ai/chat { "prompt": "..." }
    """
    p = normalize(prompt)

    # Một số số liệu tổng hợp dùng nhiều lần
    employees = all_employees(db)
    customers = all_customers(db)
    products = all_products(db)
    orders = all_orders(db)
    orders_done = completed_orders(db)

    employees_count = len(employees)
    customers_count = len(customers)
    products_count = len(products)
    total_orders = len(orders)

    revenue_total = get_revenue_total(db)
    revenue_today = get_revenue_today(db)
    revenue_year_val = get_revenue_year(db)
    monthly = get_revenue_monthly(db)

    # ======================================================
    # 1. CHÀO HỎI – GIỚI THIỆU
    # ======================================================
    if contains(p, "chào", "hello", "hi", "hey", "xin chao", "tuan ai", "tuấn ai"):
        return {
            "reply": (
                "Xin chào 👋, tôi là **Trợ lý Tuấn AI 3.0**.\n"
                "Tôi có thể giúp bạn xem **doanh thu, đơn hàng, kho, nhân sự, chấm công, lương, hợp đồng, task, phúc lợi, CRM**...\n"
                + suggest(
                    "Doanh thu hôm nay?",
                    "Đơn hàng gần đây?",
                    "Sản phẩm nào bán chạy?",
                    "Có task nào đang trễ deadline không?"
                )
            )
        }

    # ======================================================
    # 2. THỜI GIAN – HÔM NAY
    # ======================================================
    if contains(p, "hôm nay", "today", "ngày mấy", "hom nay la ngay"):
        return {
            "reply": (
                f"📅 Hôm nay là **{today_str()}**.\n"
                f"💰 Doanh thu hôm nay (đơn hoàn thành): **{format_money(revenue_today)}**.\n"
                + suggest("Doanh thu năm nay?", "Đơn hàng hôm nay?", "Tình hình task hiện tại?")
            )
        }

    # ======================================================
    # 3. DOANH THU – TỔNG, THÁNG, NĂM, XU HƯỚNG
    # ======================================================

    # Doanh thu tổng
    if contains(p, "doanh thu", "revenue") and not contains(p, "tháng", "thang", "năm", "nam"):
        return {
            "reply": (
                f"💰 **Doanh thu tích lũy** (chỉ tính đơn hoàn thành) là **{format_money(revenue_total)}**.\n"
                f"📦 Số đơn hoàn thành: **{len(orders_done)}** / tổng **{total_orders}** đơn.\n"
                + suggest("Doanh thu hôm nay?", "Doanh thu theo từng tháng?", "Top khách hàng chi nhiều nhất?")
            )
        }

    # Doanh thu theo tháng
    if contains(p, "doanh thu tháng", "theo tháng", "theo thang", "thang nay", "tháng này"):
        if not monthly:
            return {"reply": "Hiện chưa có dữ liệu doanh thu theo tháng (chưa có đơn hoàn thành)."}

        lines = []
        for m, v in sorted(monthly.items()):
            lines.append(f"- Tháng {m}: **{format_money(v)}**")
        text = "📊 **Doanh thu theo từng tháng trong năm nay:**\n" + "\n".join(lines)
        return {"reply": text + suggest("Xu hướng doanh thu 2 tháng gần đây?", "Top sản phẩm bán chạy?")}

    # Doanh thu năm nay
    if contains(p, "doanh thu năm", "doanh thu nam", "năm nay", "nam nay", "year revenue"):
        return {
            "reply": (
                f"📆 **Doanh thu năm nay** là **{format_money(revenue_year_val)}**.\n"
                + suggest("Doanh thu theo tháng?", "So sánh tháng này và tháng trước?")
            )
        }

    # Xu hướng doanh thu
    if contains(p, "xu hướng", "xu huong", "tăng hay giảm", "tang hay giam", "so sánh tháng", "so sanh thang"):
        (m_last, rev_last), (m_this, rev_this) = get_revenue_last_2_months(db)
        diff = rev_this - rev_last
        if rev_last == 0:
            percent = "không thể tính (tháng trước 0 VNĐ)"
        else:
            percent = f"{diff / rev_last * 100:.1f}%"

        direction = "📈 tăng" if diff > 0 else ("📉 giảm" if diff < 0 else "⚖ gần như không đổi")
        return {
            "reply": (
                f"📊 So sánh doanh thu:\n"
                f"- Tháng {m_last}: **{format_money(rev_last)}**\n"
                f"- Tháng {m_this}: **{format_money(rev_this)}**\n"
                f"➡ Xu hướng: {direction} ({'+' if diff>0 else ''}{format_money(diff)}; thay đổi {percent})."
            )
        }

    # ======================================================
    # 4. ĐƠN HÀNG
    # ======================================================
    if contains(p, "đơn hoàn thành", "đơn thành công", "order thành công"):
        return {"reply": f"📦 Số đơn **đã hoàn thành**: **{len(orders_done)}** trên tổng **{total_orders}** đơn."}

    if contains(p, "đơn hàng hôm nay", "đơn hôm nay"):
        today = date.today()
        today_orders = [o for o in orders if getattr(o, "date", None) == today]
        done_today = [o for o in today_orders if o in orders_done]
        return {
            "reply": (
                f"📦 Hôm nay có **{len(today_orders)}** đơn hàng, "
                f"trong đó **{len(done_today)}** đơn đã hoàn thành."
            )
        }

    if contains(p, "đơn hàng", "order", "đơn gần đây", "don gan day"):
        recent = sorted(orders, key=lambda o: getattr(o, "id", 0), reverse=True)[:5]
        if not recent:
            return {"reply": "Hiện chưa có đơn hàng nào trong hệ thống."}

        lines = []
        for o in recent:
            oid = getattr(o, "id", "?")
            c_name = getattr(o, "customer_name", None)
            if not c_name and getattr(o, "customer_id", None):
                # cố gắng map khách hàng
                cust = next((c for c in customers if getattr(c, "id", None) == o.customer_id), None)
                c_name = getattr(cust, "name", f"KH#{o.customer_id}") if cust else f"KH#{o.customer_id}"
            status = getattr(o, "status", "N/A")
            amount = format_money(safe_total(o))
            lines.append(f"- Đơn #{oid} — {c_name} — {status} — {amount}")

        text = "📝 **5 đơn hàng gần đây:**\n" + "\n".join(lines)
        return {"reply": text + suggest("Đơn hoàn thành có bao nhiêu?", "Doanh thu từ đơn hoàn thành?")}

    # ======================================================
    # 5. SẢN PHẨM & KHO
    # ======================================================
    if contains(p, "bao nhiêu sản phẩm", "tổng sản phẩm", "tong san pham", "so san pham"):
        return {
            "reply": (
                f"📦 Hệ thống đang quản lý **{products_count} sản phẩm**."
                + suggest("Sản phẩm nào bán chạy?", "Sản phẩm nào sắp hết hàng?")
            )
        }

    if contains(p, "bán chạy", "top sản phẩm", "top san pham"):
        top = top_products(db)
        if not top:
            return {"reply": "Chưa có dữ liệu sản phẩm bán chạy (chưa có đơn hoàn thành)."}

        lines = []
        for i, t in enumerate(top, 1):
            lines.append(f"{i}. {t['name']} — {t['sold']} lượt mua")
        text = "🔥 **Top sản phẩm bán chạy:**\n" + "\n".join(lines)
        return {"reply": text}

    if contains(p, "tồn kho", "ton kho", "sắp hết hàng", "sap het hang", "cảnh báo kho", "canh bao kho", "low stock"):
        low = low_stock_products(db)
        if not low:
            return {"reply": "🎉 Tất cả sản phẩm đều còn đủ hàng, chưa có cảnh báo tồn kho."}

        lines = []
        for p_obj, qty in low:
            name = getattr(p_obj, "name", f"SP#{getattr(p_obj, 'id', '?')}")
            lines.append(f"- {name}: còn **{qty}** trong kho")
        text = "⚠ **Sản phẩm sắp hết hàng / tồn kho thấp:**\n" + "\n".join(lines)
        return {"reply": text}

    # ======================================================
    # 6. KHÁCH HÀNG & CRM
    # ======================================================
    if contains(p, "bao nhiêu khách", "tổng khách", "tong khach", "so khach hang"):
        return {
            "reply": (
                f"👥 Hệ thống hiện có **{customers_count} khách hàng**."
                + suggest("Khách hàng mới nhất?", "Top khách hàng chi nhiều?")
            )
        }

    if contains(p, "khách hàng mới", "khach hang moi"):
        new = new_customers(db)
        if not new:
            return {"reply": "Chưa có khách hàng nào trong hệ thống."}
        lines = []
        for c in new:
            lines.append(f"- {getattr(c, 'name', 'Không tên')} ({getattr(c, 'email', 'không email')})")
        text = "🆕 **Một số khách hàng mới nhất:**\n" + "\n".join(lines)
        return {"reply": text}

    if contains(p, "top khách", "top khach", "khách chi nhiều", "khach chi nhieu"):
        top_c = top_customers(db)
        if not top_c:
            return {"reply": "Chưa có dữ liệu chi tiêu của khách hàng (cần có đơn hoàn thành)."}

        lines = []
        for i, t in enumerate(top_c, 1):
            lines.append(f"{i}. {t['name']} — {format_money(t['spent'])}")
        text = "👑 **Top khách hàng chi tiêu nhiều nhất:**\n" + "\n".join(lines)
        return {"reply": text}

    # ======================================================
    # 7. NHÂN VIÊN – HỢP ĐỒNG – LƯƠNG
    # ======================================================
    if contains(p, "bao nhiêu nhân viên", "tổng nhân viên", "tong nhan vien", "so nhan vien"):
        return {
            "reply": (
                f"👨‍💼 Công ty hiện có **{employees_count} nhân viên**."
                + suggest("Hợp đồng nào sắp hết hạn?", "Tình hình lương nhân viên?")
            )
        }

    if contains(p, "hợp đồng sắp hết", "hop dong sap het", "hop dong sap het han", "sắp hết hợp đồng"):
        contracts = contracts_expiring_soon(db, days=30)
        if not contracts:
            return {"reply": "Trong 30 ngày tới không có hợp đồng lao động nào sắp hết hạn."}

        lines = []
        for c in contracts:
            emp = next((e for e in employees if getattr(e, "id", None) == getattr(c, "employee_id", None)), None)
            emp_name = getattr(emp, "name", f"NV#{getattr(c, 'employee_id', '?')}") if emp else f"NV#{getattr(c, 'employee_id', '?')}"
            lines.append(f"- {emp_name} — loại {getattr(c, 'contract_type', '?')} — hết hạn: {getattr(c, 'end_date', '')}")
        text = "📜 **Các hợp đồng sắp hết hạn trong 30 ngày tới:**\n" + "\n".join(lines)
        return {"reply": text}

    if contains(p, "lương", "luong", "tiền lương", "tien luong", "bảng lương", "bang luong"):
        stats = salary_stats(db)
        if not stats:
            return {"reply": "Chưa có dữ liệu bảng lương trong hệ thống."}
        return {
            "reply": (
                "💵 **Thống kê nhanh về lương nhân viên:**\n"
                f"- Số bản ghi lương: **{stats['count']}**\n"
                f"- Lương trung bình: **{format_money(stats['avg'])}**\n"
                f"- Lương thấp nhất: **{format_money(stats['min'])}**\n"
                f"- Lương cao nhất: **{format_money(stats['max'])}**"
            )
        }

    # ======================================================
    # 8. TASK / CÔNG VIỆC
    # ======================================================
    if contains(p, "task", "công việc", "cong viec", "nhiệm vụ", "nhiem vu", "việc cần làm"):
        summary = tasks_summary(db)
        if summary["total"] == 0:
            return {"reply": "Hiện chưa có công việc (task) nào trong hệ thống."}

        return {
            "reply": (
                "📝 **Tổng quan công việc hiện tại:**\n"
                f"- Tổng số task: **{summary['total']}**\n"
                f"- Chưa làm (todo): **{summary['todo']}**\n"
                f"- Đang làm (in_progress): **{summary['in_progress']}**\n"
                f"- Hoàn thành: **{summary['done']}**\n"
                f"- Quá hạn: **{summary['overdue']}**\n"
                + suggest("Có những task nào đang quá hạn?", "Thống kê doanh thu hôm nay?")
            )
        }

    if contains(p, "task quá hạn", "task qua han", "công việc trễ", "cong viec tre", "nhiệm vụ trễ", "nhiem vu tre"):
        over = overdue_tasks(db)
        if not over:
            return {"reply": "🎉 Hiện không có task nào quá hạn."}

        lines = []
        for t in over:
            title = getattr(t, "title", "Không tên")
            deadline = getattr(t, "deadline", None)
            assignee_name = getattr(t, "assigned_to_name", None)
            if not assignee_name and getattr(t, "assigned_to_id", None):
                emp = next((e for e in employees if getattr(e, "id", None) == t.assigned_to_id), None)
                assignee_name = getattr(emp, "name", f"NV#{t.assigned_to_id}") if emp else f"NV#{t.assigned_to_id}"
            lines.append(f"- {title} — giao cho {assignee_name or 'chưa gán'} — deadline: {deadline}")
        text = "⚠ **Một số task đang quá hạn:**\n" + "\n".join(lines)
        return {"reply": text}

    # ======================================================
    # 9. CHẤM CÔNG
    # ======================================================
    if contains(p, "chấm công", "cham cong", "đi làm", "di lam", "đi trễ", "di tre", "history cham cong"):
        late = late_attendance(db, days=7)
        total_recent = attendance_recent(db, days=7)
        if not total_recent:
            return {"reply": "Chưa có dữ liệu chấm công trong 7 ngày gần đây."}

        return {
            "reply": (
                "📊 **Chấm công 7 ngày gần đây (toàn hệ thống):**\n"
                f"- Tổng số bản ghi chấm công: **{len(total_recent)}**\n"
                f"- Số lần đi trễ: **{len(late)}**\n"
                + suggest("Chi tiết task quá hạn?", "Doanh thu 2 tháng gần đây?")
            )
        }

    # ======================================================
    # 10. PHÚC LỢI & THÔNG BÁO
    # ======================================================
    if contains(p, "phúc lợi", "phuc loi", "benefit", "chương trình phúc lợi", "chuong trinh phuc loi"):
        benefits = open_benefits(db)
        if not benefits:
            return {"reply": "Hiện chưa có chương trình phúc lợi nào đang mở đăng ký."}

        lines = []
        for b in benefits:
            lines.append(
                f"- {getattr(b, 'title', 'Chương trình')} "
                f"(từ {getattr(b, 'registration_start', '')} đến {getattr(b, 'registration_end', '')})"
            )
        text = "🎁 **Chương trình phúc lợi đang mở:**\n" + "\n".join(lines)
        return {"reply": text}

    if contains(p, "thông báo", "thong bao", "notification"):
        noti = recent_notifications(db)
        if not noti:
            return {"reply": "Hiện chưa có thông báo nội bộ nào."}

        lines = []
        for n in noti:
            created = getattr(n, "created_at", None)
            created_str = created.strftime("%d/%m/%Y %H:%M") if isinstance(created, datetime) else ""
            lines.append(f"- [{created_str}] {getattr(n, 'title', '')}")
        text = "🔔 **Một số thông báo gần đây:**\n" + "\n".join(lines)
        return {"reply": text}

    # ======================================================
    # 11. LỜI CẢM ƠN / TẠM BIỆT
    # ======================================================
    if contains(p, "cảm ơn", "cam on", "thanks", "thank you"):
        return {"reply": "Không có gì ạ 😊. Nếu cần, bạn cứ hỏi thêm về doanh thu, đơn hàng hoặc nhân sự."}

    if contains(p, "tạm biệt", "tam biet", "bye", "goodbye", "hẹn gặp lại", "hen gap lai"):
        return {"reply": "Tạm biệt 👋. Chúc bạn một ngày làm việc hiệu quả!"}

    # ======================================================
    # 12. FALLBACK – KHÔNG HIỂU Ý
    # ======================================================
    return {
        "reply": (
            "Tôi chưa hiểu rõ câu hỏi của bạn 😅.\n"
            "Bạn có thể hỏi về **doanh thu, đơn hàng, kho, khách hàng, nhân viên, task, chấm công, phúc lợi...**"
            + suggest(
                "Doanh thu hôm nay?",
                "Sản phẩm nào bán chạy?",
                "Có task nào đang quá hạn?",
                "Top khách hàng chi nhiều nhất?"
            )
        )
    }
