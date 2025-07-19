import os
import logging
import json
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel, field_validator
from dotenv import load_dotenv
import httpx

router = APIRouter()

load_dotenv()

# 로거 설정
logger = logging.getLogger(__name__)
# 로깅 레벨 및 형식 설정 (운영 환경에 맞게 조절 가능)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# 환경 변수에서 VOICE_ID를 가져오거나 기본값 설정
# .env 파일에 ELEVENLABS_VOICE_ID=YOUR_VOICE_ID_HERE 와 같이 설정해주세요.
VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "YBRudLRm83BV5Mazcr42") # 실제 사용하려는 Voice ID로 교체

# TTS 요청 데이터 모델 정의
class TTSRequest(BaseModel):
    text: str

    # 텍스트 길이 유효성 검사 (ElevenLabs API 제한에 따라)
    # Pydantic v2에서는 @field_validator 사용 및 @classmethod 추가
    @field_validator("text")
    @classmethod # field_validator 사용 시 @classmethod를 함께 사용해야 합니다.
    def text_must_be_within_length_limits(cls, v):
        MAX_TEXT_LENGTH = 2500 # ElevenLabs API의 무료 티어 최대 2500자 (유료 티어는 더 김)
        MIN_TEXT_LENGTH = 1
        if not (MIN_TEXT_LENGTH <= len(v) <= MAX_TEXT_LENGTH):
            raise ValueError(f"텍스트 길이는 {MIN_TEXT_LENGTH}자에서 {MAX_TEXT_LENGTH}자 사이여야 합니다.")
        return v

@router.post("/tts")
async def generate_tts(data: TTSRequest):
    # 환경 변수에서 ElevenLabs API 키 가져오기
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        logger.error(".env 파일에 ELEVENLABS_API_KEY가 설정되지 않았습니다.")
        raise HTTPException(status_code=500, detail="서버 설정 오류: ElevenLabs API 키가 없습니다.")
    
    logger.info(f"TTS 요청 수신: 텍스트 길이 {len(data.text)}, VOICE_ID: {VOICE_ID}")

    # API 요청 헤더 설정
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json"
    }

    # API 요청 페이로드 (본문) 설정
    payload = {
        "text": data.text,
        "model_id": "eleven_multilingual_v2",  # 사용하려는 ElevenLabs 모델 ID
        "voice_settings": {
            "stability": 0.7,
            "similarity_boost": 0.7,
            "style": 0.3,
            "use_speaker_boost": True,
            "speed": 0.88
        }
    }

    # ElevenLabs API 엔드포인트 URL
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"
    
    try:
        # httpx.AsyncClient를 사용하여 비동기 요청
        # timeout 설정으로 요청이 너무 오래 걸리는 것을 방지
        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(url, headers=headers, json=payload)
            res.raise_for_status() # 200 이외의 HTTP 상태 코드에 대해 예외 발생
        
        logger.info("ElevenLabs TTS API 호출 성공")
    
    except httpx.HTTPStatusError as e:
        # ElevenLabs API가 오류 응답 (4xx, 5xx 등)을 보낸 경우
        status_code = e.response.status_code
        error_message = "알 수 없는 ElevenLabs API 오류"
        try:
            # ElevenLabs API는 에러를 JSON 형태로 반환할 수 있음
            error_data = json.loads(e.response.text)
            error_message = error_data.get("detail", e.response.text)
        except json.JSONDecodeError:
            error_message = e.response.text # JSON이 아니면 원본 텍스트 사용

        logger.error(f"ElevenLabs API 응답 오류 ({status_code}): {error_message}")
        # 외부 API의 응답 오류를 나타내는 502 Bad Gateway 사용
        raise HTTPException(status_code=502, detail=f"ElevenLabs API 오류: {error_message}")
    
    except httpx.RequestError as e:
        # 네트워크 문제, 타임아웃, DNS 오류 등 요청 자체에 실패한 경우
        logger.error(f"ElevenLabs TTS 서버 연결 실패: {e}")
        # 외부 서버와의 연결/타임아웃 문제를 나타내는 504 Gateway Timeout 사용
        raise HTTPException(status_code=504, detail=f"TTS 서버 연결 실패: {str(e)}")
    
    except Exception as e:
        # 예상치 못한 기타 오류 처리 (최후의 보루)
        logger.critical(f"예상치 못한 서버 오류 발생: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"예상치 못한 서버 오류가 발생했습니다: {e}")

    # 성공 시, 생성된 음성 콘텐츠를 오디오 파일로 반환
    return Response(
        content=res.content,
        media_type="audio/mpeg", # MP3 오디오 파일임을 명시
        headers={"Content-Disposition": "inline; filename=output.mp3"} # 파일 다운로드 이름 설정
    )