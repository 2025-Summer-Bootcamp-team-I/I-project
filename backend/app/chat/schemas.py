# app/chat/schemas.py
from __future__ import annotations

from pydantic import BaseModel
from datetime import datetime
from enum import Enum
from app.report.models import RiskLevel
from app.chat.models import RoleEnum


class ChatRequest(BaseModel):
    report_id: int
    chat_id: int
    message: str


class ChatResponse(BaseModel):
    response: str


class ChatLogResponse(BaseModel):
    role: RoleEnum
    text: str

    class Config:
        from_attributes = True
        use_enum_values = True

class CreateChatRequest(BaseModel):
    report_id: int


class CreateChatResponse(BaseModel):
    chat_id: int
    message: str

class EvaluateChatResponse(BaseModel):
    chat_result: str
    chat_risk: str
    message: str

class VoiceChatResponse(BaseModel):
    task_id: str