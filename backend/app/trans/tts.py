import requests
import os
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
from dotenv import load_dotenv

router = APIRouter()

load_dotenv()
VOICE_ID = "YBRudLRm83BV5Mazcr42"  # 실제 Voice ID로 교체

class TTSRequest(BaseModel):
    text: str

@router.post("/tts")
def generate_tts(data: TTSRequest):
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail=".env 파일에 ELEVENLABS_API_KEY가 없습니다.")
    
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json"
    }

    payload = {
        "text": data.text,
        "model_id": "eleven_multilingual_v2",  # 실제 사용 모델
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
        res = requests.post(url, headers=headers, json=payload)
        res.raise_for_status()
    except requests.RequestException as e:
        # 에러 응답이 오디오가 아닐 때만 에러 메시지 반환
        error_detail = getattr(e.response, "text", str(e)) if hasattr(e, "response") and e.response is not None else str(e)
        raise HTTPException(status_code=500, detail=f"TTS 생성 실패: {error_detail}")

    return Response(
        content=res.content,
        media_type="audio/mpeg",
        headers={"Content-Disposition": "inline; filename=output.mp3"}
    )