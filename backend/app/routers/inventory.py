# ==========================================================
# 📦 ROUTER: QUẢN LÝ NHẬP – XUẤT KHO (CHUẨN ERP 100%)
# ==========================================================
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date

from app import models, schemas, database

router = APIRouter(prefix="/inventory", tags=["Inventory"])
get_db = database.get_db


# ==========================================================
# 📋 Lấy toàn bộ lịch sử nhập – xuất kho
# ==========================================================
@router.get("/", response_model=list[schemas.InventoryOut])
def get_all_inventories(db: Session = Depends(get_db)):
    inventories = (
        db.query(models.Inventory, models.Product.name.label("product_name"))
        .join(models.Product, models.Inventory.product_id == models.Product.id)
        .order_by(models.Inventory.id.desc())
        .all()
    )

    return [
        schemas.InventoryOut(
            id=i.Inventory.id,
            product_id=i.Inventory.product_id,
            product_name=i.product_name,
            quantity=i.Inventory.quantity,
            location=i.Inventory.location,
            date_added=i.Inventory.date_added,
            note=i.Inventory.note,
        )
        for i in inventories
    ]


# ==========================================================
# 🟢 THÊM PHIẾU NHẬP KHO (TĂNG STOCK)
# ==========================================================
@router.post("/", response_model=schemas.InventoryOut)
def create_inventory(item: schemas.InventoryCreate, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter_by(id=item.product_id).first()
    if not product:
        raise HTTPException(404, "❌ Sản phẩm không tồn tại")

    # ⭐ FIX QUAN TRỌNG – CHỐNG LỖI VỊ TRÍ
    location = item.location.strip() if item.location else None
    if location == "":
        location = None

    note = item.note.strip() if item.note else "Nhập kho"
    if note == "":
        note = "Nhập kho"

    new_item = models.Inventory(
        product_id=item.product_id,
        quantity=item.quantity,
        location=location,
        date_added=item.date_added or date.today(),
        note=note,
    )

    db.add(new_item)

    # Cập nhật stock
    product.stock = (product.stock or 0) + item.quantity

    db.commit()
    db.refresh(new_item)
    db.refresh(product)

    return {
        "id": new_item.id,
        "product_id": new_item.product_id,
        "product_name": product.name,
        "quantity": new_item.quantity,
        "location": new_item.location,
        "date_added": new_item.date_added,
        "note": new_item.note,
    }


# ==========================================================
# 🟡 SỬA PHIẾU NHẬP KHO (ĐIỀU CHỈNH STOCK)
# ==========================================================
@router.put("/{id}", response_model=schemas.InventoryOut)
def update_inventory(id: int, item: schemas.InventoryCreate, db: Session = Depends(get_db)):
    inv = db.query(models.Inventory).filter_by(id=id).first()
    if not inv:
        raise HTTPException(404, "❌ Phiếu kho không tồn tại")

    product = db.query(models.Product).filter_by(id=inv.product_id).first()

    # ⭐ FIX: location và note rỗng
    location = item.location.strip() if item.location else None
    if location == "":
        location = None

    note = item.note.strip() if item.note else None

    # Tính chênh lệch để cập nhật stock
    diff = item.quantity - inv.quantity
    product.stock = (product.stock or 0) + diff

    inv.quantity = item.quantity
    inv.location = location
    inv.date_added = item.date_added or date.today()
    inv.note = note

    db.commit()
    db.refresh(inv)
    db.refresh(product)

    return {
        "id": inv.id,
        "product_id": inv.product_id,
        "product_name": product.name,
        "quantity": inv.quantity,
        "location": inv.location,
        "date_added": inv.date_added,
        "note": inv.note,
    }


# ==========================================================
# 🔴 XÓA PHIẾU KHO (GIẢM STOCK)
# ==========================================================
@router.delete("/{id}")
def delete_inventory(id: int, db: Session = Depends(get_db)):
    inv = db.query(models.Inventory).filter_by(id=id).first()
    if not inv:
        raise HTTPException(404, "❌ Phiếu kho không tồn tại")

    product = db.query(models.Product).filter_by(id=inv.product_id).first()
    if product:
        product.stock = (product.stock or 0) - inv.quantity

    db.delete(inv)
    db.commit()

    return {"message": "🗑 Đã xóa phiếu và cập nhật tồn kho"}


# ==========================================================
# 🔄 ĐỒNG BỘ LẠI STOCK THEO LỊCH SỬ
# ==========================================================
@router.post("/sync-stock")
def sync_all_stock(db: Session = Depends(get_db)):
    products = db.query(models.Product).all()

    for p in products:
        total = (
            db.query(func.sum(models.Inventory.quantity))
            .filter(models.Inventory.product_id == p.id)
            .scalar()
            or 0
        )
        p.stock = total

    db.commit()
    return {"message": "✔ Đã đồng bộ tồn kho tất cả sản phẩm"}


# ==========================================================
# 🧾 Tạo phiếu xuất kho (dùng cho đơn hàng)
# ==========================================================
def create_export_record(db: Session, product_id: int, quantity: int, order_id: int):
    prod = db.query(models.Product).filter_by(id=product_id).first()
    if not prod:
        raise HTTPException(404, "Không tìm thấy sản phẩm")

    inv = models.Inventory(
        product_id=product_id,
        quantity=-abs(quantity),
        location="Xuất theo đơn hàng",
        date_added=date.today(),
        note=f"Xuất kho đơn #{order_id}",
    )

    db.add(inv)
    prod.stock -= abs(quantity)
    db.commit()
    db.refresh(prod)


# ==========================================================
# 🧾 Tạo phiếu hoàn kho (khi đơn hàng hủy)
# ==========================================================
def create_return_record(db: Session, product_id: int, quantity: int, order_id: int):
    prod = db.query(models.Product).filter_by(id=product_id).first()
    if not prod:
        raise HTTPException(404, "Không tìm thấy sản phẩm")

    inv = models.Inventory(
        product_id=product_id,
        quantity=abs(quantity),
        location="Hoàn kho",
        date_added=date.today(),
        note=f"Hoàn kho đơn #{order_id}",
    )

    db.add(inv)
    prod.stock += abs(quantity)
    db.commit()
    db.refresh(prod)
