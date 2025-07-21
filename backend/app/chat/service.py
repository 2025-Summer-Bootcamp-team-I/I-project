# app/chat/service.py
import os
from app.chat.memory_store import get_memory
from langchain_community.chat_models import ChatOpenAI
from langchain.chains import ConversationalRetrievalChain
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from app.chat.crud import save_chat_log
from app.chat.models import RoleEnum
from sqlalchemy.orm import Session
from .models import ChatLog
from .schemas import ChatLogResponse
from app.database import get_db  # SessionLocal
from sqlalchemy.orm import Session
# Report 모델 실제 경로에 맞게 수정 필요
from app.report.models import Report
import re
from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain.prompts import PromptTemplate
import chromadb

def extract_score_and_result(ai_response):
    m = re.search(r"치매 위험도 점수[:：]?\s*(\d+)", ai_response)
    score = int(m.group(1)) if m else None
    m2 = re.search(r"소견[:：]?\s*([^\n]+)", ai_response)
    result = m2.group(1).strip() if m2 else None
    return score, result

def save_report_text_score_and_result(db, report_id, text_score, chat_result):
    report = db.query(Report).filter(Report.report_id == report_id).first()
    if report:
        report.text_score = text_score
        report.chat_result = chat_result
        db.commit()

openai_api_key = os.environ.get("OPENAI_API_KEY")
if not openai_api_key:
    raise RuntimeError("OPENAI_API_KEY 환경변수가 설정되어 있지 않습니다.")

client = chromadb.HttpClient(host="chroma-server", port=8000)
vectordb = Chroma(
    client=client,
    collection_name="dementia_chunks",  # 임베딩 컬렉션명과 동일해야 함
    embedding_function=OpenAIEmbeddings(openai_api_key=openai_api_key)
)
def chat_with_ai(report_id: int, chat_id: int, message: str, db: Session) -> str:
    memory = get_memory(report_id)

    # 논문 근거 기반 치매 평가 전문 챗봇 프롬프트
    system_prompt = (
        "당신은 사용자의 일상과 기억, 생활 습관 등에 대해 자연스럽게 대화하는 친근한 대화 파트너입니다.\n"
        "- 검사, 테스트, 진단, 평가, 점수, 소견, 논문, 연구, 참고문헌 등 전문 용어는 사용하지 마세요.\n"
        "- 사용자의 답변을 잘 기억하고, 그에 맞는 자연스러운 후속 질문을 하세요.\n"
        "- 이미 했던 질문이나, 사용자가 답한 내용을 다시 묻지 마세요.\n"
        "- 같은 질문이나 유사한 질문을 반복하지 마세요.\n"
        "- 대화 맥락을 잘 기억하고, 관련된 후속 질문만 하세요.\n"
        "- 사용자가 어떤 주제(예: 드라마, 영화 등)에 관심 없다고 하거나, '안 본다', '모른다', '관심 없다', '없다' 등으로 답하면, 그 주제에 대해 더 이상 질문하지 마세요.\n"
        "- 사용자의 감정, 의사, 거절, 관심 없음 등의 표현을 존중하고, 그에 맞게 대화 주제를 바꾸거나, 새로운 주제로 자연스럽게 넘어가세요.\n"
        "- 사용자의 답변을 오해하지 말고, 앞서 한 답변과 모순되는 말을 하지 마세요.\n"
        "- 대화는 일상적인 이야기처럼 부드럽게 이어가세요.\n"
        "- 사용자가 불편함을 느끼지 않도록, 친근하고 따뜻하게 대화하세요.\n"
        "- 뜬금없는 이야기는 하지 말고, 사용자의 직전 답변과 관련된 질문만 하세요.\n"
        "- 치매, 검사, 평가, 진단, 점수, 소견, 논문 등은 언급하지 마세요.\n"
        "- 대화가 끝날 때는 간단한 응원의 말을 남기세요.\n"
        "- 사용자가 '끝', '그만', '종료', '마치자', '끝낼래', '대화 그만', '대화 종료' 등 대화 종료 의사를 표현하면, 반드시 대화를 종료하고 마지막 인사만 남기세요. 이후에는 추가 질문이나 대화를 이어가지 마세요.\n"
        "- 사용자가 대화를 끝내고 싶다고 하면, '네, 오늘 대화는 여기까지 할게요. 좋은 하루 보내세요!'와 같이 짧게 인사만 남기세요.\n"
        "- 한 대화에서 질문(주고받는 QnA)이 5~7개 정도 오갔다면, 사용자가 종료 의사를 밝히지 않아도 반드시 대화를 마무리하고, 마지막 멘트로 '오늘 대화는 여기까지 할게요. 좋은 하루 보내세요.'라고 말한 뒤 더 이상 대화를 이어가지 마세요.\n"
        "- 대화 중에는 논문(연구 결과, 과학적 근거 등)을 참고하여 치매 위험 평가에 도움이 될 수 있는 질문(예: 기억력, 일상 습관, 최근 경험, 시간/장소 인지 등)을 자연스럽고 친근하게 던지세요. 단, 검사나 진단, 평가, 점수, 소견, 논문 등 전문 용어는 사용하지 말고, 일상 대화처럼 부드럽게 질문하세요."
    )

    prompt = ChatPromptTemplate.from_messages([
        SystemMessagePromptTemplate.from_template(system_prompt + "\n\n참고 논문: {context}"),
        HumanMessagePromptTemplate.from_template("{question}")
    ])

    chain = ConversationalRetrievalChain.from_llm(
        llm=ChatOpenAI(model="gpt-4", temperature=0, openai_api_key=openai_api_key),
        retriever=vectordb.as_retriever(),
        memory=memory,
        combine_docs_chain_kwargs={"prompt": prompt}
    )

    # 1. 사용자 메시지 저장
    save_chat_log(db, chat_id=chat_id, role=RoleEnum.user, text=message)

    # 2. AI 응답 생성
    response = chain.run(message)

    # 3. AI 응답 저장
    save_chat_log(db, chat_id=chat_id, role=RoleEnum.ai, text=response)

    # 4. 마지막 평가(점수/소견) 추출 및 저장
    score, result = extract_score_and_result(response)
    if score is not None and result is not None:
        save_report_text_score_and_result(db, report_id, score, result)

    return response

