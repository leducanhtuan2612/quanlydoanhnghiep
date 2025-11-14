from datetime import date, datetime
from pydantic import BaseModel
from typing import Optional, List

from datetime import date
from typing import Optional


# ==========================================================
# 👩‍💼 EMPLOYEES (CHUẨN ĐẦY ĐỦ)
# ==========================================================
from pydantic import BaseModel
from typing import Optional
from datetime import date


class EmployeeBase(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    active: Optional[bool] = None

    # Hồ sơ chi tiết
    avatar: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    birthday: Optional[date] = None
    address: Optional[str] = None
    citizen_id: Optional[str] = None
    position: Optional[str] = None
    start_date: Optional[date] = None
    notes: Optional[str] = None


class EmployeeCreate(EmployeeBase):
    name: str
    email: str


class EmployeeUpdate(EmployeeBase):
    """Cho phép update từng trường (không bắt buộc)"""
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

# ==========================================================
# 👥 CUSTOMERS
# ==========================================================
class CustomerBase(BaseModel):
    name: str
    email: Optional[str] = None          # ❗ FIX email không validate nữa
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


# ==========================================================
# 📐 ORDER SHORT (CRM)
# ==========================================================
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
# ⚙️ SETTINGS
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
# 👨‍💻 ADMINS
# ==========================================================
class AdminBase(BaseModel):
    username: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    is_active: bool = True
    role: Optional[str] = "user"


class AdminCreate(AdminBase):
    password: str


class AdminUpdate(BaseModel):
    username: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class AdminOut(AdminBase):
    id: int

    class Config:
        from_attributes = True


# ==========================================================
# 📝 CRM – CUSTOMER NOTES
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
# 📨 CRM – EMAIL TEMPLATES
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


# ==========================================================
# 📣 CRM – EMAIL CAMPAIGNS
# ==========================================================
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


# ==========================================================
# 📬 CRM – EMAIL LOGS
# ==========================================================
class EmailLogOut(BaseModel):
    id: int
    campaign_id: int
    customer_id: int
    email: Optional[str] = None            # ❗ FIX EMAIL
    status: str
    error_message: Optional[str] = None
    sent_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==========================================================
# 🔍 CRM – CUSTOMER DETAIL
# ==========================================================
class CustomerDetailCRM(BaseModel):
    customer: CustomerOut
    notes: List[CustomerNoteOut]
    orders: List[OrderShort]

    class Config:
        from_attributes = True


class EmployeeProfileBase(BaseModel):
    name: str
    email: str
    phone: Optional[str]
    gender: Optional[str]
    dob: Optional[date]
    department: str
    position: Optional[str]
    address: Optional[str]
    join_date: Optional[date]
    status: Optional[str] = "Đang làm việc"
    avatar: Optional[str] = None

class EmployeeProfileCreate(EmployeeProfileBase):
    pass

class EmployeeProfileUpdate(BaseModel):
    name: Optional[str]
    phone: Optional[str]
    gender: Optional[str]
    dob: Optional[date]
    department: Optional[str]
    position: Optional[str]
    address: Optional[str]
    join_date: Optional[date]
    status: Optional[str]
    avatar: Optional[str]

class EmployeeProfileOut(EmployeeProfileBase):
    id: int
    class Config:
        orm_mode = True


# app/schemas/attendance.py
from pydantic import BaseModel
from datetime import date, time
from typing import Optional


class AttendanceOut(BaseModel):
    id: int
    employee_name: str
    date: date
    check_in: Optional[time]
    check_out: Optional[time]
    status: str

    class Config:
        orm_mode = True
