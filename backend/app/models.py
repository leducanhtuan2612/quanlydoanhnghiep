from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Text,
    Date,
    Boolean,
    ForeignKey,
    DateTime,
    Time,
)
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


# =====================================================
# 👨‍💼 BẢNG NHÂN VIÊN
# =====================================================
class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)

    department = Column(String(50), nullable=True)
    active = Column(Boolean, default=True)

    avatar = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    gender = Column(String(10), nullable=True)
    birthday = Column(Date, nullable=True)

    start_date = Column(Date, nullable=True)
    position = Column(String(100), nullable=True)
    citizen_id = Column(String(30), nullable=True)
    address = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)

    salary_base = Column(Integer, default=0)
    salary_daily = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 🔗 1 - N: Employee → Attendance
    attendances = relationship(
        "Attendance",
        back_populates="employee",
        cascade="all, delete-orphan",
    )

    # 🔗 1 - N: Employee → BenefitRegistration
    benefit_registrations = relationship(
        "BenefitRegistration",
        back_populates="employee",
        cascade="all, delete-orphan",
    )

    # 🔗 1 - N: Employee → Contracts  ⭐ QUAN TRỌNG
    contracts = relationship(
        "Contract",
        back_populates="employee",
        cascade="all, delete-orphan",
    )


# =====================================================
# 👥 BẢNG KHÁCH HÀNG
# =====================================================
class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    address = Column(String(255), nullable=True)

    orders = relationship("Order", back_populates="customer", cascade="all, delete")
    notes = relationship("CustomerNote", back_populates="customer", cascade="all, delete")
    email_logs = relationship("EmailLog", back_populates="customer", cascade="all, delete")


# =====================================================
# 📦 BẢNG SẢN PHẨM (MỞ RỘNG)
# =====================================================
class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    category = Column(String(100), nullable=True)

    price = Column(Float, nullable=False)
    stock = Column(Integer, default=0)
    description = Column(Text, nullable=True)
    image_url = Column(String(255), nullable=True)

    # ⭐ THÔNG TIN MỞ RỘNG
    brand = Column(String(100), nullable=True)         # thương hiệu
    supplier = Column(String(150), nullable=True)      # nhà cung cấp
    origin = Column(String(100), nullable=True)        # xuất xứ
    size = Column(String(100), nullable=True)          # kích thước
    weight = Column(String(50), nullable=True)         # trọng lượng
    material = Column(String(100), nullable=True)      # chất liệu
    usage = Column(String(255), nullable=True)         # công dụng
    import_date = Column(Date, nullable=True)          # ngày nhập kho
    sku = Column(String(100), nullable=True, unique=True)  # mã sản phẩm

    # Thông số kỹ thuật dạng JSON (tuỳ chọn)
    specs = Column(Text, nullable=True)

    # ⭐ QUAN HỆ
    orders = relationship("Order", back_populates="product", cascade="all, delete")
    inventories = relationship("Inventory", back_populates="product", cascade="all, delete")



# =====================================================
# 🏬 KHO HÀNG
# =====================================================
class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(
        Integer,
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
    )
    location = Column(String(100), nullable=True)
    quantity = Column(Integer, default=0)
    date_added = Column(Date, nullable=True)
    note = Column(Text, nullable=True)

    product = relationship("Product", back_populates="inventories")


# =====================================================
# 🧾 ĐƠN HÀNG
# =====================================================
class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="SET NULL"))
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"))

    date = Column(Date, nullable=False)
    status = Column(String(50), default="Đang xử lý")
    quantity = Column(Integer, default=1)
    amount = Column(Float, nullable=False)
    category = Column(String(100), nullable=True)
    region = Column(String(100), nullable=True)

    customer = relationship("Customer", back_populates="orders")
    product = relationship("Product", back_populates="orders")


# =====================================================
# 📈 BÁO CÁO
# =====================================================
class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=True)


# =====================================================
# ⚙️ CÀI ĐẶT
# =====================================================
class Setting(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(255), unique=True, nullable=False)
    value = Column(String(255), nullable=True)


# =====================================================
# 👑 QUẢN TRỊ
# =====================================================
class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String)
    username = Column(String, unique=True)
    email = Column(String, unique=True)
    password = Column(String)
    role = Column(String, default="employee")
    is_active = Column(Boolean, default=True)

    # ⭐ GẮN VỚI NHÂN VIÊN
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    employee = relationship("Employee")