def get_chat_logs(db: Session, chat_id: int) -> list[ChatLogResponse]:
    logs = (
        db.query(ChatLog)
        .filter(ChatLog.chat_id == chat_id)
        .order_by(ChatLog.updated_at.asc())  # updated_at 기준 오름차순
        .all()
    )
    return [ChatLogResponse.from_orm(log) for log in logs]

def evaluate_conversation_and_save(db: Session, report_id: int, chat_id: int):
    """
    전체 대화 로그를 바탕으로 LLM에게 치매 위험도 점수와 소견을 생성하게 하고, Report에 저장합니다.
    """
    # 1. 전체 대화 로그 불러오기
    logs = (
        db.query(ChatLog)
        .filter(ChatLog.chat_id == chat_id)
        .order_by(ChatLog.log_id.asc())
        .all()
    )
    conversation = ""
    for log in logs:
        if log.role.value == "user":
            conversation += f"사용자: {log.text}\n"
        else:
            conversation += f"AI: {log.text}\n"

    # 2. 평가용 프롬프트
    eval_prompt = PromptTemplate(
        input_variables=["conversation"],
        template=(
            "아래는 사용자와 AI의 전체 대화 내용입니다.\n"
            "{conversation}\n"
            "이 대화를 바탕으로, 사용자의 치매 위험도를 0~100점으로 평가하고, 간단한 소견(1~2문장)도 작성해 주세요.\n"
            "- 점수와 소견만 아래 형식으로 출력하세요.\n"
            "치매 위험도 점수: <숫자>\n소견: <내용>"
        )
    )

    llm = ChatOpenAI(model="gpt-4", temperature=0, openai_api_key=openai_api_key)
    eval_chain = eval_prompt | llm
    eval_response = eval_chain.invoke({"conversation": conversation})
    
    # 3. 점수/소견 추출 및 저장
    score, result = extract_score_and_result(str(eval_response))
    if score is not None and result is not None:
        save_report_text_score_and_result(db, report_id, score, result)
