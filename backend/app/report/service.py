from sqlalchemy.orm import Session
from . import crud, schemas

def create_empty_report_service(db: Session, user_id: int):
    # 모든 필드를 명시적으로 전달
    empty_report_data = schemas.ReportCreate(
        drawingtest_result="",
        chat_result="",
        ad8test_result="",
        soundtest_result="",
        final_result="",
        recommendation="",
        total_score=0,
        sound_score=0,
        ad8_score=0,
        drawing_score=0,
        text_score=0,
        memory_score=0,
        time_space_score=0,
        judgment_score=0,
        visual_score=0,
        language_score=0
    )
    return crud.create_empty_report(db, empty_report_data, user_id)
