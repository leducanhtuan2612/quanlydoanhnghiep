from app.models import Notification
from sqlalchemy.orm import Session
from datetime import datetime

def push_notify(db: Session, title: str, time: str = "Vừa xong"):
    new_notify = Notification(
        title=title,
        time=time,
        created_at=datetime.utcnow()
    )
    db.add(new_notify)
    db.commit()
    db.refresh(new_notify)
    return new_notify