# =====================================================
# 📝 CRM – GHI CHÚ KHÁCH HÀNG
# =====================================================
class CustomerNote(Base):
    __tablename__ = "customer_notes"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"))

    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=True)
    created_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="notes")


# =====================================================
# 📨 CRM – TEMPLATE EMAIL
# =====================================================
class EmailTemplate(Base):
    __tablename__ = "email_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, nullable=False)
    subject = Column(String(200), nullable=False)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    campaigns = relationship("EmailCampaign", back_populates="template", cascade="all, delete")


# =====================================================
# 📣 CRM – CHIẾN DỊCH EMAIL
# =====================================================
class EmailCampaign(Base):
    __tablename__ = "email_campaigns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    template_id = Column(Integer, ForeignKey("email_templates.id", ondelete="CASCADE"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    template = relationship("EmailTemplate", back_populates="campaigns")
    logs = relationship("EmailLog", back_populates="campaign", cascade="all, delete")


# =====================================================
# 📬 CRM – LOG EMAIL
# =====================================================
class EmailLog(Base):
    __tablename__ = "email_logs"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("email_campaigns.id", ondelete="CASCADE"))
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"))

    email = Column(String(150), nullable=False)
    status = Column(String(50), default="pending")
    error_message = Column(Text, nullable=True)
    sent_at = Column(DateTime, nullable=True)

    campaign = relationship("EmailCampaign", back_populates="logs")
    customer = relationship("Customer", back_populates="email_logs")


# =====================================================
# 🕒 CHẤM CÔNG (ATTENDANCE)
# =====================================================
class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)

    date = Column(Date, nullable=False)
    check_in = Column(Time, nullable=True)
    check_out = Column(Time, nullable=True)
    status = Column(String(20), default="On time")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("Employee", back_populates="attendances")


# =====================================================
# 🎁 PHÚC LỢI (BENEFITS)
# =====================================================
class BenefitProgram(Base):
    __tablename__ = "benefit_programs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    registration_start = Column(Date, nullable=True)
    registration_end = Column(Date, nullable=True)

    location = Column(String(255), nullable=True)
    status = Column(String(20), default="open")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    registrations = relationship(
        "BenefitRegistration",
        back_populates="benefit",
        cascade="all, delete",
    )


class BenefitRegistration(Base):
    __tablename__ = "benefit_registrations"

    id = Column(Integer, primary_key=True, index=True)
    benefit_id = Column(Integer, ForeignKey("benefit_programs.id", ondelete="CASCADE"))
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"))

    registered_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), default="registered")

    benefit = relationship("BenefitProgram", back_populates="registrations")
    employee = relationship("Employee", back_populates="benefit_registrations")


# =====================================================
# 📜 HỢP ĐỒNG LAO ĐỘNG
# =====================================================
class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    contract_type = Column(String)
    start_date = Column(Date)
    end_date = Column(Date)
    basic_salary = Column(Float)
    status = Column(String, default="active")  # active / ended
    note = Column(Text, nullable=True)

    employee = relationship("Employee", back_populates="contracts")
# =====================================================
# Thông báo
# =====================================================
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    time = Column(String, default="Vừa xong")
    created_at = Column(DateTime, default=datetime.utcnow)
# =====================================================
# ✅ CÔNG VIỆC (TASKS)
# =====================================================
class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # low / medium / high
    priority = Column(String(20), default="medium")

    # todo / in_progress / done
    status = Column(String(20), default="todo")

    # 0 - 100
    progress = Column(Integer, default=0)

    deadline = Column(Date, nullable=True)

    # Nhân viên được giao
    assigned_to_id = Column(
        Integer,
        ForeignKey("employees.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Admin tạo task (có thể null)
    created_by_id = Column(
        Integer,
        ForeignKey("admins.id", ondelete="SET NULL"),
        nullable=True,
    )

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    assigned_to = relationship("Employee", backref="tasks")
    created_by = relationship("Admin")
    attachments = relationship(
        "TaskAttachment",
        back_populates="task",
        cascade="all, delete-orphan",
    )


class TaskAttachment(Base):
    __tablename__ = "task_attachments"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"))
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(255), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task", back_populates="attachments")
