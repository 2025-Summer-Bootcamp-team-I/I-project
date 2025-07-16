from sqlalchemy.orm import Session
from . import models

def create_drawing(db: Session, report_id: int, image_url: str, risk_score: int, summary: str, detail: str):
    db_drawing = models.Drawing(
        report_id=report_id,
        image_url=image_url,
        risk_score=risk_score,
        summary=summary,
        detail=detail
    )
    db.add(db_drawing)
    db.commit()
    db.refresh(db_drawing)
    return db_drawing

def get_drawing_by_report_id(db: Session, report_id: int):
    return db.query(models.Drawing).filter(models.Drawing.report_id == report_id).first()

# 사용자별 드로잉 조회는 리포트 API를 통해 처리하도록 수정
def get_drawings_by_report_ids(db: Session, report_ids: list[int]):
    return db.query(models.Drawing)\
        .filter(models.Drawing.report_id.in_(report_ids))\
        .all()
