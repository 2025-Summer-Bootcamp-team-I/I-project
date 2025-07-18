from fastapi import APIRouter, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from . import service

import json

router = APIRouter()

@router.post(
    "/",
    summary="드로잉 테스트(시계 그림) 업로드 및 AI 분석",
    description="reportId, responses(JSON 문자열), 그림 파일을 업로드하면 AI가 분석해서 결과를 반환"
)
async def upload_drawing_test(
    reportId: int = Form(..., description="리포트 ID"),
    responses: str = Form(..., description="문제 응답(JSON 문자열, 예: [{\"questionNo\":1, \"isCorrect\":true}])"),
    file: UploadFile = File(..., description="업로드할 시계 그림 이미지 파일"),
    db: Session = Depends(get_db)
):
    """
    드로잉 테스트(시계 그림)를 업로드하고 AI 분석 결과를 반환
    """
    # responses를 JSON 문자열로 받아 파싱 (빈 값일 경우 빈 리스트로 처리)
    parsed_responses = json.loads(responses) if responses else []
    # responses가 1개만 있다고 가정할 때(리스트의 첫 번째 값 사용)
    response = parsed_responses[0] if isinstance(parsed_responses, list) and parsed_responses else None

    result = await service.handle_upload(
        file=file,
        report_id=reportId,
        responses=parsed_responses,  # responses로 이름 맞추기!
        db=db
    )
    return result
