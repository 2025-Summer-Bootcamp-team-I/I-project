from sqlalchemy.orm import Session
from . import crud, schemas
from .models import RiskLevel
from openai import OpenAI
import os
from collections import Counter

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def create_empty_report_service(db: Session, report: schemas.ReportCreate):
    empty_report_data = schemas.ReportCreate(
        user_id=report.user_id,
        drawingtest_result="",
        chat_result="",
        ad8test_result="",
        final_result="",
        recommendation="",
        total_score=0,
        ad8_score=0,
        drawing_score=0,
        memory_score=0,
        time_space_score=0,
        judgment_score=0,
        visual_score=0,
        language_score=0
    )
    return crud.create_empty_report(db, empty_report_data)

def determine_final_risk(ad8: RiskLevel, drawing: RiskLevel, chat: RiskLevel) -> RiskLevel:
    # 문자열로 통일
    risk_values = [
        ad8.value if isinstance(ad8, RiskLevel) else ad8,
        drawing.value if isinstance(drawing, RiskLevel) else drawing,
        chat.value if isinstance(chat, RiskLevel) else chat,
    ]
    count = Counter(risk_values)

    # 다수결: 같은 위험도가 2개 이상이면 그것으로 판단
    most_common = count.most_common(1)[0]
    if most_common[1] >= 2:
        return RiskLevel(most_common[0])

    # 셋 다 다르면 우선순위: AD8 > 시계 > 대화
    priority_order = [ad8, drawing, chat]
    for r in priority_order:
        if isinstance(r, RiskLevel):
            return r
        else:
            return RiskLevel(r)

def determine_final_result(risk: RiskLevel) -> str:
    if risk == RiskLevel.GOOD:
        return "치매 위험이 낮습니다."
    elif risk == RiskLevel.CAUTION:
        return "인지 기능이 다소 저하되어 주의가 필요합니다."
    else:
        return "치매 가능성이 높으므로 전문적인 진단이 필요합니다."

def generate_final_report_with_gpt(
    ad8_score: int,
    drawing_score: int,
    chat_risk: str,
    drawing_risk: str,
    ad8_risk: str,
    total_score: int
) -> str:
    prompt = f"""
다음은 환자의 인지 기능 선별 검사 결과입니다. 이 검사 결과를 바탕으로 전문의 소견서를 작성해주세요.  
총 6문장 이상, 8문장 이하로 구성하며, 너무 장황하거나 연결어 위주의 문장은 피하고,  
간결하고 명확하게 의학적 판단을 기술해주세요. 문장당 한 가지 정보만 담는 것이 좋습니다.  

[예시]
"환자는 AD8 검사에서 5점을 기록하여 인지 기능 저하 가능성이 있습니다.  
시계 그리기 검사에서는 5점을 받아 양호한 시공간 인지 능력을 보였습니다.  
대화 기반 평가에서도 기억력과 판단력 저하는 뚜렷하게 드러나지 않았습니다.  
전체적인 검사 결과는 경미한 이상 소견을 시사합니다.  
다만 AD8 점수는 주의 깊게 해석할 필요가 있습니다.  
총점은 낮아 심각한 인지 저하의 징후는 없습니다.  
현재로서는 정기적인 추적 관찰이 권장됩니다.  
필요시 신경심리검사 등 추가 검사를 고려할 수 있습니다."

[검사 결과]
- AD8 점수: {ad8_score}점 (위험도: {ad8_risk})
- 시계 그리기 검사: {drawing_score}점 (위험도: {drawing_risk})
- 대화 기반 위험도: {chat_risk}
- 총점: {total_score}점
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "당신은 신경과 전문의입니다."},
                {"role": "user", "content": prompt.strip()}
            ],
            temperature=0.4,
            max_tokens=500
        )

        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"❌ GPT 호출 실패: {str(e)}"