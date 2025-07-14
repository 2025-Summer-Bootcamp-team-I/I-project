from .schemas import AD8Request

def calculate_ad8_risk_score(data: AD8Request) -> int:
    # isCorrect == False인 응답 개수를 점수로 계산
    return sum(not r.isCorrect for r in data.responses)

def get_ad8_result_message(score: int) -> str:
    return "치매 위험이 있습니다." if score >= 2 else "정상 범위입니다."
