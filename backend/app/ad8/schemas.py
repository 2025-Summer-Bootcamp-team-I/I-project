from pydantic import BaseModel, Field
from typing import List

class ResponseItem(BaseModel):
    questionNo: int
    isCorrect: bool

class AD8Request(BaseModel):
    report_id: int
    responses: List[ResponseItem] = Field(..., min_length=8, max_length=8)

    class Config:
        json_schema_extra = {
            "example": {
                "report_id": 21,
                "responses": [
                    {"questionNo": 1, "isCorrect": True},
                    {"questionNo": 2, "isCorrect": False},
                    {"questionNo": 3, "isCorrect": True},
                    {"questionNo": 4, "isCorrect": False},
                    {"questionNo": 5, "isCorrect": True},
                    {"questionNo": 6, "isCorrect": True},
                    {"questionNo": 7, "isCorrect": False},
                    {"questionNo": 8, "isCorrect": True}
                ]
            }
        }

class AD8Result(BaseModel):
    risk_score: int
    message: str
