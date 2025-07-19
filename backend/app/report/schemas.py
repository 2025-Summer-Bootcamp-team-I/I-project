from pydantic import BaseModel

class ReportCreate(BaseModel):
    drawingtest_result: str = ""
    chat_result: str = ""
    ad8test_result: str = ""
    soundtest_result: str = ""
    final_result: str = ""
    recommendation: str = ""
    total_score: int = 0
    sound_score: int = 0
    ad8_score: int = 0
    drawing_score: int = 0
    text_score: int = 0
    memory_score: int = 0
    time_space_score: int = 0
    judgment_score: int = 0
    visual_score: int = 0
    language_score: int = 0

class ReportResponse(BaseModel):
    report_id: int
    user_id: int
    drawingtest_result: str
    chat_result: str
    ad8test_result: str
    soundtest_result: str
    final_result: str
    recommendation: str
    total_score: int
    sound_score: int
    ad8_score: int
    drawing_score: int
    text_score: int
    memory_score: int
    time_space_score: int
    judgment_score: int
    visual_score: int
    language_score: int

    class Config:
        orm_mode = True

class SimpleReportResponse(BaseModel):
    report_id: int
    user_id: int

    class Config:
        orm_mode = True
