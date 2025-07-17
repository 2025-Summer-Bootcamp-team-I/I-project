from sqlalchemy.orm import Session
from . import models

# 드로잉 테스트 결과 저장
def create_drawing_test(
    db: Session,
    report_id: int,
    image_url: str,
    risk_score: int,
):
    db_drawing = models.DrawingTest(
        report_id=report_id,
        image_url=image_url,
        risk_score=risk_score,
    )
    db.add(db_drawing)
    db.commit()
    db.refresh(db_drawing)
    return db_drawing

# report_id로 드로잉 테스트 결과 1건 조회
def get_drawing_test_by_report_id(db: Session, report_id: int):
    return db.query(models.DrawingTest)\
        .filter(models.DrawingTest.report_id == report_id)\
        .first()

# drawing_id로 조회 (옵션)
def get_drawing_test_by_id(db: Session, drawing_id: int):
    return db.query(models.DrawingTest)\
        .filter(models.DrawingTest.drawing_id == drawing_id)\
        .first()

# 여러 report_id로 드로잉 테스트 결과 조회 (옵션)
def get_drawing_tests_by_report_ids(db: Session, report_ids: list[int]):
    return db.query(models.DrawingTest)\
        .filter(models.DrawingTest.report_id.in_(report_ids))\
        .all()
