from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from datetime import date, datetime
from typing import List, Optional
import os
import uuid
import shutil

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/tasks", tags=["Tasks"])


# ==========================
# 🔹 DASHBOARD SUMMARY
# ==========================
@router.get("/summary", response_model=schemas.TaskSummaryOut)
def get_task_summary(
    employee_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.Task)

    if employee_id:
        query = query.filter(models.Task.assigned_to_id == employee_id)

    items = query.all()
    today = date.today()

    return schemas.TaskSummaryOut(
        total=len(items),
        todo=sum(1 for t in items if t.status == "todo"),
        in_progress=sum(1 for t in items if t.status == "in_progress"),
        done=sum(1 for t in items if t.status == "done"),
        overdue=sum(
            1 for t in items
            if t.status != "done" and t.deadline and t.deadline < today
        ),
    )


# ==========================
# 🔹 LIST TASKS
# ==========================
@router.get("/", response_model=List[schemas.TaskOut])
def list_tasks(
    employee_id: Optional[int] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.Task)

    if employee_id:
        query = query.filter(models.Task.assigned_to_id == employee_id)

    if status:
        query = query.filter(models.Task.status == status)

    if priority:
        query = query.filter(models.Task.priority == priority)

    items = query.order_by(models.Task.deadline.asc().nulls_last()).all()
    today = date.today()

    result = []

    for t in items:

        # Tính trễ hạn hoàn chỉnh
        is_overdue = (
            True
            if (t.deadline and t.deadline < today and t.status != "done")
            else False
        )

        result.append(
            schemas.TaskOut(
                id=t.id,
                title=t.title,
                description=t.description,
                priority=t.priority,
                status=t.status,
                progress=t.progress,
                deadline=t.deadline,
                assigned_to_id=t.assigned_to_id,
                assigned_to_name=t.assigned_to.name if t.assigned_to else None,
                created_by_id=t.created_by_id,
                created_at=t.created_at,
                updated_at=t.updated_at,
                is_overdue=is_overdue,
                attachments=[
                    schemas.TaskAttachmentOut(
                        id=a.id,
                        file_name=a.file_name,
                        file_path=a.file_path,
                        uploaded_at=a.uploaded_at,
                    )
                    for a in t.attachments
                ],
            )
        )

    return result


# ==========================
# 🔹 GET ONE TASK
# ==========================
@router.get("/{task_id}", response_model=schemas.TaskOut)
def get_task(task_id: int, db: Session = Depends(get_db)):
    t = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not t:
        raise HTTPException(404, "Task không tồn tại")

    today = date.today()
    is_overdue = (
        True
        if (t.deadline and t.deadline < today and t.status != "done")
        else False
    )

    return schemas.TaskOut(
        id=t.id,
        title=t.title,
        description=t.description,
        priority=t.priority,
        status=t.status,
        progress=t.progress,
        deadline=t.deadline,
        assigned_to_id=t.assigned_to_id,
        assigned_to_name=t.assigned_to.name if t.assigned_to else None,
        created_by_id=t.created_by_id,
        created_at=t.created_at,
        updated_at=t.updated_at,
        is_overdue=is_overdue,
        attachments=[
            schemas.TaskAttachmentOut(
                id=a.id,
                file_name=a.file_name,
                file_path=a.file_path,
                uploaded_at=a.uploaded_at,
            )
            for a in t.attachments
        ],
    )


# ==========================
# 🔹 CREATE TASK
# ==========================
@router.post("/", response_model=schemas.TaskOut)
def create_task(data: schemas.TaskCreate, db: Session = Depends(get_db)):
    # ép logic: nếu status=done thì progress=100
    if data.status == "done":
        data.progress = 100

    task = models.Task(
        title=data.title,
        description=data.description,
        priority=data.priority,
        status=data.status,
        progress=data.progress,
        deadline=data.deadline,
        assigned_to_id=data.assigned_to_id,
        created_by_id=data.created_by_id,
    )

    db.add(task)
    db.commit()
    db.refresh(task)

    return get_task(task.id, db)


# ==========================
# 🔹 UPDATE TASK
# ==========================
@router.put("/{task_id}", response_model=schemas.TaskOut)
def update_task(task_id: int, data: schemas.TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(404, "Task không tồn tại")

    update_data = data.dict(exclude_unset=True)

    # Ép logic:
    if update_data.get("status") == "done":
        update_data["progress"] = 100

    if update_data.get("progress") == 100:
        update_data["status"] = "done"

    for key, value in update_data.items():
        setattr(task, key, value)

    db.commit()
    db.refresh(task)
    return get_task(task.id, db)


# ==========================
# 🔹 UPDATE PROGRESS
# ==========================
@router.post("/{task_id}/progress", response_model=schemas.TaskOut)
def update_progress(
    task_id: int,
    progress: int = Query(..., ge=0, le=100),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(404, "Task không tồn tại")

    task.progress = progress

    # Ép logic:
    if status:
        task.status = status
    elif progress == 100:
        task.status = "done"

    db.commit()
    db.refresh(task)
    return get_task(task.id, db)


# ==========================
# 🔹 DELETE TASK
# ==========================
@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(404, "Task không tồn tại")

    db.delete(task)
    db.commit()
    return {"message": "Đã xóa task"}


# ==========================
# 🔹 UPLOAD ATTACHMENT
# ==========================
@router.post("/{task_id}/upload", response_model=schemas.TaskAttachmentOut)
def upload_attachment(
    task_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(404, "Task không tồn tại")

    os.makedirs("static/tasks", exist_ok=True)
    ext = file.filename.split(".")[-1]
    new_name = f"{uuid.uuid4()}.{ext}"
    path = os.path.join("static", "tasks", new_name)

    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    att = models.TaskAttachment(
        task_id=task_id,
        file_name=file.filename,
        file_path=f"/static/tasks/{new_name}",
    )
    db.add(att)
    db.commit()
    db.refresh(att)

    return schemas.TaskAttachmentOut(
        id=att.id,
        file_name=att.file_name,
        file_path=att.file_path,
        uploaded_at=att.uploaded_at,
    )


# ==========================
# 🔹 GET EMPLOYEES
# ==========================
@router.get("/employees")
def get_employees(db: Session = Depends(get_db)):
    employees = db.query(models.Employee).all()
    return [{"id": e.id, "name": e.name} for e in employees]
