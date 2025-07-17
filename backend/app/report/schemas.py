from pydantic import BaseModel

class ReportCreate(BaseModel):
    user_id: int
    drawingtest_result: str = ""
    chat_result: str = ""
    ad8test_result: str = ""
    soundtest_result: str = ""
    recommendation: str = ""
    total_score: int = 0

class ReportResponse(BaseModel):
    report_id: int
    user_id: int
    drawingtest_result: str
    chat_result: str
    ad8test_result: str
    soundtest_result: str
    recommendation: str
    total_score: int

    class Config:
        from_attributes = True
