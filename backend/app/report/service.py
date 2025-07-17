from sqlalchemy.orm import Session
from . import crud, schemas

def create_report_service(db: Session, report: schemas.ReportCreate):
    # 모든 필드를 명시적으로 전달
    empty_report_data = schemas.ReportCreate(
        user_id=report.user_id,
        drawingtest_result="",
        chat_result="",
        ad8test_result="",
        soundtest_result="",
        recommendation="",
        total_score=0
    )
    return crud.create_report(db, empty_report_data)
