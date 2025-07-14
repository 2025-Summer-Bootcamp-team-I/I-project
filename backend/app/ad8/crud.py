from sqlalchemy.orm import Session
from .models import AD8Test, AD8Response
from .schemas import AD8Request

def create_ad8_test(db: Session, data: AD8Request, risk_score: int):
    # AD8Test 테이블에 먼저 저장
    ad8_test = AD8Test(
        report_id = data.reportId,
        risk_score = risk_score
    )
    db.add(ad8_test)
    db.commit()
    db.refresh(ad8_test)

    # 각 질문 응답을 AD8Response 테이블에 저장
    for r in data.responses:
        response = AD8Response(
            ad8test_id = ad8_test.ad8test_id,
            question_no = r.questionNo,
            is_correct = r.isCorrect
        )
        db.add(response)

    db.commit()
    return ad8_test
