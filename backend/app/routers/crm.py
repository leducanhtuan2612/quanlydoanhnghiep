# app/routers/crm.py
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime
import os, smtplib, ssl
from email.mime.text import MIMEText

from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors

from app import models, schemas, database

router = APIRouter(prefix="/crm", tags=["CRM"])
get_db = database.get_db



# ==================== DANH SÁCH KHÁCH HÀNG ====================
@router.get("/customers", response_model=list[schemas.CustomerOut])
def list_customers(db: Session = Depends(get_db)):
    return db.query(models.Customer).order_by(models.Customer.id.desc()).all()


# ==================== CHI TIẾT CRM ====================
@router.get("/customers/{customer_id}/detail", response_model=schemas.CustomerDetailCRM)
def get_customer_detail(customer_id: int, db: Session = Depends(get_db)):

    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(404, "Khách hàng không tồn tại")

    notes = (
        db.query(models.CustomerNote)
        .filter(models.CustomerNote.customer_id == customer_id)
        .order_by(models.CustomerNote.created_at.desc())
        .all()
    )

    orders = (
        db.query(models.Order)
        .filter(models.Order.customer_id == customer_id)
        .order_by(models.Order.date.desc())
        .all()
    )

    orders_short = [
        schemas.OrderShort(
            id=o.id,
            date=o.date,
            amount=o.amount,
            status=o.status
        )
        for o in orders
    ]

    return schemas.CustomerDetailCRM(
        customer=customer,
        notes=notes,
        orders=orders_short,
    )


# ==================== TẠO GHI CHÚ ====================
@router.post("/notes", response_model=schemas.CustomerNoteOut)
def create_customer_note(payload: schemas.CustomerNoteCreate, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.id == payload.customer_id).first()
    if not customer:
        raise HTTPException(404, "Khách hàng không tồn tại")

    note = models.CustomerNote(
        customer_id=payload.customer_id,
        title=payload.title,
        content=payload.content,
        created_by="admin",
        created_at=datetime.utcnow(),
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


# ==================== XÓA GHI CHÚ ====================
@router.delete("/notes/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db)):
    note = db.query(models.CustomerNote).filter(models.CustomerNote.id == note_id).first()
    if not note:
        raise HTTPException(404, "Note not found")

    db.delete(note)
    db.commit()
    return {"message": "Deleted"}


# ==================== EXPORT PDF CHUẨN ĐẸP ====================
@router.get("/customers/{customer_id}/export-pdf")
def export_customer_pdf(customer_id: int, db: Session = Depends(get_db)):

    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(404, "Không tìm thấy khách hàng")

    notes = (
        db.query(models.CustomerNote)
        .filter(models.CustomerNote.customer_id == customer_id)
        .order_by(models.CustomerNote.created_at.desc())
        .all()
    )

    orders = (
        db.query(models.Order)
        .filter(models.Order.customer_id == customer_id)
        .order_by(models.Order.date.desc())
        .all()
    )

    TMP_DIR = "tmp"
    os.makedirs(TMP_DIR, exist_ok=True)
    file_path = f"{TMP_DIR}/customer_{customer_id}.pdf"

    doc = SimpleDocTemplate(
        file_path,
        pagesize=A4,
        rightMargin=30, leftMargin=30,
        topMargin=30, bottomMargin=30
    )

    styles = getSampleStyleSheet()
    story = []

    # ==== TIÊU ĐỀ ====
    story.append(Paragraph(f"<b><font size=16>Thông tin khách hàng: {customer.name}</font></b>", styles["Title"]))
    story.append(Spacer(1, 16))

    # ==== THÔNG TIN CƠ BẢN ====
    info = f"""
    <b>Email:</b> {customer.email}<br/>
    <b>SĐT:</b> {customer.phone or "—"}<br/>
    <b>Địa chỉ:</b> {customer.address or "—"}<br/>
    """
    story.append(Paragraph(info, styles["Normal"]))
    story.append(Spacer(1, 20))

    # ==== LỊCH SỬ MUA HÀNG ====
    story.append(Paragraph("<b><font size=14>Lịch sử mua hàng</font></b>", styles["Heading2"]))
    story.append(Spacer(1, 10))

    if len(orders) == 0:
        story.append(Paragraph("Không có đơn hàng.", styles["Normal"]))
    else:
        table_data = [["Mã đơn", "Ngày", "Trạng thái", "Tổng tiền"]]

        for o in orders:
            table_data.append([
                f"#{o.id}",
                o.date.strftime("%d/%m/%Y"),
                o.status,
                f"{o.amount:,.0f} đ"
            ])

        table = Table(table_data, colWidths=[60, 80, 120, 100])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.gray),
        ]))

        story.append(table)

    story.append(Spacer(1, 20))

    # ==== GHI CHÚ ====
    story.append(Paragraph("<b><font size=14>Ghi chú khách hàng</font></b>", styles["Heading2"]))
    story.append(Spacer(1, 10))

    if len(notes) == 0:
        story.append(Paragraph("Không có ghi chú.", styles["Normal"]))
    else:
        for n in notes:
            txt = f"<b>- {n.title}</b> ({n.created_at.strftime('%d/%m/%Y %H:%M')})<br/>{n.content or ''}"
            story.append(Paragraph(txt, styles["Normal"]))
            story.append(Spacer(1, 6))

    doc.build(story)

    return FileResponse(file_path, media_type="application/pdf", filename=f"customer_{customer_id}.pdf")
