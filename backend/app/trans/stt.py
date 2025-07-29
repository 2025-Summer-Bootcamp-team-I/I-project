from fastapi import APIRouter, UploadFile, File, HTTPException
import openai
import shutil
import os
import uuid
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    raise RuntimeError("OPENAI_API_KEY 환경변수가 설정되어 있지 않습니다.")

router = APIRouter()

async def transcribe_audio(file: UploadFile) -> str:
    """음성 파일을 텍스트로 변환하는 핵심 로직"""
    allowed_exts = (".webm", ".mp3", ".wav", ".m4a", ".mp4")
    if not file.filename or not file.filename.lower().endswith(allowed_exts):
        raise HTTPException(status_code=400, detail="지원하지 않는 오디오 형식입니다.")

    ext = os.path.splitext(file.filename)[-1].lower()
    temp_dir = "temp"
    os.makedirs(temp_dir, exist_ok=True)
    temp_filename = os.path.join(temp_dir, f"temp_{uuid.uuid4().hex}{ext}")

    try:
        # 파일 저장
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Whisper API 호출 (한국어 지정)
        with open(temp_filename, "rb") as audio_file:
            result = openai.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language="ko"
            )

        text = result.text
        if not text:
            raise HTTPException(status_code=500, detail="텍스트 변환 결과가 없습니다.")
        
        return text

    except openai.OpenAIError as oe:
        raise HTTPException(status_code=502, detail=f"OpenAI API 오류: {str(oe)}")
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

@router.post("/stt")
async def speech_to_text(file: UploadFile = File(...)):
    """FastAPI 엔드포인트: 음성을 텍스트로 변환"""
    try:
        text = await transcribe_audio(file)
        return {"text": text}
    except Exception as e:
        # transcribe_audio에서 발생한 HTTPException을 그대로 전달하거나, 새로운 예외 처리
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"오류 발생: {str(e)}")