from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app import models, database
from app.routers import (
    employees,
    customers,
    products,
    inventory,
    reports,
    admins,
    auth,
    settings,
    orders,
    ai_chat,
    crm,
    attendance      # ⭐ THÊM DÒNG NÀY
)


app = FastAPI(
    title="Hệ thống quản lý doanh nghiệp",
    description="API backend cho website quản lý hợp tác xã nông nghiệp (FastAPI + React)",
    version="1.0.0",
)

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=database.engine)

# ------------------------------
# INCLUDE ROUTERS
# ------------------------------
app.include_router(employees.router)
app.include_router(customers.router)
app.include_router(products.router)
app.include_router(inventory.router)
app.include_router(reports.router)
app.include_router(admins.router)
app.include_router(auth.router)
app.include_router(settings.router)
app.include_router(orders.router)
app.include_router(ai_chat.router)
app.include_router(crm.router)
app.include_router(attendance.router)   # ⭐ THÊM DÒNG NÀY


app.mount("/images", StaticFiles(directory="static/images"), name="images")
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def root():
    return {"message": "✅ Backend FastAPI đang hoạt động bình thường!"}
