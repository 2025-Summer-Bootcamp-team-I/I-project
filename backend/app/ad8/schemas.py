from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel
from typing import List

class CamelCaseModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )

class ResponseItem(CamelCaseModel):
    question_no: int
    is_correct: bool

class AD8Request(BaseModel):
    report_id: int
    responses: List[ResponseItem]

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "report_id": 1,
                    "responses": [
                        {"questionNo": 1, "isCorrect": True},
                        {"questionNo": 2, "isCorrect": False},
                        {"questionNo": 3, "isCorrect": True},
                        {"questionNo": 4, "isCorrect": False},
                        {"questionNo": 5, "isCorrect": True},
                        {"questionNo": 6, "isCorrect": True},
                        {"questionNo": 7, "isCorrect": False},
                        {"questionNo": 8, "isCorrect": True},
                    ],
                }
            ]
        }
    )

class AD8Result(BaseModel):
    risk_score: int
    message: str
