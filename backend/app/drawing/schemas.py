from pydantic import BaseModel, Field

# 1. 드로잉 테스트 단일 응답(정답 여부 등)
class DrawingResponse(BaseModel):
    questionNo: int = Field(..., description="문제 번호")
    isCorrect: bool = Field(..., description="정답 여부")

# 2. 드로잉 테스트 요청 (한 리포트에 1번 그림, 응답 1개)
class DrawingTestCreateRequest(BaseModel):
    report_id: int = Field(..., description="연결된 Report의 ID")
    response: DrawingResponse = Field(..., description="그림 검사 문제 응답 1개")

# 3. 드로잉 테스트 결과(응답) 모델
class DrawingTestResult(BaseModel):
    drawing_id: int = Field(..., description="드로잉테스트 PK")
    report_id: int = Field(..., description="연결된 Report의 ID")
    image_url: str = Field(..., description="저장된 그림 파일 경로")
    risk_score: int = Field(..., description="치매 위험 점수 (예: 0~10)")
    drawing_score: int = Field(..., description="그림 평가 점수 (예: 0~100)")
    drawingtest_result: str = Field(..., description="그림 평가 결과 텍스트")

    class Config:
        orm_mode = True

# 4. (선택) 여러 개 리스트 응답 필요 시
class DrawingTestResultList(BaseModel):
    results: list[DrawingTestResult]