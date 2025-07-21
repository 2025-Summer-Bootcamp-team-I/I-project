# app/chat/crud.py
from sqlalchemy.orm import Session
from app.chat.models import ChatLog, RoleEnum

def save_chat_log(db: Session, chat_id: int, role: RoleEnum, text: str):
    log = ChatLog(chat_id=chat_id, role=role, text=text)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log