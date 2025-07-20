from fastapi import APIRouter, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from . import service

router = APIRouter()

@router.post(
    "",
    summary="드로잉 테스트(시계 그림) 업로드 및 AI 분석",
    description="reportId와 그림 파일을 업로드하면 AI가 분석해서 결과를 반환"
)
async def upload_drawing_test(
    reportId: int = Form(..., description="리포트 ID"),
    file: UploadFile = File(..., description="업로드할 시계 그림 이미지 파일"),
    db: Session = Depends(get_db)
):
    """
    드로잉 테스트(시계 그림)를 업로드하고 AI 분석 결과를 반환
    """
    result = await service.handle_upload(
        file=file,
        report_id=reportId,
        responses=[{"questionNo": 1, "isCorrect": True}],  # 기본값 설정
        db=db
    )
    return result
