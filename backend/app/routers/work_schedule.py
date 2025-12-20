from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/work-schedule", tags=["Work Schedule"])

@router.get("/employee/{employee_id}", response_model=list[schemas.WorkScheduleOut])
def get_schedule(employee_id: int, db: Session = Depends(get_db)):
    return (db.query(models.WorkSchedule)
            .filter(models.WorkSchedule.employee_id == employee_id)
            .order_by(models.WorkSchedule.work_date.asc())
            .all())
