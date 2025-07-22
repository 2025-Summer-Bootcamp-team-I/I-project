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
from app.report.models import Report, RiskLevel
import re
from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain.prompts import PromptTemplate
import chromadb
from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate


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
    system_prompt = """
당신은 친근한 대화 파트너입니다.
- 제공된 참고 논문(Context)을 활용해 실제 연구에서 사용된 치매 선별 질문을 자연스럽고 일상 대화로 묻습니다.
- 검사, 진단, 평가, 점수, 소견 등 전문 용어는 사용하지 않습니다.
- 자기 언급이나 능력 언급을 하지 않습니다.
- 대화 이력(chat_history)을 확인해 이미 물어본 질문을 반복하지 않습니다.
- 논문의 핵심 내용을 참고해 질문을 구성합니다.
- 사용자의 이전 답변을 바탕으로 열린 질문을 합니다. 예: “최근에 어떤 장소나 일이 가장 기억에 남으세요?”
- 어조는 따뜻하고 존중합니다.
- 주고받음이 7회에 도달하면 간단한 작별 인사로 대화를 종료합니다.
- 사용자가 ‘끝’, ‘그만’, ‘종료’ 등을 표현하면 즉시 대화를 마무리하고 짧게 작별 인사를 남깁니다.
"""

    prompt = ChatPromptTemplate.from_messages([
        SystemMessagePromptTemplate.from_template(system_prompt + "\n\n참고 논문(Context): {context}"),
        HumanMessagePromptTemplate.from_template(
            "이전 대화 요약(chat_history):\n{chat_history}\n\n"
            "사용자 발화: {question}"
        )
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

    return response

def get_chat_logs(db: Session, chat_id: int) -> list[ChatLogResponse]:
    logs = (
        db.query(ChatLog)
        .filter(ChatLog.chat_id == chat_id)
        .order_by(ChatLog.updated_at.asc())  # updated_at 기준 오름차순
        .all()
    )
    return [ChatLogResponse.from_orm(log) for log in logs]

def evaluate_and_save_chat_result(db, chat_id: int, report_id: int):
    """
    전체 대화 로그를 바탕으로 LLM에게 치매 위험 관련 소견(chat_result)과 위험도(chat_risk)를 생성, Report에 저장
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

    # 2. 평가용 프롬프트 (점수X, 소견+위험도만)
    eval_prompt = PromptTemplate(
        input_variables=["conversation"],
        template = (
            "아래는 사용자와 AI의 전체 대화 내용입니다.\n"
            "{conversation}\n\n"
            "참고 논문(치매 관련 연구 데이터)도 함께 참고하세요.\n"
            "\n"
            "1. 대화 중 사용자가 보인 '치매가 있는 사람이 자주 보이는 특징적인 응답'이 몇 번 나왔는지 논문을 참고해 정확히 판단하세요.\n"
            "2. 그 횟수가 2개 이상이면 '경계', 4개 이상이면 '위험', 그 미만이면 '양호'로 위험도를 정하세요.\n"
            "3. 아래 예시 형식을 그대로 따라 답하세요. [대괄호] 부분만 실제 대화 내용과 분석에 맞게 채워 넣으세요.\n\n"
            "<양호>\n"
            "소견: 대화 검사 결과, 특별한 이상 징후가 관찰되지 않았습니다. 사용자는 일상적인 질문에 일관되게 답변하였으며, 기억력이나 인지에 뚜렷한 혼동은 보이지 않았습니다. 현재 상태를 유지하며 일상 생활을 계속하시는 것을 권장합니다.\n\n"
            "<경계>\n"
            "소견: 대화 검사 결과, 사용자는 [문제되는 패턴/특징]을(를) 반복적으로 보였습니다. 특히, [구체적 예시 1], [구체적 예시 2]와 같은 대답이 관찰되었고, 이는 [인지 저하/기억력 저하/혼동 경향 등]의 신호일 수 있습니다. 이러한 특성으로 볼 때, 추가 관찰이 필요합니다.\n\n"
            "<위험>\n"
            "소견: 대화 검사 결과, 사용자는 [문제되는 패턴/특징]을(를) 여러 차례 반복했습니다. 예를 들어, [구체적 예시 1] 및 [구체적 예시 2]와 같은 대답이 관찰되었고, 이는 심각한 인지 저하 또는 혼동 경향을 시사합니다. 추가 평가나 전문 기관 방문을 권장합니다.\n\n"
            "위험도: <양호/경계/위험>\n"

        )

    )

    llm = ChatOpenAI(model="gpt-4", temperature=0, openai_api_key=openai_api_key)
    eval_chain = eval_prompt | llm
    eval_response = eval_chain.invoke({"conversation": conversation})
    response_text = eval_response.content

    # 3. 결과 추출 (점수X)
    m1 = re.search(r"소견[:：]?\s*([^\n]+)", response_text)
    chat_result = m1.group(1).strip() if m1 else ""

    m2 = re.search(r"위험도[:：]?\s*(양호|경계|위험)", response_text)
    # 매치 실패 시 기본값을 '양호'로
    chat_risk_str = m2.group(1).strip() if m2 else "양호"

    # Enum 변환
    if chat_risk_str == "양호":
        risk_enum = RiskLevel.GOOD
    elif chat_risk_str == "경계":
        risk_enum = RiskLevel.CAUTION
    elif chat_risk_str == "위험":
        risk_enum = RiskLevel.DANGER
    else:#예외 처리: 혹시 다른 값이 들어오면 기본을 양호로
        risk_enum = RiskLevel.GOOD

    # 4. Report 저장
    report = db.query(Report).filter(Report.report_id == report_id).first()
    if not report:
        raise ValueError("리포트가 존재하지 않습니다.")
    report.chat_result = chat_result
    report.chat_risk = risk_enum
    db.commit()

    return chat_result, risk_enum