from sqlalchemy.orm import Session
from . import schemas as ad8_schemas
from . import crud as ad8_crud
from app.report import crud as report_crud

def get_ad8_opinion(score: int) -> str:
    if 0 <= score <= 1:
        return "AD8 검사 결과, 피검자의 인지 기능은 정상 범위로 판단됩니다. 현재로서는 별도의 조치가 필요하지 않습니다."
    elif 2 <= score <= 3:
        return "경미한 인지 저하 가능성이 관찰됩니다. 정기적인 모니터링과 생활습관 관리가 권장됩니다."
    elif 4 <= score <= 5:
        return "인지 기능 저하가 뚜렷이 의심되며, 신경과 전문의와의 상담 및 정밀 평가를 권장드립니다."
    else: # 6~8점
        return "심각한 인지 저하 징후가 확인되었습니다. 가능한 한 조속한 시일 내 전문적인 진단 및 치료 계획 수립이 필요합니다."

def process_ad8_test(db: Session, data: ad8_schemas.AD8Request):
    # 1. 점수 계산 (is_correct가 True인 항목의 개수를 셉니다)
    risk_score = sum(r.is_correct for r in data.responses)

    # 2. 점수에 따른 소견 생성
    opinion = get_ad8_opinion(risk_score)

    # 3. reports 테이블에 점수와 소견 업데이트
    report_crud.update_report_ad8_result(
        db=db,
        report_id=data.report_id,
        risk_score=risk_score,
        ad8_opinion=opinion
    )

    # 4. AD8 자체 테이블에도 저장
    ad8_crud.create_ad8_test(db=db, data=data, risk_score=risk_score)

    return {"risk_score": risk_score, "message": opinion}
