from sqlalchemy.orm import Session
from . import models, schemas

def create_empty_report(db: Session, report: schemas.ReportCreate, user_id: int):
    new_report = models.Report(
        user_id=user_id,
        drawingtest_result=report.drawingtest_result,
        chat_result=report.chat_result,
        ad8test_result=report.ad8test_result,
        soundtest_result=report.soundtest_result,
        final_result=report.final_result,
        recommendation=report.recommendation,
        total_score=report.total_score,
        sound_score=report.sound_score,
        ad8_score=report.ad8_score,
        drawing_score=report.drawing_score,
        text_score=report.text_score,
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
