import os
import base64
import json
import requests
from dotenv import load_dotenv
from openai import OpenAI
from . import crud, utils
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException
import re
from ..report.models import Report, RiskLevel
from urllib.parse import urlparse


env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env')
load_dotenv(env_path)

if not os.getenv("OPENAI_API_KEY"):
    raise ValueError("OPENAI_API_KEY environment variable is not set")

PROMPT = (
    "아래 이미지는 사용자가 그린 시계 그림입니다. 원은 이미 그려져 있고, 사용자께서 시침, 분침, 숫자(1~12)를 직접 그렸습니다. 시계가 반드시 '11시 10분'을 가리키도록 그려야 합니다.\n"
    "당신은 시계 그리기 인지 평가(Clock Drawing Test) 전문가입니다.\n\n"
    "지금부터 첨부된 예시 이미지들은 Shulman 채점법(0~5점)의 점수별 기준에 따라 만들어졌습니다.\n"
    "- 각 점수(0~5점)에 해당하는 예시 이미지가 제공됩니다. 동일 점수에 대한 여러 예시도 포함되어 있습니다.\n\n"
    "사용자 그림을 아래 예시들과 정확히 비교하고, 가장 일치하는 점수 하나(0~5점)를 선택하세요.\n"
    "점수를 선택할 때는 반드시 아래의 [점수별 기준 요약]과 예시 이미지를 함께 고려하세요.\n"
    "절대적인 기준은 점수별 기준 요약이며, 점수는 오직 하나만 선택 가능합니다.\n"
    "불확실한 경우, 가장 유사한 점수가 아닌 가장 적절한 점수 하나만 선택하세요.\n"
    "점수를 착오 없이 판단하는 것이 가장 중요합니다.\n\n"
    "[점수별 기준 요약]\n"
    "5점: 숫자 1~12 모두 정확, 시침(11시)·분침(10분)도 정확, 중심 출발\n"
    "4점: 숫자 1~2개 오류, 시침/분침 살짝 어긋나지만 시간 해독 가능\n"
    "3점: 숫자 2~3개 누락 또는 오류, 시계는 인식 가능하지만 해석 어려움\n"
    "2점: 숫자 배열이 무질서, 바늘이 원 밖이거나 중심이 아님, 숫자 4개 이상 누락\n"
    "1점: 숫자가 3개 이하이거나 순서 무너짐, 시계 형태 붕괴\n"
    "0점: 시계로 인식 불가. 숫자·바늘이 거의 없고 시계 구조를 갖추지 않음\n\n"
    "[출력 형식 - 반드시 아래 JSON 형식 그대로 출력하세요]\n"
    "다음 형식에 맞추어 JSON만 출력하세요:\n"
    "{\n"
    "  \"drawing_score\": <0~5>,\n"
    "  \"drawingtest_result\": \"<선택한 점수의 판단 이유를 1~2문장으로 작성>\"\n"
    "}\n"
    "설명이 너무 길어지지 않도록 주의하세요. 반드시 위 JSON 형식만 출력하세요.\n"
)


def call_gpt_vision(image_url: str):
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    example_image_info = [
        ("5점", "static/uploads/drawings/시계5점-1.PNG"),
        ("4점", "static/uploads/drawings/시계4점-1.PNG"),
        ("3점", "static/uploads/drawings/시계3점-1.PNG"),
        ("2점", "static/uploads/drawings/시계2점-1.PNG"),
        ("2점", "static/uploads/drawings/시계2점-3.PNG"),
        ("1점", "static/uploads/drawings/시계1점-1.PNG"),
        ("1점", "static/uploads/drawings/시계1점-2.PNG"),
        ("1점", "static/uploads/drawings/시계1점-3.PNG"),
        ("0점", "static/uploads/drawings/시계0점-1.PNG"),
    ]
    
    def img_to_base64(path):
        with open(path, "rb") as f:
            return base64.b64encode(f.read()).decode('utf-8')
    
    # S3 URL에서 이미지 다운로드
    response = requests.get(image_url)
    response.raise_for_status()
    image_data = base64.b64encode(response.content).decode('utf-8')
    
    content_list = [
        {"type": "text", "text": PROMPT}
    ]
    for score_text, img_path in example_image_info:
        content_list.append({"type": "text", "text": f"아래 이미지는 {score_text} 예시입니다."})
        content_list.append({"type": "image_url", "image_url": {"url": f"data:image/png;base64,{img_to_base64(img_path)}"}})
        
    content_list.append({"type": "text", "text": "아래 이미지는 사용자가 그린 그림입니다."})
    content_list.append({"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_data}"}})

    messages = [
        {
            "role": "user",
            "content": content_list
        }
    ]

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
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

