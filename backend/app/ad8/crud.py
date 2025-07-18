from sqlalchemy.orm import Session
from app.report.models import Report

def update_ad8_result(db: Session, report_id: int, ad8_score: int, ad8_result: str):
    db_report = db.query(Report).filter(Report.report_id == report_id).first()
    if db_report:
        db_report.ad8_score = ad8_score
        db_report.ad8test_result = ad8_result
        db.commit()
        db.refresh(db_report)
    return db_report
