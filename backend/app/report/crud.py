from sqlalchemy.orm import Session
from . import models, schemas
from app.drawing.models import DrawingTest
from app.ad8 import crud as ad8_crud
from app.auth.models import User
from fastapi import HTTPException

def create_empty_report(db: Session, report: schemas.ReportCreate):
    # 유저가 존재하는지 먼저 확인
    user = db.query(User).filter(User.id == report.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_report = models.Report(
        user_id=report.user_id,
        drawingtest_result=report.drawingtest_result,
        chat_result=report.chat_result,
        ad8test_result=report.ad8test_result,
        final_result=report.final_result,
        recommendation=report.recommendation,
        total_score=report.total_score,
        ad8_score=report.ad8_score,
        drawing_score=report.drawing_score,
        memory_score=report.memory_score,
        time_space_score=report.time_space_score,
        judgment_score=report.judgment_score,
        visual_score=report.visual_score,
        language_score=report.language_score
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return new_report

def get_report(db: Session, report_id: int):
    """리포트를 상세 정보와 함께 조회합니다."""
    report = db.query(models.Report).filter(models.Report.report_id == report_id).first()
    if not report:
        return None

    # Drawing 테스트 이미지 URL 조회
    drawing_test = db.query(DrawingTest).filter(DrawingTest.report_id == report_id).first()
    drawing_image_url = drawing_test.image_url if drawing_test else None

    # AD8 테스트 응답 상세 조회
    ad8_details = ad8_crud.get_ad8_responses(db, report_id)

    # 리포트 데이터를 Pydantic 모델로 변환
    report_data = {
        "report_id": report.report_id,
        "user_id": report.user_id,
        "drawingtest_result": report.drawingtest_result,
        "chat_result": report.chat_result,
        "ad8test_result": report.ad8test_result,
        "final_result": report.final_result,
        "recommendation": report.recommendation,
        "total_score": report.total_score,
        "ad8_score": report.ad8_score,
        "drawing_score": report.drawing_score,
        "memory_score": report.memory_score,
        "time_space_score": report.time_space_score,
        "judgment_score": report.judgment_score,
        "visual_score": report.visual_score,
        "language_score": report.language_score,
        "ad8_risk": report.ad8_risk,
        "drawing_risk": report.drawing_risk,
        "chat_risk": report.chat_risk,
        "final_risk": report.final_risk,
        "drawing_image_url": drawing_image_url,
        "ad8_details": ad8_details
    }

    return schemas.DetailedReportResponse(**report_data)
