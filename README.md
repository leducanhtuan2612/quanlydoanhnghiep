🚀 HỆ THỐNG QUẢN LÝ DOANH NGHIỆP
FastAPI + PostgreSQL + React + Vite + AI Chatbot Tuấn
<p align="center"> <img src="https://img.shields.io/badge/FastAPI-Backend-009485?logo=fastapi&logoColor=white"/> <img src="https://img.shields.io/badge/PostgreSQL-Database-336791?logo=postgresql&logoColor=white"/> <img src="https://img.shields.io/badge/React-Frontend-61DAFB?logo=react&logoColor=black"/> <img src="https://img.shields.io/badge/Vite-Build-8A2BE2?logo=vite&logoColor=yellow"/> <img src="https://img.shields.io/badge/AI-Chatbot_Tuấn-orange?logo=python&logoColor=white"/> </p>
📌 1. Giới thiệu dự án

Hệ thống Quản lý Doanh nghiệp giúp doanh nghiệp vận hành hiệu quả các nghiệp vụ quan trọng:

Quản lý nhân viên

Quản lý tài khoản nhân viên

Quản lý khách hàng

Quản lý sản phẩm

Quản lý kho hàng

Quản lý đơn hàng

Hệ thống báo cáo – thống kê theo biểu đồ

Phân quyền người dùng

Chatbot hỗ trợ nội bộ (Tuấn AI) có khả năng truy vấn dữ liệu thật

Ứng dụng gồm 2 phần hoạt động độc lập:

Backend: FastAPI + PostgreSQL

Frontend: React + Vite

Chatbot Tuấn AI chạy trực tiếp trong backend.

🧩 2. Công nghệ sử dụng
🔧 Backend

FastAPI

SQLAlchemy ORM

Pydantic

Uvicorn

PostgreSQL

Alembic (migrations)

JWT Authentication

🎨 Frontend

React

Vite

TypeScript

TailwindCSS

Recharts (biểu đồ)

Lucide Icons

🤖 AI Chatbot

NLP rule-based

Tương tác qua API /ai/chat

Lấy dữ liệu thật: doanh thu, đơn hàng, nhân viên,…

📁 3. Cấu trúc dự án
Backend (FastAPI)


<img width="239" height="716" alt="image" src="https://github.com/user-attachments/assets/c67d4fd0-14df-47e7-8448-c6a0fdedb7c0" />


Frontend (React + Vite)


<img width="226" height="713" alt="image" src="https://github.com/user-attachments/assets/ba49b834-33ea-44ab-baf3-792f5749ad83" />

🧪 4. Hướng dẫn cài đặt & chạy hệ thống

Dự án gồm Backend + Frontend → phải chạy cả hai.

🔥 4.1. Cài đặt Backend (FastAPI)
Bước 1: Tạo môi trường ảo
cd backend
python -m venv venv
venv\Scripts\activate

Bước 2: Cài đặt thư viện
pip install -r requirements.txt

Bước 3: Cấu hình PostgreSQL

Mở file:

backend/app/database.py


Chỉnh:

SQLALCHEMY_DATABASE_URL = "postgresql://postgres:YOUR_PASSWORD@localhost:5432/quanlydoanhnghiep"

Bước 4: Chạy Backend
uvicorn app.main:app --reload


Truy cập API Docs:
👉 http://127.0.0.1:8000/docs

🎨 4.2. Cài đặt Frontend (React + Vite)
Bước 1: Cài thư viện
cd frontend
npm install

Bước 2: Cấu hình API Backend

File:

src/hooks/useSettings.ts


Đặt đúng:

const API = "http://127.0.0.1:8000";

Bước 3: Chạy giao diện
npm run dev


Mở trình duyệt:
👉 http://localhost:5173




🤖 4.3. Chatbot Tuấn AI

Chatbot được gọi qua API:

POST /ai/chat


Ví dụ:

{
  "message": "xin chào"
}


Backend trả về dữ liệu thật từ hệ thống.

<img width="524" height="603" alt="image" src="https://github.com/user-attachments/assets/630e0772-4312-4bad-b4bf-b557ab542169" />

📊 5. Kết quả giao diện (Demo)
Dashboard tổng quan

Tổng doanh thu

Tổng đơn hàng

Khách hàng mới

Tổng sản phẩm

Biểu đồ doanh thu theo tháng

Biểu đồ doanh số theo danh mục

Doanh thu theo khu vực

Đơn hàng gần đây

 "<img width="1905" height="981" alt="image" src="https://github.com/user-attachments/assets/400e613b-e4dc-46a6-b9d6-2ab025f92fd6" />


🟢 6. Tính năng chính
✔ Quản lý Nhân viên

Thêm – Sửa – Xoá – Lương – Chấm công – Nghỉ phép

✔ Quản lý Sản phẩm

Danh mục – Kho – Tồn kho – Xuất nhập

✔ Quản lý Khách hàng

Ghi chú – Lịch sử mua hàng – Email

✔ Quản lý Đơn hàng

Trạng thái đơn – Tự động cập nhật kho – Hoá đơn

✔ Báo cáo – Thống kê

Biểu đồ dạng cột, tròn, ngang

✔ Admin – Phân quyền

Role-based permissions

✔ Chatbot Tuấn AI

Hỏi → trả lời bằng dữ liệu thật

👨‍💻 7. Tác giả

Lê Đức Anh Tuấn
Dự án phục vụ học tập – thực tập – nghiên cứu.
