from sqlalchemy.orm import Session
from . import crud, schemas
from .models import RiskLevel
import os
from collections import Counter
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv(dotenv_path="./backend/.env")  # ✅ 경로 명시!!

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
print("✅ 적용된 API 키:", os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")
print("✅ Gemini 모델 로딩됨:", model)

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
    risk_values = [
        ad8.value if isinstance(ad8, RiskLevel) else ad8,
        drawing.value if isinstance(drawing, RiskLevel) else drawing,
        chat.value if isinstance(chat, RiskLevel) else chat,
    ]
    count = Counter(risk_values)

    most_common = count.most_common(1)[0]
    if most_common[1] >= 2:
        return RiskLevel(most_common[0])

    return RiskLevel("경계")

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

[검사 결과]
- AD8 점수: {ad8_score}점 (위험도: {ad8_risk})
- 시계 그리기 검사: {drawing_score}점 (위험도: {drawing_risk})
- 대화 기반 위험도: {chat_risk}
- 총점: {total_score}점
"""

    try:
        print("🧪 Gemini 보고서 생성 시도 중입니다...")  # ✅ 실제 호출되는지 확인용
        response = model.generate_content(prompt.strip())
        return response.text.strip()
    except Exception as e:
        print(f"❌ Gemini 에러 발생: {e}")
        return f"❌ Gemini 호출 실패: {str(e)}"