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
    "평가할 때 노인 사용자의 특성을 고려하여, 미세한 실수(예: 약간의 침 위치 어긋남, 숫자 배치가 조금 틀려도)에는 관대하게 평가하세요. "
    "정확한 시간을 대략적으로라도 표현했다면 높은 점수를 주고, "
    "침이나 숫자가 많이 생략되어 있어도 노인의 노력을 인정해 긍정적으로 평가하세요. "
    "항상  JSON 형식으로만 답변하세요.\n"
    '예시: {"risk_score": 2, "drawing_score": 90, "drawingtest_result": "노력이 잘 보이며 시계침이 대체로 정확합니다. 약간의 실수는 무시해도 좋습니다."}\n\n'
    "risk_score: 0~10 (치매 위험 점수, 높을수록 위험),\n"
    "drawing_score: 0~100 (관대한 평가, 어지간히 그렸으면 80점 이상도 OK),\n"
    "drawingtest_result: 그림에 대한 따뜻하고 긍정적인 평가와 피드백 (문장)\n"
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
    db.query(Report).filter(Report.report_id == report_id).update({
        Report.drawing_score: drawing_score,
        Report.drawingtest_result: drawingtest_result
    })
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
