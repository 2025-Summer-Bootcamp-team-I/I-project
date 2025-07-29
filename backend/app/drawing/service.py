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

env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env')
load_dotenv(env_path)

if not os.getenv("OPENAI_API_KEY"):
    raise ValueError("OPENAI_API_KEY environment variable is not set")

PROMPT = (
  "아래 이미지는 사용자가 그린 시계 그림입니다. 원은 이미 그려져 있고, 사용자께서 시침, 분침, 숫자(1~12)를 직접 그렸습니다. 시계가 반드시 '11시 10분'을 가리키도록 그려야 합니다.\n"
  "다음은 의료 연구와 임상에서 널리 사용하는 **Shulman 채점법(0~5점)**의 객관적 기준입니다. 그림이 아래 예시들과 일치할 경우, 반드시 해당 점수를 출력해야 합니다. 같은 이미지라면 항상 같은 점수가 나와야 하며, 평가 근거도 명확히 서술해야 합니다.\n"
  "———\n"
  "[📌 Shulman 채점법 요약]\n"
  "• 5점(정상): 숫자 1~12 모두 정확하게 배치됨, 시침이 11 방향, 분침이 2 방향(10분) 정확하며, 중심에서 출발. 그림이 아래 'Score 5' 예시와 유사할 경우, 반드시 5점으로 판정.\n"
  "• 4점(경미 결함): 숫자 하나 또는 둘만 살짝 틀렸지만 시간 해독 가능. 아래 'Score 4' 예시 수준일 경우, 반드시 4점.\n"
  "• 3점(중등도 결함): 숫자 누락 또는 손 하나가 다른 방향으로 틀렸으며, 아래 'Score 3' 예시 수준이라면 3점.\n"
  "• 2점(심각 결함): 숫자 2개 이상 누락되거나 손이 중심에서 벗어나거나 원 밖으로 나갔을 경우, 아래 'Score 2' 예시와 일치하면 2점.\n"
  "• 1점(극심 결함): 숫자가 대부분 누락되거나 순서가 뒤섞이고, 시계로 보기 어려운 수준—'Score 1' 예시 수준이면 1점.\n"
  "• 0점(실패): 시계인지 인식 불가능할 정도. 'Score 0' 예시와 같다면 0점.\n"
  "※ 인터넷 '예시 이미지'들을 참고하여, 해당 이미지가 어느 기준에 속하면 반드시 일관되게 같은 점수가 나오도록 하세요. (예: ResearchGate 등에서 Score 5로 분류된 시계 그림은 AI에서도 5점으로 판정되어야 합니다.)\n"
  "———\n"
  "[평가 절차]\n"
  "1. 입력 그림을 보고, 위 예시 이미지 중 가장 유사한 등급(5→0 순) 하나만 선택하세요.\n"
  "2. 이미 예시 그림 수준으로 명확히 일치하면, 타 등급으로 분류하지 마세요.\n"
  "3. 미세하게 구별하기 어려워도, 예시와 유사한 쪽으로 점수 고정하세요. 동일 그림에는 반드시 같은 점수로 대응됩니다.\n"
  "4. 경계 사례를 회피하기 위해, 명확히 예시와 다른 경우 더 낮은 등급으로 내려갑니다.\n"
  "———\n"
  "[출력 형식 (JSON)]\n"
  "{\"risk_score\":<0~5>, \"drawing_score\":<0~5>, "
  "\"drawingtest_result\":\"<최소 130자 – 반드시 포함: (1) 예시 등급(Score X)과 비교, (2) 숫자 배열·누락 정도, (3) 시침/분침 위치 및 방향, (4) 시간 읽기 가능 여부 및 종합 평가>\"}\n"
  "※ **risk_score**와 **drawing_score**는 동일한 점수를 사용하세요.\n"
  "※ **drawingtest_result**에는 반드시 다음 내용을 포함하세요:\n"
  "  1. '이 그림은 인터넷에서 Score X 예시와 비슷합니다'라는 비교 언급\n"
  "  2. 숫자의 배열, 누락, 위치 정확성에 대한 구체적 설명\n"
  "  3. 시침·분침의 방향(11·2 또는 다른 방향)과 중심 출발 여부\n"
  "  4. 전체적으로 시간 읽기가 가능한지 여부\n"
  "예시 출력:\n"
  "{\"risk_score\":5, \"drawing_score\":5, "
  "\"drawingtest_result\":\"이 그림은 인터넷에서 Score 5 예시와 매우 유사합니다. 숫자 1~12가 모두 원 둘레에 정확히 배치되어 있으며, 시침이 11시, 분침이 2(10분)를 분명히 가리키고 중심에서 출발합니다. 전체적으로 매우 깔끔하며, 시간 해독이 명확하고 혼동의 여지가 없습니다.\"}"
)



def call_gpt_vision(image_url: str):
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    # S3 URL에서 이미지 다운로드
    response = requests.get(image_url)
    response.raise_for_status()
    image_data = base64.b64encode(response.content).decode('utf-8')

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
        
        # GPT Vision 분석
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

     