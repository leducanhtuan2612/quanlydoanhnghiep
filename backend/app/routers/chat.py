from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict

from app.database import get_db, SessionLocal
from app.models import Employee, Conversation, ConversationMember, Message
from app.schemas import (
    ChatEmployeeOut,
    ConversationOut,
    MessageOut,
    CreatePrivateConversation,
)

router = APIRouter(prefix="/chat", tags=["Chat"])


# =========================
# WEBSOCKET MANAGER
# =========================
class ConnectionManager:
    def __init__(self):
        # conversation_id -> list websocket
        self.active: Dict[int, List[WebSocket]] = {}

    async def connect(self, conversation_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active.setdefault(conversation_id, []).append(websocket)

    def disconnect(self, conversation_id: int, websocket: WebSocket):
        conns = self.active.get(conversation_id)
        if not conns:
            return
        if websocket in conns:
            conns.remove(websocket)
        if len(conns) == 0:
            self.active.pop(conversation_id, None)

    async def broadcast(self, conversation_id: int, data: dict):
        for ws in self.active.get(conversation_id, []):
            await ws.send_json(data)


manager = ConnectionManager()


# =========================
# DANH SÁCH NHÂN VIÊN
# =========================
@router.get("/employees", response_model=List[ChatEmployeeOut])
def list_employees(db: Session = Depends(get_db)):
    return db.query(Employee).filter(Employee.active == True).all()


# =========================
# TẠO / LẤY CHAT RIÊNG
# =========================
@router.post("/conversations/private", response_model=ConversationOut)
def create_private_chat(
    payload: CreatePrivateConversation,
    employee_id: int = Query(...),
    db: Session = Depends(get_db),
):
    other_id = payload.other_employee_id

    if employee_id == other_id:
        raise HTTPException(400, "Không thể chat với chính mình")

    # tìm conversation private đã tồn tại giữa 2 người
    conversations = (
        db.query(Conversation)
        .join(ConversationMember)
        .filter(Conversation.type == "private")
        .all()
    )

    for c in conversations:
        ids = [m.employee_id for m in c.members]
        if set(ids) == {employee_id, other_id}:
            return ConversationOut(
                id=c.id,
                type=c.type,
                created_at=c.created_at,
                other_employee=db.get(Employee, other_id),
            )

    # tạo mới
    conv = Conversation(type="private")
    db.add(conv)
    db.commit()
    db.refresh(conv)

    db.add_all(
        [
            ConversationMember(conversation_id=conv.id, employee_id=employee_id),
            ConversationMember(conversation_id=conv.id, employee_id=other_id),
        ]
    )
    db.commit()

    return ConversationOut(
        id=conv.id,
        type=conv.type,
        created_at=conv.created_at,
        other_employee=db.get(Employee, other_id),
    )


# =========================
# LẤY / TẠO CHAT TỔNG (GROUP)
# =========================
@router.get("/conversations/group", response_model=ConversationOut)
def get_group_chat(
    employee_id: int = Query(...),
    db: Session = Depends(get_db),
):
    conv = db.query(Conversation).filter(Conversation.type == "group").first()

    # chưa có -> tạo group + add all active employees
    if not conv:
        conv = Conversation(type="group")
        db.add(conv)
        db.commit()
        db.refresh(conv)

        employees = db.query(Employee).filter(Employee.active == True).all()
        db.add_all(
            [
                ConversationMember(conversation_id=conv.id, employee_id=e.id)
                for e in employees
            ]
        )
        db.commit()

    # nếu user chưa là member -> add
    exists = (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conv.id,
            ConversationMember.employee_id == employee_id,
        )
        .first()
    )
    if not exists:
        db.add(ConversationMember(conversation_id=conv.id, employee_id=employee_id))
        db.commit()

    return ConversationOut(
        id=conv.id,
        type=conv.type,
        created_at=conv.created_at,
        other_employee=None,
    )


# =========================
# LỊCH SỬ TIN NHẮN (CÓ sender_name)
# =========================
@router.get("/messages/{conversation_id}", response_model=List[MessageOut])
def get_messages(conversation_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(Message, Employee)
        .join(Employee, Employee.id == Message.sender_id)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
        .all()
    )

    return [
        MessageOut(
            id=m.id,
            conversation_id=m.conversation_id,
            sender_id=m.sender_id,
            sender_name=e.name,
            content=m.content,
            created_at=m.created_at,
        )
        for m, e in rows
    ]


# =========================
# WEBSOCKET CHAT (REALTIME + sender_name)
# =========================
@router.websocket("/ws/{conversation_id}")
async def chat_ws(websocket: WebSocket, conversation_id: int):
    employee_id = websocket.query_params.get("employee_id")
    if not employee_id:
        await websocket.close(code=1008)
        return

    employee_id = int(employee_id)

    await manager.connect(conversation_id, websocket)
    db = SessionLocal()

    try:
        while True:
            data = await websocket.receive_json()
            content = (data.get("content") or "").strip()
            if not content:
                continue

            # lưu message
            msg = Message(
                conversation_id=conversation_id,
                sender_id=employee_id,
                content=content,
            )
            db.add(msg)
            db.commit()
            db.refresh(msg)

            emp = db.get(Employee, employee_id)

            # broadcast realtime cho các client đang mở conversation này
            await manager.broadcast(
                conversation_id,
                {
                    "id": msg.id,
                    "conversation_id": conversation_id,
                    "sender_id": employee_id,
                    "sender_name": emp.name if emp else "Unknown",
                    "content": msg.content,
                    "created_at": msg.created_at.isoformat(),
                },
            )

    except WebSocketDisconnect:
        manager.disconnect(conversation_id, websocket)
    finally:
        db.close()
