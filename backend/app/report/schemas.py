from pydantic import BaseModel
from typing import List, Optional

class ReportCreate(BaseModel):
    drawingtest_result: str = ""
    chat_result: str = ""
    ad8test_result: str = ""
    final_result: str = ""
    recommendation: str = ""
    total_score: int = 0
    ad8_score: int = 0
    drawing_score: int = 0
    memory_score: int = 0
    time_space_score: int = 0
    judgment_score: int = 0
    visual_score: int = 0
    language_score: int = 0
    ad8_risk: str = ""
    drawing_risk: str = ""
    chat_risk: str = ""
    final_risk: str = ""

class AD8ResponseDetail(BaseModel):
    question_no: int
    is_correct: bool

class AD8TestDetailFull(BaseModel):
    """상세한 AD8 테스트 결과 (AD8 테스트 API용)"""
    total_responses: int
    correct_responses: int
    responses: List[AD8ResponseDetail]

class AD8TestDetailSummary(BaseModel):
    """요약된 AD8 테스트 결과 (리포트 조회 API용)"""
    total_responses: int
    correct_responses: int

# 하위 호환성을 위해 기존 이름 유지 (요약 버전)
class AD8TestDetail(BaseModel):
    total_responses: int
    correct_responses: int

class DetailedReportResponse(BaseModel):
    report_id: int
    user_id: int
    
    # 테스트 결과 및 소견
    drawingtest_result: str
    chat_result: str
    ad8test_result: str
    final_result: str
    recommendation: str
    
    # 점수
    total_score: int
    ad8_score: int
    drawing_score: int
    memory_score: int
    time_space_score: int
    judgment_score: int
    visual_score: int
    language_score: int
    
    # 위험도
    ad8_risk: str
    drawing_risk: str
    chat_risk: str
    final_risk: str
    
    # 추가 상세 정보 (요약 버전 사용)
    drawing_image_url: Optional[str] = None
    ad8_details: Optional[AD8TestDetail] = None

    class Config:
        orm_mode = True

class SimpleReportResponse(BaseModel):
    report_id: int
    user_id: int

    class Config:
        orm_mode = True
