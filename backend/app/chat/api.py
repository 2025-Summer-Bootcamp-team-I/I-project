#app/chat/api.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sse_starlette.sse import EventSourceResponse
import asyncio
import json
from celery.result import AsyncResult
from app.worker import stt_task, ai_chat_task, tts_task
from app.celery import celery_app
from celery import chain


from app.database import get_db
from app.auth.utils import get_current_user
from app.auth.models import User
from app.chat.schemas import (
    ChatRequest, ChatResponse, ChatLogResponse,
    CreateChatRequest, CreateChatResponse, EvaluateChatResponse
)
from app.chat.models import RoleEnum, Chat
from app.chat.service import (
    chat_with_ai, evaluate_and_save_chat_result,
    get_chat_logs_by_report_id, get_chat_logs
)
from app.chat.crud import save_chat_log
from app.chat.stream_handler import get_streaming_chain
from app.report.models import Report


router = APIRouter(tags=["Chat"])


def is_end_message(message: str) -> bool:
    end_keywords = ["끝", "그만", "종료", "마치자", "끝낼래", "대화 그만", "대화 종료"]
    return any(kw in message for kw in end_keywords)

def is_gpt_end_response(response: str) -> bool:
    end_phrases = ["오늘 대화는 여기까지 할게요. 좋은 하루 보내세요."]
    return any(phrase in response for phrase in end_phrases)

#
@router.post(
    "",
    summary="음성 채팅 시작 (STT -> AI -> TTS)",
    description="음성 파일을 받아 전체 비동기 처리 파이프라인을 시작하고, 작업 ID를 반환합니다."
)
async def chat(
        report_id: int = Form(...),
        chat_id: int = Form(...),
        file: UploadFile = File(...),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    audio_content = await file.read()
    
    # STT -> AI Chat -> TTS 순서로 실행되는 Celery 체인 생성
    pipeline = chain(
        stt_task.s(audio_content=audio_content, original_filename=file.filename),
        ai_chat_task.s(report_id=report_id, chat_id=chat_id),
        tts_task.s()
    )
    
    # 파이프라인 시작
    task = pipeline.delay()
    
    return {"task_id": task.id}


@router.get("/task-status/{task_id}", summary="작업 상태 및 결과 조회")
async def get_task_status(task_id: str):
    """Celery 작업의 상태와 최종 결과(TTS 오디오)를 반환합니다."""
    task_result = AsyncResult(task_id, app=celery_app)
    
    if task_result.failed():
        response = {
            "task_id": task_id,
            "status": "FAILURE",
            "error": str(task_result.result)
        }
    elif task_result.ready():
        response = {
            "task_id": task_id,
            "status": "SUCCESS",
            "result": task_result.result  # worker에서 반환한 딕셔너리
        }
    else:
        response = {
            "task_id": task_id,
            "status": task_result.status
        }
    return response


@router.post("/stream")
async def stream_chat(
        request: ChatRequest,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    async def event_generator():
        import json
        response_text = ""
        chain, memory, handler = get_streaming_chain(request.report_id)
        task = asyncio.create_task(chain.acall(request.message))

        async for token in handler.aiter():

            response_text += token

            clean_token = token

            # JSON 포맷 감싸기
            json_data = json.dumps({"token": clean_token})

            yield json_data

        yield "[DONE]"

        save_chat_log(db, request.chat_id, RoleEnum.user, request.message)
        save_chat_log(db, request.chat_id, RoleEnum.ai, response_text)

    return EventSourceResponse(event_generator())


@router.post(
    "/create",
    response_model=CreateChatResponse,
    summary="채팅방 생성 및 AI 인사",
    description="지정한 report_id에 대해 새 채팅방을 생성하고, AI의 첫 인사말을 반환합니다."
)
def create_chat(
        request: CreateChatRequest,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    if not request.report_id:
        raise HTTPException(status_code=400, detail="report_id는 필수입니다.")

    report = db.query(Report).filter(Report.report_id == request.report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="해당 report_id가 존재하지 않습니다.")

    # 1. 채팅방 생성
    chat = Chat(report_id=report.report_id)
    db.add(chat)
    db.commit()
    db.refresh(chat)

    # 2. AI의 첫 인사말 생성 및 저장
    initial_greeting = "안녕하세요. 지금부터 대화를 시작하겠습니다. 보다 정확한 검사를 위해, 단답형보다는 완전한 문장으로 답변해주시면 감사하겠습니다."
    save_chat_log(db, chat_id=chat.chat_id, role=RoleEnum.ai, text=initial_greeting)
    
    # 3. 생성된 chat_id와 인사말 반환
    return CreateChatResponse(
        chat_id=chat.chat_id,
        message=initial_greeting
    )


@router.get("/logs/{report_id}", response_model=list[ChatLogResponse])
def get_logs_by_report_id(report_id: int, db: Session = Depends(get_db)):
    return get_chat_logs_by_report_id(db, report_id)

@router.get(
    "/logs/{chat_id}",
    response_model=list[ChatLogResponse],
    summary="채팅 로그 조회",
    description="특정 chat_id에 대한 모든 채팅 로그를 반환합니다."
)
def read_chat_logs(
        chat_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    return get_chat_logs(db, chat_id)

@router.post(
    "/chats/{chat_id}/evaluate",
    response_model=EvaluateChatResponse,
    summary="채팅 평가 및 결과 저장",
    description="chat_id와 report_id를 기반으로 AI 분석 결과(소견, 위험도)를 평가하고 저장합니다."
)
def evaluate_chat_and_save(
        chat_id: int,
        report_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    try:
        chat_result, chat_risk = evaluate_and_save_chat_result(db, chat_id, report_id)
        return EvaluateChatResponse(
            chat_result=chat_result,
            chat_risk=chat_risk,
            message="소견 및 위험도가 저장되었습니다."
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
