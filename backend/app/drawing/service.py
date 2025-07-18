import os
import base64
import json
from dotenv import load_dotenv
from openai import OpenAI
from . import utils, crud
from sqlalchemy.orm import Session
from fastapi import Depends
import re
from ..report.models import Report

env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env')
load_dotenv(env_path)

if not os.getenv("OPENAI_API_KEY"):
    raise ValueError("OPENAI_API_KEY environment variable is not set")

PROMPT = (
  "아래 이미지는 사용자가 그린 시계 그림입니다. "
  "이미 원은 그려져 있고, 사용자는 원 안에 알맞은 위치에 시침, 분침, 숫자만 직접 그렸습니다. "
  "시계가 '11시 10분'을 가리키도록 그려야 합니다. "
  "평가 기준은 다음과 같습니다:\n"
  "1) 쉴만(Shulman) 채점법에 따라 0~5점으로 평가:\n"
  "   • 5점: 완벽한 시계 그림 (11시 10분 정확히 표시 및 숫자/원 모양 완벽)\n"
  "   • 4점: 숫자 배열이나 침 위치에 약간 실수는 있어도 11시 10분이 명확히 표현됨\n"
  "   • 3점: 시계 구성은 거의 완벽하나, 11시 10분을 제대로 표시하지 못함 (예: 분침 미세 오류)\n"
  "   • 2점: 구성 불안정 + 시간 표시 부정확 (숫자 누락이나 위치 크게 어긋남)\n"
  "   • 1점: 시계 모양 알아볼 수 없거나 심한 오류 (숫자 많이 빠지거나 무질서)\n"
  "   • 0점: 시계로 인식할 수 없음 (시도조차 없음 또는 엉성하게 끄적임)\n"
  "2) risk_score 계산: (5 − 쉴만점수) × 2  → 0점→10, 5점→0 (치매 위험 допустим)\n"
  "3) drawing_score: 0~100 사이 점수, 어지간히 그렸으면 80점 이상, 노력과 긍정적 표현 포함\n"
  "4) drawingtest_result: 따뜻하고 긍정적인 피드백 문장 작성\n"
  "5) 항상 JSON만 출력\n"
  '예시: {\"risk_score\":4, \"drawing_score\":87, \"drawingtest_result\":\"노력과 시간이 잘 느껴집니다...\"}'
)


def call_gpt_vision(image_path: str):
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    abs_path = os.path.join("/app", image_path.lstrip("/"))
    with open(abs_path, "rb") as image_file:
        image_data = base64.b64encode(image_file.read()).decode('utf-8')

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": PROMPT},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{image_data}"
                        }
                    }
                ]
            }
        ],
        max_tokens=700,
    )
    content = response.choices[0].message.content or ""

    # === 코드블록(```json ... ```) 안에 있으면 JSON만 추출해서 파싱 ===
    m = re.search(r'```json(.*?)```', content, re.DOTALL)
    if m:
        json_str = m.group(1).strip()
    else:
        json_str = content.strip()

    try:
        result = json.loads(json_str)
    except Exception:
        result = {"risk_score": 0, "drawing_score": 0, "drawingtest_result": content}

    risk_score = int(result.get("risk_score", 0))
    drawing_score = int(result.get("drawing_score", 0))
    drawingtest_result = result.get("drawingtest_result", "")
    return risk_score, drawing_score, drawingtest_result

async def handle_upload(
    file,                  # UploadFile
    report_id: int,        # Form 데이터(reportId)
    responses,             # Form 데이터(responses, 파싱된 리스트)
    db: Session = Depends()
):
    """
    file: 업로드된 이미지 파일
    report_id: 연결할 리포트 ID
    responses: [{"questionNo": int, "isCorrect": bool}, ...]
    db: DB 세션
    """
    image_path = await utils.save_file_locally(file)
    risk_score, drawing_score, drawingtest_result = call_gpt_vision(image_path)

    # responses가 리스트라면 첫 번째만 꺼내서 활용 (1개만 쓸 경우)
    first_response = responses[0] if isinstance(responses, list) and len(responses) > 0 else None

    # drawing_test 테이블에는 이미지 URL과 risk_score만 저장
    db_obj = crud.create_drawing_test(
        db=db,
        report_id=report_id,
        image_url=image_path,
        risk_score=risk_score,
    )

    # Report 테이블 업데이트
    from sqlalchemy import text
    update_stmt = text("UPDATE reports SET drawing_score = :score, drawingtest_result = :result WHERE report_id = :id")
    db.execute(update_stmt, {"score": drawing_score, "result": drawingtest_result, "id": report_id})
    db.commit()

    # API 응답은 기존과 동일하게 모든 정보를 포함
    return {
        "drawing_id": db_obj.drawing_id,
        "report_id": db_obj.report_id,
        "image_url": db_obj.image_url,
        "risk_score": risk_score,
        "drawing_score": drawing_score,
        "drawingtest_result": drawingtest_result
    }
