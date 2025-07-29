from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from . import service
from app.auth.utils import get_current_user
from app.auth.models import User
from app.report.models import Report

router = APIRouter()

@router.post(
    "",
    summary="드로잉 테스트(시계 그림) 업로드 및 AI 분석",
    description="reportId와 그림 파일을 업로드하면 AI가 분석해서 결과를 반환"
)
async def upload_drawing_test(
    reportId: int = Form(..., description="리포트 ID"),
    file: UploadFile = File(..., description="업로드할 시계 그림 이미지 파일"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    드로잉 테스트(시계 그림)를 업로드하고 AI 분석 결과를 반환
    """
    # 리포트 소유권 확인
    report = db.query(Report).filter(Report.report_id == reportId).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if report.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    result = await service.handle_upload(
        file=file,
        report_id=reportId,
        db=db
    )
    return result
