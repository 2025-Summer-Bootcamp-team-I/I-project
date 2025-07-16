# app/drawing/schemas.py
from pydantic import BaseModel
from typing import List

class DrawingResponse(BaseModel):
    questionNo: int
    isCorrect: bool

class DrawingCreateRequest(BaseModel):
    reportId: int
    responses: List[DrawingResponse]

class DrawingResult(BaseModel):
    riskScore: int
    summary: str
    detail: str
    full_message: str
    image_url: str
