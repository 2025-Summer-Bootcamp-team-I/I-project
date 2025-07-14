from pydantic import BaseModel
from typing import List

class ResponseItem(BaseModel):
    questionNo: int
    isCorrect: bool

class AD8Request(BaseModel):
    reportId: int
    responses: List[ResponseItem]

class AD8Result(BaseModel):
    risk_score: int
    message: str
