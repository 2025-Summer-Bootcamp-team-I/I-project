import openai
from openai import OpenAI
import os
from dotenv import load_dotenv
import re
from . import utils, crud
from ..database import get_db
from sqlalchemy.orm import Session
from fastapi import Depends

# .env 파일 경로를 명시적으로 지정
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env')
load_dotenv(env_path)

# API 키가 없으면 에러 발생
if not os.getenv("OPENAI_API_KEY"):
    raise ValueError("OPENAI_API_KEY environment variable is not set")

# 분석 프롬프트 (11시 10분 시계 그림, 평가포맷 포함)
PROMPT = (
    "아래 이미지는 사용자가 그린 시계 그림입니다. "
    "이 시계는 11시 10분을 가리키도록 그려져야 하지만, "
    "완벽하게 그리지 않아도 괜찮으니 전반적으로 시계의 형태와 시계침의 방향이 맞는지, "
    "크게 벗어나지 않는 한 너무 엄격하게 감점하지 말고, "
    "어느 정도 비슷하게 그렸으면 관대하게 평가해서 점수를 후하게 주도록 하세요. "
    "특히 고령자 분들을 배려하는 따뜻한 관점으로 점수를 매기고, "
    "작은 실수(숫자 위치, 약간의 삐뚤어짐 등)는 치매 위험 점수에 큰 영향을 주지 않도록 해주세요. "
    "정말 중요한 실수(시계침이 완전히 틀리거나, 시계가 거의 인식 안 되는 경우)에만 점수를 많이 깎고, "
    "대부분의 그림은 위험 점수가 낮게(0~4 정도) 나오도록 평가해주세요. "
    "점수(0~10, 0이 매우 잘 그림, 10은 심각한 오류/거의 그림이 안 된 경우)와, "
    "한 문장 요약, 상세 설명 및 제안을 아래 형식에 맞춰 답해주세요.\n\n"
    "[치매 위험 점수]: <0~10 숫자>\n"
    "[결과 요약]: <한 문장 설명>\n"
    "[분석 및 제안]: <세부 평가 및 응원의 한 마디>"
)


def call_gpt_vision(image_path: str):
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    # 로컬 파일을 base64로 인코딩
    import base64
    # Docker 컨테이너 내부의 절대 경로 사용
    abs_path = os.path.join("/app", image_path.lstrip("/"))
    with open(abs_path, "rb") as image_file:
        image_data = base64.b64encode(image_file.read()).decode('utf-8')
    
    response = client.chat.completions.create(
        model="gpt-4o",  # deprecated된 preview 버전에서 정식 버전으로 변경
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
    
    # 점수 파싱
    score = 0
    summary = ""
    detail = ""
    
    # 치매 위험 점수 파싱
    m = re.search(r"\[치매 위험 점수\]:\s*(\d+)", content)
    if m:
        score = int(m.group(1))
    
    # 요약 파싱
    m2 = re.search(r"\[결과 요약\]:\s*(.*)", content)
    if m2:
        summary = m2.group(1)
    
    # 상세 분석 파싱
    m3 = re.search(r"\[분석 및 제안\]:\s*(.*)", content, re.DOTALL)
    if m3:
        detail = m3.group(1)
    
    return score, summary, detail, content

async def handle_upload(file, reportId: int, responses, db: Session = Depends(get_db)):
    # 로컬에 파일 저장
    image_path = await utils.save_file_locally(file)
    
    # GPT Vision으로 분석
    risk_score, summary, detail, full_message = call_gpt_vision(image_path)
    
    # 데이터베이스에 저장
    crud.create_drawing(
        db=db,
        report_id=reportId,
        image_url=image_path,
        risk_score=risk_score,
        summary=summary,
        detail=detail
    )
    
    return {
        "riskScore": risk_score,
        "summary": summary,
        "detail": detail,
        "full_message": full_message,
        "image_url": image_path
    }