def get_drawing_risk_level(drawing_score: int) -> RiskLevel:
    """
    그림 분석 점수에 따른 위험도 평가
    
    Args:
        drawing_score: 그림 분석 점수 (0-5)
        
    Returns:
        RiskLevel: 위험도 enum 객체
    """
    if drawing_score >= 4:  # 5~4: 양호
        return RiskLevel.GOOD
    elif drawing_score == 3:  # 3: 경계
        return RiskLevel.CAUTION
    else:  # 0~2: 위험
        return RiskLevel.DANGER

async def handle_upload(
    file,                  # UploadFile
    report_id: int,        # Form 데이터(reportId)
    db: Session = Depends()
):
    """
    file: 업로드된 이미지 파일
    report_id: 연결할 리포트 ID
    db: DB 세션
    """
    import logging
    logger = logging.getLogger(__name__)
    
    # 리포트 존재 여부 확인
    db_report = db.query(Report).filter(Report.report_id == report_id).first()
    if not db_report:
        raise HTTPException(status_code=404, detail="Report not found")

    try:
        logger.info(f"드로잉 업로드 시작 - report_id: {report_id}")
        
        # S3에 파일 업로드
        logger.info("S3 업로드 시작")
        image_url = await utils.save_file_to_s3(file)
        logger.info(f"S3 업로드 완료 - URL: {image_url}")

        # presigned URL 생성
        parsed = urlparse(image_url)
        s3_key = parsed.path.lstrip("/")  # 'drawings/abc.png'
        presigned_url = utils.generate_presigned_url(s3_key)

        # GPT Vision 분석 (원래 S3 URL로 전송)
        logger.info("GPT Vision 분석 시작")
        risk_score, drawing_score, drawingtest_result = call_gpt_vision(image_url)
        logger.info(f"GPT Vision 분석 완료 - 점수: {drawing_score}")
        
        risk_level = get_drawing_risk_level(drawing_score)

        # drawing_test 테이블에는 이미지 URL과 risk_score만 저장
        logger.info("DB에 drawing_test 저장 시작")
        db_obj = crud.create_drawing_test(
            db=db,
            report_id=report_id,
            image_url=image_url,
            risk_score=risk_score,
        )
        logger.info("DB에 drawing_test 저장 완료")

        # Report 테이블 업데이트 - ORM 사용으로 변경
        logger.info("Report 테이블 업데이트 시작")
        report = db.query(Report).filter(Report.report_id == report_id).first()
        if report:
            report.drawing_score = drawing_score
            report.drawingtest_result = drawingtest_result
            report.drawing_risk = risk_level
            db.commit()
            logger.info("Report 테이블 업데이트 완료")

        # API 응답은 기존과 동일하게 모든 정보를 포함
        return {
            "drawing_id": db_obj.drawing_id,
            "report_id": db_obj.report_id,
            "image_url": db_obj.image_url,
            "presigned_url": presigned_url,
            "risk_score": risk_score,
            "drawing_score": drawing_score,
            "drawingtest_result": drawingtest_result,
            "risk_level": risk_level
        }
    except Exception as e:
        logger.error(f"드로잉 업로드 중 에러 발생: {str(e)}", exc_info=True)

                # 에러 발생 시 S3에 업로드된 파일 삭제 시도
        if 'image_url' in locals():
            try:
                await utils.delete_file_from_s3(image_url)
                logger.info("S3 파일 삭제 완료")
            except Exception as delete_error:
                logger.error(f"S3 파일 삭제 실패: {str(delete_error)}")
        raise HTTPException(status_code=500, detail="파일 업로드 중 오류가 발생했습니다.")