#app/report/schemas.py
from pydantic import BaseModel
from typing import List, Optional
from .models import RiskLevel

class EmptyReportCreate(BaseModel):
    """빈 리포트 생성용 스키마 - risk 필드들에 기본값 설정"""
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
    # risk 필드들도 포함하되 None으로 기본값 설정
    ad8_risk: Optional[RiskLevel] = None
    drawing_risk: Optional[RiskLevel] = None
    chat_risk: Optional[RiskLevel] = None
    final_risk: Optional[RiskLevel] = None

    class Config:
        use_enum_values = True

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
    ad8_risk: Optional[RiskLevel] = None
    drawing_risk: Optional[RiskLevel] = None
    chat_risk: Optional[RiskLevel] = None
    final_risk: Optional[RiskLevel] = None

    class Config:
        use_enum_values = True  # enum 값을 직렬화할 때 실제 값 사용

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
    ad8_risk: Optional[RiskLevel] = None
    drawing_risk: Optional[RiskLevel] = None
    chat_risk: Optional[RiskLevel] = None
    final_risk: Optional[RiskLevel] = None
    
    # 추가 상세 정보 (요약 버전 사용)
    drawing_image_url: Optional[str] = None
    ad8_details: Optional[AD8TestDetail] = None

    class Config:
        orm_mode = True
        use_enum_values = True  # enum 값을 직렬화할 때 실제 값 사용

class SimpleReportResponse(BaseModel):
    report_id: int
    user_id: int

    class Config:
        orm_mode = True