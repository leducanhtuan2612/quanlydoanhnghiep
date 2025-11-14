# app/routers/crm.py
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
import os, smtplib, ssl
from email.mime.text import MIMEText

from app import models, schemas, database

router = APIRouter(prefix="/crm", tags=["CRM"])
get_db = database.get_db

# Nếu bạn có auth, có thể import:
# from app.dependencies import get_current_admin
# và thêm vào Depends(get_current_admin) ở các endpoint cần bảo vệ.


# ==================== HELPER GỬI EMAIL ====================
def send_email_smtp(to_email: str, subject: str, body: str):
    """
    Gửi email đơn giản bằng SMTP.
    Cấu hình qua biến môi trường:
    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
    """
    host = os.getenv("SMTP_HOST", "")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER", "")
    password = os.getenv("SMTP_PASS", "")
    from_email = os.getenv("SMTP_FROM", user)

    if not host or not user or not password:
        # Không cấu hình SMTP -> coi như không gửi được
        raise RuntimeError("SMTP chưa được cấu hình")

    msg = MIMEText(body, "html", "utf-8")
    msg["Subject"] = subject
    msg["From"] = from_email
    msg["To"] = to_email

    context = ssl.create_default_context()
    with smtplib.SMTP(host, port) as server:
        server.starttls(context=context)
        server.login(user, password)
        server.sendmail(from_email, [to_email], msg.as_string())


# ==================== CUSTOMER LIST + THỐNG KÊ ====================
@router.get("/customers", response_model=list[schemas.CustomerOut])
def list_customers(db: Session = Depends(get_db)):
    return db.query(models.Customer).order_by(models.Customer.id.desc()).all()


# ==================== CUSTOMER DETAIL (ghi chú + lịch sử mua) ====================
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

    # map order -> OrderShort
    orders_short = [
        schemas.OrderShort(
            id=o.id,
            date=o.date,
            amount=o.amount,
            status=o.status,
        )
        for o in orders
    ]

    return schemas.CustomerDetailCRM(
        customer=customer,
        notes=notes,
        orders=orders_short,
    )


# ==================== GHI CHÚ KHÁCH HÀNG ====================
@router.post("/notes", response_model=schemas.CustomerNoteOut)
def create_customer_note(
    payload: schemas.CustomerNoteCreate,
    db: Session = Depends(get_db),
):
    customer = db.query(models.Customer).filter(models.Customer.id == payload.customer_id).first()
    if not customer:
        raise HTTPException(404, "Khách hàng không tồn tại")

    note = models.CustomerNote(
        customer_id=payload.customer_id,
        title=payload.title,
        content=payload.content,
        created_by="admin",  # TODO: lấy từ current_user nếu có
        created_at=datetime.utcnow(),
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.get("/notes", response_model=list[schemas.CustomerNoteOut])
def list_customer_notes(
    customer_id: int,
    db: Session = Depends(get_db),
):
    return (
        db.query(models.CustomerNote)
        .filter(models.CustomerNote.customer_id == customer_id)
        .order_by(models.CustomerNote.created_at.desc())
        .all()
    )


# ==================== EMAIL TEMPLATE ====================
@router.post("/email-templates", response_model=schemas.EmailTemplateOut)
def create_email_template(
    payload: schemas.EmailTemplateCreate,
    db: Session = Depends(get_db),
):
    template = models.EmailTemplate(**payload.model_dump())
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


@router.get("/email-templates", response_model=list[schemas.EmailTemplateOut])
def list_email_templates(db: Session = Depends(get_db)):
    return db.query(models.EmailTemplate).order_by(models.EmailTemplate.id.desc()).all()


# ==================== GỬI EMAIL MARKETING ====================
class SendEmailRequest(schemas.BaseModel):
    template_id: int
    customer_ids: list[int]


@router.post("/send-email")
def send_marketing_email(
    body: SendEmailRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    template = db.query(models.EmailTemplate).filter(
        models.EmailTemplate.id == body.template_id
    ).first()
    if not template:
        raise HTTPException(404, "Mẫu email không tồn tại")

    customers = db.query(models.Customer).filter(
        models.Customer.id.in_(body.customer_ids)
    ).all()

    if not customers:
        raise HTTPException(400, "Không tìm thấy khách hàng để gửi")

    # Tạo campaign
    campaign = models.EmailCampaign(
        name=f"Chiến dịch {template.name} - {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}",
        template_id=template.id,
        is_active=True,
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)

    # Tạo log pending
    for c in customers:
        log = models.EmailLog(
            campaign_id=campaign.id,
            customer_id=c.id,
            email=c.email or "",
            status="pending",
        )
        db.add(log)
    db.commit()

    # Hàm chạy nền gửi email
    def process_campaign(campaign_id: int):
        session: Session = database.SessionLocal()
        try:
            camp = session.query(models.EmailCampaign).filter(models.EmailCampaign.id == campaign_id).first()
            if not camp:
                return

            template_local = camp.template

            logs = session.query(models.EmailLog).filter(
                models.EmailLog.campaign_id == campaign_id
            ).all()

            for log in logs:
                customer = session.query(models.Customer).filter(
                    models.Customer.id == log.customer_id
                ).first()

                if not customer or not customer.email:
                    log.status = "failed"
                    log.error_message = "Khách hàng không có email"
                    log.sent_at = datetime.utcnow()
                    session.commit()
                    continue

                # Render body: thay {{customer_name}}
                body_html = template_local.body.replace("{{customer_name}}", customer.name)

                try:
                    send_email_smtp(
                        to_email=customer.email,
                        subject=template_local.subject,
                        body=body_html,
                    )
                    log.status = "sent"
                    log.sent_at = datetime.utcnow()
                except Exception as e:
                    log.status = "failed"
                    log.error_message = str(e)
                    log.sent_at = datetime.utcnow()

                session.commit()
        finally:
            session.close()

    background_tasks.add_task(process_campaign, campaign_id=campaign.id)

    return {"message": "Đã tạo chiến dịch và đang gửi email trong nền."}


# ==================== XEM LOG EMAIL ====================
@router.get("/email-logs", response_model=list[schemas.EmailLogOut])
def list_email_logs(
    campaign_id: int | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(models.EmailLog)
    if campaign_id:
        q = q.filter(models.EmailLog.campaign_id == campaign_id)
    return q.order_by(models.EmailLog.id.desc()).all()
# ==================== XÓA GHI CHÚ ====================
@router.delete("/notes/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db)):
    note = db.query(models.CustomerNote).filter(models.CustomerNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    db.delete(note)
    db.commit()
    return {"message": "Deleted"}
