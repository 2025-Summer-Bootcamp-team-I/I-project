from fastapi import FastAPI
import os
from dotenv import load_dotenv
from prometheus_fastapi_instrumentator import Instrumentator
import tempfile
import asyncio
import base64
from fastapi import UploadFile
from io import BytesIO

from app.celery import celery_app
from app.database import session_scope
from app.chat.service import chat_with_ai
from app.trans.stt import transcribe_audio
from app.trans.tts import synthesize_speech

load_dotenv()

app = FastAPI()

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

Instrumentator().instrument(app).expose(app)

@celery_app.task(name="stt_task", bind=True)
def stt_task(self, audio_content: bytes, original_filename: str):
    """STT를 수행하고 텍스트를 반환합니다."""
    # Celery 태스크는 비동기 컨텍스트에서 직접 UploadFile을 다룰 수 없으므로,
    # 파일 내용을 바이트로 받아 처리하는 것이 더 안정적입니다.
    file_like_object = BytesIO(audio_content)
    fake_upload_file = UploadFile(filename=original_filename, file=file_like_object)
    
    try:
        text = asyncio.run(transcribe_audio(fake_upload_file))
        print(f"STT Result: {text}")
        return text
    except Exception as e:
        self.update_state(state='FAILURE', meta={'exc_type': type(e).__name__, 'exc_message': str(e)})
        raise e

@celery_app.task(name="ai_chat_task", bind=True)
def ai_chat_task(self, text: str, report_id: int, chat_id: int):
    """AI 채팅을 수행하고 응답 텍스트를 반환합니다."""
    try:
        with session_scope() as db:
            ai_response = chat_with_ai(
                report_id=report_id,
                chat_id=chat_id,
                message=text,
                db=db
            )
        print(f"AI Response: {ai_response}")
        return ai_response
    except Exception as e:
        self.update_state(state='FAILURE', meta={'exc_type': type(e).__name__, 'exc_message': str(e)})
        raise e

@celery_app.task(name="tts_task", bind=True)
def tts_task(self, text: str):
    """TTS를 수행하고 최종 오디오 데이터를 반환합니다."""
    try:
        audio_content = asyncio.run(synthesize_speech(text))
        print(f"TTS Result: Audio content generated ({len(audio_content)} bytes)")
        return {
            "status": "SUCCESS",
            "ai_response_text": text,
            "audio_content_base64": base64.b64encode(audio_content).decode('utf-8')
        }
    except Exception as e:
        self.update_state(state='FAILURE', meta={'exc_type': type(e).__name__, 'exc_message': str(e)})
        raise e 