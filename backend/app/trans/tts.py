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
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# ⭐ 여기! 상수를 모듈 레벨로 옮겼어!
MAX_TEXT_LENGTH = 2500 # ElevenLabs API의 무료 티어 최대 2500자 (유료 티어는 더 김)
MIN_TEXT_LENGTH = 1

VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "YBRudLRm83BV5Mazcr42")

# ⭐ ⭐ 추가된 부분!
# 파일 상단에 환경 변수 키와 기본 모델 정의
ELEVENLABS_MODEL_ID_KEY = "ELEVENLABS_MODEL_ID"
DEFAULT_TTS_MODEL = "eleven_flash_v2_5"

class TTSRequest(BaseModel):
    text: str

    @field_validator("text")
    @classmethod
    def text_must_be_within_length_limits(cls, v):
        if not (MIN_TEXT_LENGTH <= len(v) <= MAX_TEXT_LENGTH):
            raise ValueError(f"텍스트 길이는 {MIN_TEXT_LENGTH}자에서 {MAX_TEXT_LENGTH}자 사이여야 합니다.")
        return v

async def synthesize_speech(text: str) -> bytes:
    """텍스트를 음성으로 변환하는 핵심 로직"""
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        logger.error(".env 파일에 ELEVENLABS_API_KEY가 설정되지 않았습니다.")
        raise HTTPException(status_code=500, detail="서버 설정 오류: ElevenLabs API 키가 없습니다.")
    
    logger.info(f"TTS 요청 수신: 텍스트 길이 {len(text)}, VOICE_ID: {VOICE_ID}")

    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json"
    }

    payload = {
        "text": text,
        "model_id": os.getenv(ELEVENLABS_MODEL_ID_KEY, DEFAULT_TTS_MODEL), 
        "voice_settings": {
            "stability": 0.7,
            "similarity_boost": 0.7,
            "style": 0.3,
            "use_speaker_boost": True,
            "speed": 0.88
        }
    }

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(url, headers=headers, json=payload)
            res.raise_for_status()
        
        return res.content

    except httpx.HTTPStatusError as e:
        status_code = e.response.status_code
        error_message = "알 수 없는 ElevenLabs API 오류"
        try:
            error_data = json.loads(e.response.text)
            error_message = error_data.get("detail", e.response.text)
        except json.JSONDecodeError:
            error_message = e.response.text
        logger.error(f"🚫 ElevenLabs API 응답 오류 ({status_code}): {error_message}")
        raise HTTPException(status_code=502, detail=f"ElevenLabs API 오류: {error_message}")

    except httpx.RequestError as e:
        logger.error(f"🌐 ElevenLabs TTS 서버 연결 실패: {e}")
        raise HTTPException(status_code=504, detail=f"TTS 서버 연결 실패: {str(e)}")

@router.post("/tts")
async def generate_tts(data: TTSRequest):
    """FastAPI 엔드포인트: 텍스트를 음성으로 변환"""
    try:
        audio_content = await synthesize_speech(data.text)
        logger.info("ElevenLabs TTS API 호출 성공")
        logger.info(f"🎧 응답 오디오 크기: {len(audio_content)} bytes")

        return Response(
            content=audio_content,
            media_type="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=output.mp3"}
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.critical(f"🔥 예상치 못한 서버 오류 발생: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"예상치 못한 서버 오류가 발생했습니다: {e}")