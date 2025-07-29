#app/chat/api.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sse_starlette.sse import EventSourceResponse
import asyncio
import json
from celery.result import AsyncResult

from app.database import get_db
from app.auth.utils import get_current_user
from app.auth.models import User
from app.chat.schemas import (
    ChatRequest, ChatResponse, ChatLogResponse,
    CreateChatRequest, CreateChatResponse, EvaluateChatResponse, VoiceChatResponse
)
from app.chat.models import RoleEnum, Chat
from app.chat.service import (
    chat_with_ai, evaluate_and_save_chat_result,
    get_chat_logs_by_report_id, get_chat_logs
)
from app.chat.crud import save_chat_log
from app.chat.stream_handler import get_streaming_chain
from app.report.models import Report
from app.celery import celery_app


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
    response_model=ChatResponse,
    summary="채팅 메시지 전송",
    description="채팅 메시지를 전송하고 AI 응답을 반환합니다."
)
def chat(
        request: ChatRequest,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    response = chat_with_ai(
        report_id=request.report_id,
        chat_id=request.chat_id,
        message=request.message,
        db=db
    )
    return {"response": response}

@router.post("/stream")
async def stream_chat(
        request: ChatRequest,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    import logging
    print(f"🔥 STREAM API CALLED! Chat ID: {request.chat_id}, Message: {request.message}")
    logging.info(f"🔥 STREAM API CALLED! Chat ID: {request.chat_id}, Message: {request.message}")
    async def event_generator():
        import json
        import logging

        response_text = ""
        try:
            # 1. get_streaming_chain 호출을 수정하고, 반환 값의 개수에 따라 분기 처리합니다.
            result = get_streaming_chain(request.report_id, request.message)
            is_farewell = False
            if len(result) == 2:
                chain, memory = result
                is_farewell = True
            else:
                chain, memory, _ = result  # turn_count는 여기서 사용하지 않습니다.

            # 2. astream을 사용하여 스트리밍을 처리합니다.
            stream_input = {}
            if not is_farewell:
                stream_input = {"question": request.message}

            logging.info(f"SSE stream started for chat_id: {request.chat_id}")
            chunk_count = 0
            async for chunk in chain.astream(stream_input):
                chunk_count += 1
                token = ""
                # LangChain 체인의 종류에 따라 반환되는 chunk의 타입이 다릅니다.
                if isinstance(chunk, dict) and "answer" in chunk:
                    token = chunk["answer"]  # ConversationalRetrievalChain의 경우
                elif hasattr(chunk, 'content'):
                    token = chunk.content  # LCEL 체인 (farewell)의 경우
                
                if token:
                    # 토큰을 더 작은 단위로 분할하여 스트리밍 효과 강화
                    if len(token) > 10:  # 긴 토큰을 더 작게 분할
                        words = token.split()
                        for i, word in enumerate(words):
                            if i > 0:
                                word = " " + word
                            logging.info(f"Streaming chunk #{chunk_count}.{i+1}: '{word}'")
                            response_text += word
                            json_data = json.dumps({"token": word})
                            yield json_data
                    else:
                        logging.info(f"Streaming chunk #{chunk_count}: '{token.strip()}' (length: {len(token)})")
                        response_text += token
                        json_data = json.dumps({"token": token})
                        yield json_data
                else:
                    logging.warning(f"Empty token in chunk #{chunk_count}: {chunk}")
            
            logging.info(f"SSE stream finished for chat_id: {request.chat_id} - Total chunks: {chunk_count}, Final response length: {len(response_text)}")
            
            logging.info(f"SSE stream finished for chat_id: {request.chat_id}")
            # 스트리밍 성공 시 로그 저장
            save_chat_log(db, request.chat_id, RoleEnum.user, request.message)
            if response_text:
                save_chat_log(db, request.chat_id, RoleEnum.ai, response_text)

        except Exception:
            logging.exception("Error during streaming chat")
            error_data = json.dumps({"error": "스트리밍 중 오류가 발생했습니다."})
            # [수정] 오류 발생 시 'error' 이벤트를 전송합니다.
            yield {"event": "error", "data": error_data}

        finally:
            # [수정] 스트림 종료를 위해 'end' 이벤트를 전송합니다.
            yield {"event": "end", "data": "[DONE]"}

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

@router.post(
    "/voice",
    response_model=VoiceChatResponse,
    summary="음성 채팅 시작 (STT -> AI -> TTS)",
    description="음성 파일을 받아 전체 비동기 처리 파이프라인을 시작하고, 최종 작업 ID를 반환합니다."
)
async def voice_chat(
        report_id: int = Form(...),
        chat_id: int = Form(...),
        file: UploadFile = File(...),
        current_user: User = Depends(get_current_user)
):
    try:
        audio_content = await file.read()

        # Celery 작업 체인 생성: STT -> AI Chat -> TTS
        # 각 작업의 결과가 다음 작업의 입력으로 전달됩니다.
        chain = (
            celery_app.signature("stt_task", args=[audio_content, file.filename]) |
            celery_app.signature("ai_chat_task", args=[report_id, chat_id]) |
            celery_app.signature("tts_task")
        )

        # 비동기적으로 체인 실행
        task_result = chain.apply_async()

        # 체인의 마지막 작업(TTS)의 ID를 반환
        return VoiceChatResponse(task_id=task_result.id)

    except Exception as e:
        # 파일 처리나 작업 생성 중 오류 발생 시
        raise HTTPException(status_code=500, detail=f"음성 처리 중 오류 발생: {str(e)}")

@router.get("/task-status/{task_id}")
async def get_task_status(task_id: str):
    """(음성채팅) 작업 상태 조회"""
    task_result = AsyncResult(task_id, app=celery_app)

    response = {
        "task_id": task_id,
        "status": task_result.status,
        "result": task_result.result if task_result.successful() else None,
    }

    if task_result.failed():
        response["result"] = {
            "error": str(task_result.info),
            "traceback": task_result.traceback,
        }

    return response
