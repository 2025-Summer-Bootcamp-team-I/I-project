# app/chat/schemas.py
from __future__ import annotations

from pydantic import BaseModel
from datetime import datetime
from enum import Enum
class ChatRequest(BaseModel):
    report_id: int
    chat_id: int
    message: str

class ChatResponse(BaseModel):
    response: str

class RoleEnum(str, Enum):
    user = "user"
    ai = "ai"

class ChatLogResponse(BaseModel):
    id: int
    chat_id: int
    role: RoleEnum
    message: str
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_orm(cls, obj):
        return cls(
            id=obj.log_id,
            chat_id=obj.chat_id,
            role=obj.role,
            message=obj.text,
            created_at=obj.created_at,
            updated_at=obj.updated_at,
        )

    class Config:
        from_attributes = True

class CreateChatRequest(BaseModel):
    report_id: int | None = None

class CreateChatResponse(BaseModel):
    chat_id: int
    message: str