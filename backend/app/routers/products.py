# app/routers/products.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from .. import models, schemas, database
import os, shutil

from app.utils.notify import push_notify

router = APIRouter(prefix="/products", tags=["Products"])
get_db = database.get_db

UPLOAD_DIR = "static/images/products"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ==========================================================
# 📌 Lấy tất cả sản phẩm
# ==========================================================
@router.get("/", response_model=list[schemas.ProductOut])
def get_all(db: Session = Depends(get_db)):
    return db.query(models.Product).all()


# ==========================================================
# 📌 Tạo sản phẩm mới
# ==========================================================
@router.post("/", response_model=schemas.ProductOut)
def create_product(
    name: str = Form(...),
    category: Optional[str] = Form(None),
    price: float = Form(...),
    stock: int = Form(0),
    description: Optional[str] = Form(None),

    brand: Optional[str] = Form(None),
    supplier: Optional[str] = Form(None),
    size: Optional[str] = Form(None),
    weight: Optional[str] = Form(None),
    usage: Optional[str] = Form(None),
    import_date: Optional[str] = Form(None),

    image: UploadFile = File(None),
    db: Session = Depends(get_db),
):

    # FIX chuỗi rỗng → None
    if import_date == "":
        import_date = None

    for fld in ["category", "brand", "supplier", "size", "weight", "usage", "description"]:
        if locals()[fld] == "":
            locals()[fld] = None

    image_url = None

    # 📌 Lưu ảnh
    if image:
        path = os.path.join(UPLOAD_DIR, image.filename)
        with open(path, "wb") as f:
            shutil.copyfileobj(image.file, f)

        image_url = f"/images/products/{image.filename}"

    # 📌 Tạo sản phẩm mới
    new_item = models.Product(
        name=name,
        category=category,
        price=price,
        stock=stock,
        description=description,
        image_url=image_url,
        brand=brand,
        supplier=supplier,
        size=size,
        weight=weight,
        usage=usage,
        import_date=import_date,
    )

    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    # 📌 Nếu có stock ban đầu → tạo phiếu inventory
    if stock != 0:
        inv = models.Inventory(
            product_id=new_item.id,
            quantity=stock,
            date_added=date.today(),
            note="Tồn kho ban đầu khi tạo sản phẩm",
        )
        db.add(inv)
        db.commit()

    push_notify(db, f"Sản phẩm mới '{new_item.name}' đã được tạo")

    return new_item


# ==========================================================
# 📌 Cập nhật sản phẩm (KHÔNG tác động tới kho)
# ==========================================================
@router.put("/{id}", response_model=schemas.ProductOut)
def update_product(
    id: int,
    name: str = Form(...),
    category: Optional[str] = Form(None),
    price: float = Form(...),
    stock: int = Form(...),   # ❌ KHÔNG DÙNG – KHÔNG ĐƯỢC CẬP NHẬT STOCK ở đây!
    description: Optional[str] = Form(None),

    brand: Optional[str] = Form(None),
    supplier: Optional[str] = Form(None),
    size: Optional[str] = Form(None),
    weight: Optional[str] = Form(None),
    usage: Optional[str] = Form(None),
    import_date: Optional[str] = Form(None),

    image: UploadFile = File(None),
    db: Session = Depends(get_db),
):
    obj = db.query(models.Product).filter(models.Product.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Product not found")

    # FIX chuỗi rỗng
    if import_date == "":
        import_date = None

    for fld in ["category", "brand", "supplier", "size", "weight", "usage", "description"]:
        if locals()[fld] == "":
            locals()[fld] = None

    # 📌 Chỉ cập nhật thông tin, KHÔNG cập nhật stock
    obj.name = name
    obj.category = category
    obj.price = price
    obj.description = description
    obj.brand = brand
    obj.supplier = supplier
    obj.size = size
    obj.weight = weight
    obj.usage = usage
    obj.import_date = import_date

    # 📌 Update ảnh
    if image:
        path = os.path.join(UPLOAD_DIR, image.filename)
        with open(path, "wb") as f:
            shutil.copyfileobj(image.file, f)

        obj.image_url = f"/images/products/{image.filename}"

    db.commit()
    db.refresh(obj)

    push_notify(db, f"Sản phẩm '{obj.name}' đã được cập nhật")

    return obj


# ==========================================================
# 📌 Xóa sản phẩm
# ==========================================================
@router.delete("/{id}")
def delete_product(id: int, db: Session = Depends(get_db)):
    obj = db.query(models.Product).filter(models.Product.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Product not found")

    name = obj.name

    # Xóa toàn bộ lịch sử kho của sản phẩm
    db.query(models.Inventory).filter(models.Inventory.product_id == id).delete()

    db.delete(obj)
    db.commit()

    push_notify(db, f"Sản phẩm '{name}' đã bị xóa khỏi hệ thống")

    return {"message": "✅ Đã xóa sản phẩm & kho hàng liên quan"}
