from sqlalchemy.orm import Session
from app.report.models import Report, RiskLevel
from . import models
from fastapi import HTTPException

def update_ad8_result(db: Session, report_id: int, ad8_score: int, ad8_result: str, risk_level: RiskLevel):
    db_report = db.query(Report).filter(Report.report_id == report_id).first()
    if not db_report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    db_report.ad8_score = ad8_score
    db_report.ad8test_result = ad8_result
    db_report.ad8_risk = risk_level
    db.commit()
    db.refresh(db_report)
    return db_report

def get_ad8_responses_detailed(db: Session, report_id: int):
    """AD8 테스트의 상세 응답 내역을 조회합니다 (AD8 테스트 API용)."""
    # 리포트 존재 여부 확인
    db_report = db.query(Report).filter(Report.report_id == report_id).first()
    if not db_report:
        raise HTTPException(status_code=404, detail="Report not found")

    test = db.query(models.AD8Test).filter(models.AD8Test.report_id == report_id).first()
    if not test:
        return None
    
    responses = db.query(models.AD8Response)\
        .filter(models.AD8Response.ad8test_id == test.ad8test_id)\
        .order_by(models.AD8Response.question_no)\
        .all()
    
    return {
        "total_responses": len(responses),
        "correct_responses": sum(1 for r in responses if r.is_correct),
        "responses": [{"question_no": r.question_no, "is_correct": r.is_correct} for r in responses]
    }

def get_ad8_responses_summary(db: Session, report_id: int):
    """AD8 테스트의 응답 요약 정보를 조회합니다 (리포트 조회 API용)."""
    # 리포트 존재 여부 확인
    db_report = db.query(Report).filter(Report.report_id == report_id).first()
    if not db_report:
        raise HTTPException(status_code=404, detail="Report not found")

    test = db.query(models.AD8Test).filter(models.AD8Test.report_id == report_id).first()
    if not test:
        return None
    
    responses = db.query(models.AD8Response)\
        .filter(models.AD8Response.ad8test_id == test.ad8test_id)\
        .all()
    
    return {
        "total_responses": len(responses),
        "correct_responses": sum(1 for r in responses if r.is_correct)
    }

# 하위 호환성을 위해 기존 함수명도 유지 (요약 버전으로 연결)
def get_ad8_responses(db: Session, report_id: int):
    return get_ad8_responses_summary(db, report_id)
