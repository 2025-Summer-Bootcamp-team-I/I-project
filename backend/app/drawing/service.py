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
  "이미 원이 그려져 있고, 사용자는 원 안에 알맞은 위치에 시침, 분침, 숫자만 직접 그렸습니다. "
  "시계가 '11시 10분'을 가리키도록 그려야 합니다. "
  "평가는 **쉴만(Shulman) 채점법(0~5점 척도)**을 아주 상세히 수행하세요:\n"
  
  "  • **5점 (완벽)**\n"
  "    – 숫자 1~12 모두 정확한 위치와 균등한 간격으로 배열되어 있음\n"
  "    – 중앙 축이 명확하고, 시침은 11시, 분침은 2(10분)를 선명하게 가리킴\n"
  "    – 침의 길이·두께·방향·비례까지 조화로워 전체적으로 오류 없음\n"
  
  "  • **4점 (경미한 오류)**\n"
  "    – 숫자 간격이 약간 불균형하거나 글씨가 살짝 흔들릴 수 있으나\n"
  "      전반적으로 11:10이 명확하게 읽힘\n"
  "    – 침이 약간 어긋나 있어도 전체 시간 식별에는 문제 없음\n"
  
  "  • **3점 (중간 수준 오류)**\n"
  "    – 숫자 1~2개가 누락되었거나 위치가 약간 어긋남\n"
  "    – 시침 또는 분침 한쪽에 미세한 오차가 있고\n"
  "      전체적으로 11:10이나 약간 혼란스럽게 보일 수 있음\n"
  
  "  • **2점 (불안정한 구성)**\n"
  "    – 숫자가 여러 개 빠지거나 밀집되어 간격·방향이 불규칙함\n"
  "    – 침 위치가 혼란스러워 정확한 시간 판독이 매우 어려움\n"
  "    – 시계 형태는 인식되나 기능적으로 시간 읽기 힘듦\n"
  
  "  • **1점 (심각한 오류)**\n"
  "    – 숫자 대부분이 누락되었거나 무질서하게 배치됨\n"
  "    – 침 위치도 엉망이어서 방향이나 시간 파악이 거의 불가능함\n"
  
  "  • **0점 (무의미한 낙서)**\n"
  "    – 시계 형태가 전혀 인식되지 않거나, 거의 그림을 그리지 않음\n"
  
  "(※ 쉴만 채점법은 시각‑구성 및 실행 기능을 평가할 때 널리 사용되며, " 
  "인지 저하 선별에 높은 신뢰도를 보이는 평가 방식입니다.)\n"
  
  "※ **출력 포맷 (JSON 형식)**:\n"
  "  {\"risk_score\":<0~5점>, \"drawing_score\":<0~5점>, "
  "\"drawingtest_result\":\"(130자이상 분량 따뜻한 피드백)\"}\n"
  
  "※ **risk_score**와 **drawing_score**는 동일한 값을 사용하세요.\n"
  "※ **drawingtest_result**는 130자이상 분량으로, "
  "고령자에게 격려와 긍정의 어조로 작성하세요.\n"
  
  "※ **예시 출력**:\n"
  "{\"risk_score\":3, \"drawing_score\":3, "
  "\"drawingtest_result\":\"숫자 배열이 몇 군데 어긋나 있고 간격이 들쑥날쑥한 부분이 보이지만, 전반적으로 시계 형태는 잘 유지되어 있고 시간이 뚜렷하게 읽혀요. 잡히는 흐트러짐 속에서도 노력과 세심함이 느껴집니다. 정말 수고하셨어요\"}"
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