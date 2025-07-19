from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.report import models
from app.report.schemas import ReportResponse

router = APIRouter()

# CRUD 함수: report_id로 Report 조회
def get_report_by_id(db: Session, report_id: int):
    return db.query(models.Report).filter(models.Report.report_id == report_id).first()

# 서비스 함수: report_id로 결과 조회
def get_report_result_service(db: Session, report_id: int):
    return get_report_by_id(db, report_id)

# API 라우터: report_id로 결과 반환
@router.get("/reports/{report_id}", response_model=ReportResponse)
def get_report_result(report_id: int, db: Session = Depends(get_db)):
    report = get_report_result_service(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report