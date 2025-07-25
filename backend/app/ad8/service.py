from sqlalchemy.orm import Session
from . import schemas, crud, models
from app.report.models import RiskLevel

def get_ad8_result_message(score: int) -> str:
    if score <= 1:
        return "AD8 검사 결과, 피검자의 인지 기능은 정상 범위로 판단됩니다. 현재로서는 별도의 조치가 필요하지 않습니다."
    elif score <= 3:
        return "경미한 인지 저하 가능성이 관찰됩니다. 정기적인 모니터링과 생활습관 관리가 권장됩니다."
    elif score <= 5:
        return "인지 기능 저하가 뚜렷이 의심되며, 신경과 전문의와의 상담 및 정밀 평가를 권장드립니다."
    else:
        return "AD8 검사 결과, 심각한 인지 저하 징후가 확인되었습니다. 가능한 한 조속한 시일 내 전문적인 진단 및 치료 계획 수립이 필요합니다."

def get_ad8_risk_level(ad8_score: int) -> RiskLevel:
    """
    AD8 점수에 따른 위험도 평가
    
    Args:
        ad8_score: AD8 테스트 점수 (0-8, "예" 답변 개수)
        
    Returns:
        RiskLevel: 위험도 enum 객체
    """
    if ad8_score <= 1:  # 0~1: 양호 (문제가 거의 없음)
        return RiskLevel.GOOD
    elif ad8_score <= 3:  # 2~3: 경계 (일부 문제 있음)
        return RiskLevel.CAUTION
    else:  # 4~8: 위험 ("예" 답변이 많음 = 문제 많음)
        return RiskLevel.DANGER

def process_ad8_test(db: Session, data: schemas.AD8Request):
    # '예' (isCorrect=True) 응답의 개수를 합산하여 위험 점수 계산
    risk_score = sum(1 for r in data.responses if r.isCorrect)
    message = get_ad8_result_message(risk_score)
    risk_level = get_ad8_risk_level(risk_score)

    # AD8Test 테이블에 데이터 저장
    ad8_test = models.AD8Test(
        report_id=data.report_id,
        risk_score=risk_score
    )
    db.add(ad8_test)
    db.commit()
    db.refresh(ad8_test)

    # AD8Response 테이블에 각 응답 저장
    for response in data.responses:
        ad8_response = models.AD8Response(
            ad8test_id=ad8_test.ad8test_id,
            question_no=response.questionNo,
            is_correct=response.isCorrect
        )
        db.add(ad8_response)
    
    db.commit()

    # Report 테이블 업데이트
    crud.update_ad8_result(
        db=db,
        report_id=data.report_id,
        ad8_score=risk_score,
        ad8_result=message,
        risk_level=risk_level
    )

    return {"risk_score": risk_score, "message": message, "risk_level": risk_level}
