# app/chat/api.py
from sse_starlette.sse import EventSourceResponse
import asyncio

from app.chat.schemas import ChatRequest, ChatResponse
from app.chat.service import chat_with_ai, evaluate_conversation_and_save
from app.chat.crud import save_chat_log
from app.chat.models import RoleEnum
from app.chat.stream_handler import get_streaming_chain
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from .service import get_chat_logs
from .schemas import ChatLogResponse
from app.report.models import Report
from app.chat.models import Chat
from .schemas import CreateChatRequest, CreateChatResponse

router = APIRouter(prefix="/chat", tags=["Chat"])

def is_end_message(message: str) -> bool:
    end_keywords = ["끝", "그만", "종료", "마치자", "끝낼래", "대화 그만", "대화 종료"]
    return any(kw in message for kw in end_keywords)

def is_gpt_end_response(response: str) -> bool:
    end_phrases = [
        "오늘 대화는 여기까지 할게요. 좋은 하루 보내세요."
    ]
    return any(phrase in response for phrase in end_phrases)

@router.post("", response_model=ChatResponse)
def chat(request: ChatRequest, db: Session = Depends(get_db)):
    response = chat_with_ai(
        report_id=request.report_id,
        chat_id=request.chat_id,
        message=request.message,
        db=db
    )

    # 대화 종료 신호 감지: 사용자 메시지 or AI 응답
    if is_end_message(request.message) or is_gpt_end_response(response):
        evaluate_conversation_and_save(db, request.report_id, request.chat_id)

    return {"response": response}


@router.post("/stream")
async def stream_chat(request: ChatRequest, db: Session = Depends(get_db)):
    async def event_generator():
        response_text = ""
        chain, memory, handler = get_streaming_chain(request.report_id)

        # 비동기 체인 실행
        task = asyncio.create_task(chain.acall(request.message))

        # 토큰 단위로 스트리밍
        async for token in handler.aiter():
            response_text += token
            yield f"data: {token}\n\n"

        # 전체 응답 저장
        save_chat_log(db, request.chat_id, RoleEnum.user, request.message)
        save_chat_log(db, request.chat_id, RoleEnum.ai, response_text)

    return EventSourceResponse(event_generator())

@router.post("/create", response_model=CreateChatResponse)
def create_chat(request: CreateChatRequest, db: Session = Depends(get_db)):
    # 1. Report 생성 또는 기존 report_id 사용
    if request.report_id is not None:
        report = db.query(Report).filter(Report.report_id == request.report_id).first()
        if not report:
            raise ValueError("해당 report_id가 존재하지 않습니다.")
    else:
        report = Report()
        db.add(report)
        db.commit()
        db.refresh(report)

    # 2. Chat 생성
    chat = Chat(report_id=report.report_id)
    db.add(chat)
    db.commit()
    db.refresh(chat)

    return CreateChatResponse(
        chat_id=chat.chat_id,
        message="채팅방이 생성되었습니다."
    )

@router.get("/logs/{chat_id}", response_model=list[ChatLogResponse])
def read_chat_logs(chat_id: int, db: Session = Depends(get_db)):
    return get_chat_logs(db, chat_id)
