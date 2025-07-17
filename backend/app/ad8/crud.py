from sqlalchemy.orm import Session
from . import models
from . import schemas

def create_ad8_test(db: Session, data: schemas.AD8Request, risk_score: int):
    # AD8Test 테이블에 먼저 저장
    ad8_test = models.AD8Test(
        report_id=data.report_id,
        risk_score=risk_score
    )
    db.add(ad8_test)
    db.commit()
    db.refresh(ad8_test)

    # 각 질문 응답을 AD8Response 테이블에 저장
    for r in data.responses:
        response = models.AD8Response(
            AD8Test_id=ad8_test.AD8Test_id,
            question_no=r.question_no,
            is_correct=r.is_correct
        )
        db.add(response)

    db.commit()
    return ad8_test
