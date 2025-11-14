# app/routers/products.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from .. import models, schemas, database
import os, shutil

router = APIRouter(prefix="/products", tags=["Products"])
get_db = database.get_db

UPLOAD_DIR = "static/images/products"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# 🟢 Lấy tất cả sản phẩm
@router.get("/", response_model=list[schemas.ProductOut])
def get_all(db: Session = Depends(get_db)):
    return db.query(models.Product).all()


# 🟢 Tạo sản phẩm (tự thêm bản ghi kho hàng)
@router.post("/", response_model=schemas.ProductOut)
def create_product(
    name: str = Form(...),
    category: Optional[str] = Form(None),
    price: float = Form(...),
    stock: int = Form(0),
    description: Optional[str] = Form(None),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
):
    image_url = None
    if image:
        path = os.path.join(UPLOAD_DIR, image.filename)
        with open(path, "wb") as f:
            shutil.copyfileobj(image.file, f)
        image_url = f"/images/products/{image.filename}"

    # 🟢 Tạo sản phẩm mới
    new_item = models.Product(
        name=name,
        category=category,
        price=price,
        stock=stock,
        description=description,
        image_url=image_url,
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    # 🟢 Tạo bản ghi kho hàng tương ứng
    inv = models.Inventory(
        product_id=new_item.id,
        quantity=stock,
        date_added=date.today(),
        note="Tự động tạo khi thêm sản phẩm mới"
    )
    db.add(inv)
    db.commit()

    return new_item


# 🟡 Cập nhật sản phẩm (tự cập nhật kho hàng)
@router.put("/{id}", response_model=schemas.ProductOut)
def update_product(
    id: int,
    name: str = Form(...),
    category: Optional[str] = Form(None),
    price: float = Form(...),
    stock: int = Form(...),
    description: Optional[str] = Form(None),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
):
    obj = db.query(models.Product).filter(models.Product.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Product not found")

    obj.name = name
    obj.category = category
    obj.price = price
    obj.stock = stock
    obj.description = description

    if image:
        path = os.path.join(UPLOAD_DIR, image.filename)
        with open(path, "wb") as f:
            shutil.copyfileobj(image.file, f)
        obj.image_url = f"/images/products/{image.filename}"

    # 🟡 Đồng bộ kho hàng
    inv = db.query(models.Inventory).filter(models.Inventory.product_id == id).first()
    if inv:
        inv.quantity = stock
    else:
        inv = models.Inventory(
            product_id=id,
            quantity=stock,
            date_added=date.today(),
            note="Tự động thêm khi sản phẩm chưa có trong kho"
        )
        db.add(inv)

    db.commit()
    db.refresh(obj)
    return obj


# 🔴 Xóa sản phẩm (xóa luôn trong kho)
@router.delete("/{id}")
def delete_product(id: int, db: Session = Depends(get_db)):
    obj = db.query(models.Product).filter(models.Product.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Product not found")

    db.query(models.Inventory).filter(models.Inventory.product_id == id).delete()

    db.delete(obj)
    db.commit()
    return {"message": "✅ Đã xóa sản phẩm và kho hàng liên quan"}
