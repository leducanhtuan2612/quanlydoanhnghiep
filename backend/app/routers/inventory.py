# ==========================================================
# 🏷️ ROUTER: QUẢN LÝ KHO HÀNG (ĐỒNG BỘ VỚI SẢN PHẨM)
# ==========================================================
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from app import models, schemas, database

router = APIRouter(prefix="/inventory", tags=["Inventory"])
get_db = database.get_db


# ==========================================================
# 📋 Lấy danh sách kho hàng
# ==========================================================
@router.get("/", response_model=list[schemas.InventoryOut])
def get_all_inventories(db: Session = Depends(get_db)):
    """
    Lấy toàn bộ danh sách kho hàng kèm tên sản phẩm.
    """
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
# 🟢 Thêm mới hàng (✅ Tự động cộng tồn kho sản phẩm)
# ==========================================================
@router.post("/", response_model=schemas.InventoryOut)
def create_inventory(item: schemas.InventoryCreate, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="❌ Sản phẩm không tồn tại")

    new_item = models.Inventory(
        product_id=item.product_id,
        quantity=item.quantity,
        location=item.location,
        date_added=item.date_added or date.today(),
        note=item.note or "Thêm hàng mới vào kho"
    )

    db.add(new_item)

    # ✅ Cập nhật lại tồn kho trong bảng sản phẩm
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
# 🟡 Sửa hàng (✅ Tự động đồng bộ chênh lệch tồn kho)
# ==========================================================
@router.put("/{id}", response_model=schemas.InventoryOut)
def update_inventory(id: int, item: schemas.InventoryCreate, db: Session = Depends(get_db)):
    inv = db.query(models.Inventory).filter(models.Inventory.id == id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="❌ Kho hàng không tồn tại")

    product = db.query(models.Product).filter(models.Product.id == inv.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="❌ Sản phẩm không tồn tại")

    # ✅ Tính chênh lệch tồn kho
    diff = item.quantity - inv.quantity
    product.stock = max(0, (product.stock or 0) + diff)

    # ✅ Cập nhật dữ liệu kho
    inv.quantity = item.quantity
    inv.location = item.location
    inv.date_added = item.date_added or date.today()
    inv.note = item.note

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
# 🔴 Xóa hàng (✅ Tự động trừ tồn kho sản phẩm)
# ==========================================================
@router.delete("/{id}")
def delete_inventory(id: int, db: Session = Depends(get_db)):
    inv = db.query(models.Inventory).filter(models.Inventory.id == id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="❌ Kho hàng không tồn tại")

    product = db.query(models.Product).filter(models.Product.id == inv.product_id).first()
    if product:
        product.stock = max(0, (product.stock or 0) - inv.quantity)

    db.delete(inv)
    db.commit()

    return {"message": "✅ Đã xóa hàng và cập nhật tồn kho sản phẩm"}


# ==========================================================
# 🔁 Đồng bộ lại toàn bộ tồn kho (fix lệch dữ liệu cũ)
# ==========================================================
@router.post("/sync-stock")
def sync_all_stock(db: Session = Depends(get_db)):
    """
    Đồng bộ lại tồn kho tất cả sản phẩm dựa theo tổng quantity trong bảng Inventory.
    Dùng khi dữ liệu bị lệch giữa kho và sản phẩm.
    """
    products = db.query(models.Product).all()
    for p in products:
        total = db.query(func.sum(models.Inventory.quantity))\
            .filter(models.Inventory.product_id == p.id)\
            .scalar() or 0
        p.stock = total
    db.commit()
    return {"message": "✅ Đã đồng bộ lại tồn kho cho tất cả sản phẩm"}
