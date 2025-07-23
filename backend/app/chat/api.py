#app/chat/api.py
from fastapi import APIRouter, Depends, HTTPException
from fastapi import UploadFile, File, Form
from sqlalchemy.orm import Session
from sse_starlette.sse import EventSourceResponse
import asyncio
import json

from app.chat.stream_state import is_streaming, mark_stream_start, mark_stream_end
from sse_starlette.sse import EventSourceResponse
from app.database import get_db
from app.auth.utils import get_current_user
from app.auth.models import User
from app.chat.schemas import ChatRequest, ChatResponse, ChatLogResponse, CreateChatRequest, CreateChatResponse, EvaluateChatResponse
from app.chat.models import RoleEnum, Chat
from app.chat.service import chat_with_ai, evaluate_and_save_chat_result
from app.chat.crud import save_chat_log
from app.chat.stream_handler import get_streaming_chain
from app.chat.service import get_chat_logs
from app.report.models import Report


router = APIRouter(tags=["Chat"])


def is_end_message(message: str) -> bool:
    end_keywords = ["끝", "그만", "종료", "마치자", "끝낼래", "대화 그만", "대화 종료"]
    return any(kw in message for kw in end_keywords)

def is_gpt_end_response(response: str) -> bool:
    end_phrases = ["오늘 대화는 여기까지 할게요. 좋은 하루 보내세요."]
    return any(phrase in response for phrase in end_phrases)

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


from app.chat.stream_state import is_streaming, mark_stream_start, mark_stream_end
import logging

logger = logging.getLogger(__name__)

@router.post("/stream")
async def stream_chat(
        request: ChatRequest,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    logger.info(f"[STREAM START] chat_id={request.chat_id}, user_id={current_user.user_id}")

    if is_streaming(request.chat_id):
        logger.warning(f"[STREAM DUPLICATE BLOCKED] chat_id={request.chat_id}")
        raise HTTPException(status_code=409, detail="해당 채팅방은 이미 스트리밍 중입니다.")

    mark_stream_start(request.chat_id)

    async def event_generator():
        response_text = ""
        chain, memory, handler = get_streaming_chain(request.report_id)
        task = asyncio.create_task(chain.acall(request.message))

        try:
            async for token in handler.aiter():
                logger.debug(f"[TOKEN] {repr(token)}")

                clean_token = token.strip()
                while clean_token.startswith("data:"):
                    clean_token = clean_token[len("data:"):].strip()
                json_data = json.dumps({"token": clean_token})

                yield json_data

            logger.info(f"[STREAM DONE] chat_id={request.chat_id}")
            yield "[DONE]"

        except Exception as e:
            logger.exception(f"[STREAM ERROR] chat_id={request.chat_id}, error={str(e)}")
            raise e

        finally:
            mark_stream_end(request.chat_id)
            logger.info(f"[STREAM END] chat_id={request.chat_id} 상태 초기화")

            # 로그 저장
            save_chat_log(db, request.chat_id, RoleEnum.user, request.message)
            save_chat_log(db, request.chat_id, RoleEnum.ai, response_text)
            logger.info(f"[LOG SAVED] chat_id={request.chat_id}, user_text_len={len(request.message)}, ai_text_len={len(response_text)}")

    return EventSourceResponse(event_generator())


@router.post(
    "/create",
    response_model=CreateChatResponse,
    summary="채팅방 생성",
    description="지정한 report_id에 대해 새 채팅방을 생성합니다."
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

    chat = Chat(report_id=report.report_id)
    db.add(chat)
    db.commit()
    db.refresh(chat)

    return CreateChatResponse(
        chat_id=chat.chat_id,
        message="채팅방이 생성되었습니다."
    )


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
