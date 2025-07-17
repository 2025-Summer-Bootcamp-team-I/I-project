from sqlalchemy.orm import Session
from . import models, schemas

def create_empty_report(db: Session, report: schemas.ReportCreate):
    new_report = models.Report(
        user_id=report.user_id,
        drawingtest_result=report.drawingtest_result,
        chat_result=report.chat_result,
        ad8test_result=report.ad8test_result,
        soundtest_result=report.soundtest_result,
        recommendation=report.recommendation,
        total_score=report.total_score,
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return new_report
