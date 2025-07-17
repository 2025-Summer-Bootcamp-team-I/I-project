from sqlalchemy.orm import Session
from . import models, schemas

def create_report(db: Session, report: schemas.ReportCreate):
    db_report = models.Report(**report.model_dump())
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

def update_report_ad8_result(db: Session, report_id: int, risk_score: int, ad8_opinion: str):
    db_report = db.query(models.Report).filter(models.Report.report_id == report_id).first()
    if db_report:
        db_report.total_score = risk_score
        db_report.recommendation = ad8_opinion
        db_report.ad8test_result = ad8_opinion # ad8test_result에도 동일하게 저장
        db.commit()
        db.refresh(db_report)
    return db_report
