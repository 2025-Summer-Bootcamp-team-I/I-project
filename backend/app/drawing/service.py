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
  "이미 원이 그려져 있고, 사용자는 원 안에 시침, 분침, 숫자(1~12)를 직접 그렸습니다. "
  "시계가 반드시 '11시 10분'을 가리키게 그려야 합니다. "
  "다음은 의료 현장과 연구에서 사용하는 표준화된 Shulman(슐만) 시계그림 채점법(0~5점)의 상세 기준입니다. "
  "이 기준을 따라 일관성 있게 평가하고, 동일한 그림에는 반드시 동일한 점수가 나오게 해주세요.\n"
  "———\n"
  "[Shulman 채점법 개요]\n"
  "Shulman 채점법은 인지기능 저하 및 실행기능 장애를 평가하기 위해 고안된 표준 시계그리기 검사법입니다. "
  "숫자 배치의 정확성, 시침과 분침의 방향 및 비율, 전체 시계의 구조와 시간 판독 가능성을 종합적으로 평가합니다.\n"
  "———\n"
  "[점수별 구체적 조건]\n"
  "5점: 숫자 1~12가 모두 한 개씩, 시계 방향 정순서로 원 둘레에 균등하게 배열됨. 모든 숫자는 바로 서 있고, 중첩·누락 없음. 시침(짧음)은 11~12 사이, 분침(김)은 2를 분명히 가리키며, 두 손 모두 중심에서 시작. 불필요한 표시, 낙서 없음. 시간 해독에 오해 소지 없음.\n"
  "4점: 1~12 모두 있으나 1~2개 위치가 약간 어긋남. 숫자 간격이 조금 불균등하나 전체 구조는 유지. 시침과 분침이 11:10을 가리키지만 한 손이 ±1칸 이내로 벗어남. 두 손 길이 차이·출발점은 명확. 가독성 양호.\n"
  "3점: 숫자 최대 1~2개 누락 또는 3~4개 위치 오류. 숫자 일부가 비정상 간격으로 밀집/분산. 시침 또는 분침이 잘못된 방향에 있거나(예: 12시 또는 1시 방향 등), 길이 차이·중심 출발 미흡으로 시간 해독이 명확하지 않음. 전체적으로 시계 구조는 식별 가능.\n"
  "2점: 숫자 3개 이상 누락 또는 5개 이상 위치 오류. 숫자 순서가 뒤섞이거나 일부 구간에 겹침/반복/공백. 시침·분침 모두 부정확한 방향에 있거나, 한 손이 현저히 짧거나 원 밖까지 나가며, 중심에서 시작하지 않음. 시계 구조 혼란, 시간 해독 매우 어려움.\n"
  "1점: 숫자 대부분(6개 이상) 누락·무질서. 같은 숫자 반복, 반시계 방향, 읽기 어려움. 시침·분침 한 개만 있거나, 둘 다 지나치게 짧거나, 겹쳐 구분 불가. 시계 형태만 겨우 남아있고, 시간 해독 불가.\n"
  "0점: 원, 숫자, 손 모두 거의 없음 또는 시계와 무관한 낙서. 시계로 전혀 인식 불가.\n"
  "———\n"
  "[평가 절차]\n"
  "1. 5점 조건부터 순차적으로, 가장 먼저 완벽히 만족하는 점수에서 즉시 멈춥니다.\n"
  "2. 조건 일부라도 미흡하면 바로 그 다음 점수 기준을 적용합니다.\n"
  "3. 애매한 경우(경계선)는 항상 더 낮은 점수를 선택합니다.\n"
  "4. 가장 심각한 오류가 전체 점수에 우선합니다.\n"
  "5. 동일 그림에는 항상 동일 점수가 나오도록 객관적 기준만 사용합니다.\n"
  "———\n"
  "[출력 포맷(JSON)]\n"
  "{\"risk_score\":<0~5>, \"drawing_score\":<0~5>, "
  "\"drawingtest_result\":\"<130자 이상, 반드시 아래 3가지를 모두 포함>\"}\n"
  "1. 숫자의 배열, 누락, 순서, 밀집·분산, 뒤집힘 등 세부적 설명\n"
  "2. 시침과 분침 각각의 방향(11시·2시)·길이(시침이 더 짧음)·중심 출발 여부, 잘못된 점\n"
  "3. 전체적으로 시간 해독이 가능한지 여부와 시계 구조 평가\n"
  "———\n"
  "예시: "
  "{\"risk_score\":4, \"drawing_score\":4, "
  "\"drawingtest_result\":\"모든 숫자가 빠짐없이 있으나 10, 11의 위치가 약간 어긋나 있고 일부 숫자 간격이 좁거나 벌어져 있습니다. 시침과 분침 모두 중심에서 시작해 각각 11과 2를 가리키고 있으나 시침이 11과 12 중간이 아닌 11에 조금 더 가깝게 위치합니다. 전체적으로 시계 구조와 시간 판독은 명확하나 경미한 숫자 배열 오류가 관찰됩니다.\"}"
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