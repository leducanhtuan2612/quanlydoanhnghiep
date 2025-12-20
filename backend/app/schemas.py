# app/schemas.py
from datetime import date, datetime, time
from typing import Optional, List
from pydantic import BaseModel


# ==========================================================
# 🧍 EMPLOYEES
# ==========================================================
class EmployeeBase(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    active: Optional[bool] = None

    avatar: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    birthday: Optional[date] = None
    address: Optional[str] = None
    citizen_id: Optional[str] = None
    position: Optional[str] = None
    start_date: Optional[date] = None
    notes: Optional[str] = None
salary_base: Optional[int] = 0
salary_daily: Optional[int] = 0


class EmployeeCreate(EmployeeBase):
    name: str
    email: str


class EmployeeUpdate(EmployeeBase):
    pass


class EmployeeOut(EmployeeBase):
    id: int

    class Config:
        from_attributes = True


class EmployeePatch(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    active: Optional[bool] = None

    class Config:
        from_attributes = True
salary_base: Optional[int] = None
salary_daily: Optional[int] = None


# ==========================================================
# 👥 CUSTOMERS
# ==========================================================
class CustomerBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerOut(CustomerBase):
    id: int

    class Config:
        from_attributes = True


# ==========================================================
# 📦 PRODUCTS
# ==========================================================
class ProductBase(BaseModel):
    name: str
    category: Optional[str] = None
    price: float
    stock: int
    description: Optional[str] = None
    image_url: Optional[str] = None

    # ⭐ FIELD MỚI
    brand: Optional[str] = None
    supplier: Optional[str] = None
    size: Optional[str] = None
    weight: Optional[str] = None
    usage: Optional[str] = None
    import_date: Optional[date] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(ProductBase):
    pass


class ProductOut(ProductBase):
    id: int

    class Config:
        from_attributes = True


# ==========================================================
# 🏬 INVENTORY
# ==========================================================
class InventoryBase(BaseModel):
    product_id: int
    location: Optional[str] = None
    quantity: int
    date_added: Optional[date] = None
    note: Optional[str] = None


class InventoryCreate(InventoryBase):
    pass


class InventoryUpdate(InventoryBase):
    pass


class InventoryOut(InventoryBase):
    id: int
    product_name: Optional[str] = None

    class Config:
        from_attributes = True


# ==========================================================
# 🧾 ORDERS
# ==========================================================
class OrderBase(BaseModel):
    customer_id: int
    product_id: int
    quantity: int
    date: date
    status: str
    amount: float
    category: Optional[str] = None
    region: Optional[str] = None


class OrderCreate(OrderBase):
    pass


class OrderOut(OrderBase):
    id: int
    customer_name: Optional[str] = None
    product_name: Optional[str] = None
    remaining_stock: Optional[int] = None

    class Config:
        from_attributes = True


class OrderShort(BaseModel):
    id: int
    date: date
    amount: float
    status: str

    class Config:
        from_attributes = True


# ==========================================================
# 📊 REPORTS
# ==========================================================
class ReportBase(BaseModel):
    title: str
    content: str


class ReportCreate(ReportBase):
    pass


class ReportOut(ReportBase):
    id: int

    class Config:
        from_attributes = True


# ==========================================================
# ⚙ SETTINGS
# ==========================================================
class SettingBase(BaseModel):
    key: str
    value: str


class SettingCreate(SettingBase):
    pass


class SettingOut(SettingBase):
    id: int

    class Config:
        from_attributes = True


# ==========================================================
# 👤 ADMINS
# ==========================================================
class AdminBase(BaseModel):
    username: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    is_active: bool = True
    role: Optional[str] = "user"
    employee_id: Optional[int] = None   # ⭐ thêm vào đây — để optional


class AdminCreate(AdminBase):
    password: str


class AdminUpdate(BaseModel):
    username: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None
    employee_id: Optional[int] = None    # ⭐ cho phép cập nhật nếu role=employee


class AdminOut(AdminBase):
    id: int

    class Config:
        from_attributes = True

# ==========================================================
# 📝 CUSTOMER NOTES
# ==========================================================
class CustomerNoteBase(BaseModel):
    title: str
    content: Optional[str] = None


class CustomerNoteCreate(CustomerNoteBase):
    customer_id: int


class CustomerNoteOut(CustomerNoteBase):
    id: int
    customer_id: int
    created_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ==========================================================
# 📨 EMAIL TEMPLATE & CAMPAIGN
# ==========================================================
class EmailTemplateBase(BaseModel):
    name: str
    subject: str
    body: str


class EmailTemplateCreate(EmailTemplateBase):
    pass


class EmailTemplateOut(EmailTemplateBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class EmailCampaignBase(BaseModel):
    name: str
    template_id: int


class EmailCampaignCreate(EmailCampaignBase):
    pass


class EmailCampaignOut(EmailCampaignBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class EmailLogOut(BaseModel):
    id: int
    campaign_id: int
    customer_id: int
    email: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    sent_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==========================================================
# 🧾 CRM DETAIL
# ==========================================================
class CustomerDetailCRM(BaseModel):
    customer: CustomerOut
    notes: List[CustomerNoteOut]
    orders: List[OrderShort]

    class Config:
        from_attributes = True


# ==========================================================
# 🕒 ATTENDANCE
# ==========================================================
class AttendanceOut(BaseModel):
    id: int
    employee_name: str
    date: date
    check_in: Optional[time]
    check_out: Optional[time]
    status: str

    class Config:
        orm_mode = True


# ==========================================================
# 🎁 BENEFITS (PHÚC LỢI)
# ==========================================================
class BenefitProgramBase(BaseModel):
    title: str
    description: Optional[str] = None
    registration_start: Optional[date] = None
    registration_end: Optional[date] = None
    location: Optional[str] = None
    status: Optional[str] = "open"  # open / closed


class BenefitProgramCreate(BenefitProgramBase):
    pass


class BenefitProgramUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    registration_start: Optional[date] = None
    registration_end: Optional[date] = None
    location: Optional[str] = None
    status: Optional[str] = None


class BenefitProgramOut(BenefitProgramBase):
    id: int
    created_at: datetime
    updated_at: datetime
    is_registered: bool = False

    class Config:
        from_attributes = True


class BenefitRegistrationOut(BaseModel):
    id: int
    benefit_id: int
    employee_id: int
    registered_at: datetime
    status: str

    class Config:
        from_attributes = True


# ==========================================================
# 📜 HỢP ĐỒNG LAO ĐỘNG
# ==========================================================
class ContractBase(BaseModel):
    employee_id: int
    contract_type: str
    start_date: date
    end_date: date
    note: str | None = None


class ContractCreate(ContractBase):
    """
    Dùng để tạo hợp đồng mới.
    Không cần truyền basic_salary vì cố định 7tr.
    """
    pass


class ContractResponse(ContractBase):
    id: int
    status: str
    basic_salary: float  # vẫn trả về lương để hiển thị

    class Config:
        from_attributes = True
# ==========================================================
# 📜 HỢP ĐỒNG LAO ĐỘNG
# ==========================================================
class ContractBase(BaseModel):
    employee_id: int
    contract_type: str
    start_date: date
    end_date: date
    note: str | None = None


class ContractCreate(ContractBase):
    """
    Dùng để tạo hợp đồng mới.
    Không cần truyền basic_salary vì cố định 7tr.
    """
    pass


class ContractResponse(ContractBase):
    id: int
    status: str
    basic_salary: float  # vẫn trả về lương để hiển thị

    class Config:
        from_attributes = True


# ==========================================================
#Thông báo
# ==========================================================
class NotificationOut(BaseModel):
    id: int
    title: str
    time: str
    created_at: datetime

    class Config:
        from_attributes = True
class LoginUser(BaseModel):
    username: str
    password: str


class RegisterUser(BaseModel):
    full_name: str | None = None
    username: str
    email: str | None = None
    password: str

    # role là tùy chọn — chỉ admin mới gửi
    role: Optional[str] = None

    # employee_id cũng tùy chọn — chỉ dùng nếu role = employee
    employee_id: Optional[int] = None


    # ==========================================================
# 📌 BẢNG LƯƠNG (DÙNG Ở DASHBOARD QUẢN LÝ NHÂN VIÊN)
# ==========================================================
class SalaryOut(BaseModel):
    id: int                  # id nhân viên
    employee_name: str
    month: str               # "2025-02"
    base_salary: float
    bonus: float
    deduction: float
    total: float

    class Config:
        from_attributes = True


# ==========================================================
# 📌 DANH SÁCH PHÚC LỢI THEO NHÂN VIÊN
# ==========================================================
class BenefitOut(BaseModel):
    id: int                  # id của BenefitRegistration
    employee_name: str
    title: str
    start: date
    end: date
    status: str              # registered / canceled / ...

    class Config:
        from_attributes = True


# ==========================================================
# 📌 DANH SÁCH HỢP ĐỒNG THEO NHÂN VIÊN
# ==========================================================
class ContractOut(BaseModel):
    id: int
    employee_name: str
    contract_type: str
    start_date: date
    end_date: date
    status: str
    basic_salary: float
    note: Optional[str] = None
    file_url: Optional[str] = None  # sau này nếu bạn muốn lưu file

    class Config:
        from_attributes = True
# =====================================================
# ✅ TASKS – SCHEMAS
# =====================================================

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"  # low/medium/high
    status: str = "todo"      # todo/in_progress/done
    progress: int = 0
    deadline: Optional[date] = None
    assigned_to_id: Optional[int] = None


class TaskCreate(TaskBase):
    created_by_id: Optional[int] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    progress: Optional[int] = None
    deadline: Optional[date] = None
    assigned_to_id: Optional[int] = None


class TaskAttachmentOut(BaseModel):
    id: int
    file_name: str
    file_path: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


class TaskOut(TaskBase):
    id: int
    created_at: datetime
    updated_at: datetime
    assigned_to_name: Optional[str] = None
    created_by_id: Optional[int] = None
    attachments: List[TaskAttachmentOut] = []

    class Config:
        from_attributes = True


class TaskSummaryOut(BaseModel):
    total: int
    todo: int
    in_progress: int
    done: int
    overdue: int

from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ChatEmployeeOut(BaseModel):
    id: int
    name: str
    position: Optional[str]

    class Config:
        from_attributes = True


from typing import Optional

class ConversationOut(BaseModel):
    id: int
    type: str
    created_at: datetime
    other_employee: Optional[ChatEmployeeOut] = None

    class Config:
        from_attributes = True



class MessageOut(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    sender_name: str        # ⭐ THÊM
    content: str
    created_at: datetime

    class Config:
        from_attributes = True



class CreatePrivateConversation(BaseModel):
    other_employee_id: int

# ==========================================================
# 📅 WORK SCHEDULE
# ==========================================================
class WorkScheduleOut(BaseModel):
    id: int
    employee_id: int
    work_date: date
    shift: str
    note: Optional[str] = None

    class Config:
        from_attributes = True


# ==========================================================
# 📅 LEAVE REQUESTS
# ==========================================================
class LeaveRequestCreate(BaseModel):
    employee_id: int
    leave_type: str           # annual | sick | unpaid
    start_date: date
    end_date: date
    reason: Optional[str] = None

class LeaveDecision(BaseModel):
    status: str               # approved | rejected
    decision_note: Optional[str] = None
    approved_by_id: Optional[int] = None  # lấy từ admin login nếu có

class LeaveRequestOut(BaseModel):
    id: int
    employee_id: int
    leave_type: str
    start_date: date
    end_date: date
    reason: Optional[str] = None
    status: str

    approved_by_id: Optional[int] = None
    decision_note: Optional[str] = None
    decided_at: Optional[datetime] = None

    created_at: datetime

    class Config:
        from_attributes = True
