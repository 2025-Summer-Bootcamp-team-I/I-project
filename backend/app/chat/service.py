# app/chat/service.py

import os
import re
import chromadb
from sqlalchemy.orm import Session
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain.chains import ConversationalRetrievalChain
from langchain_community.vectorstores import Chroma
from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate, PromptTemplate
from app.chat.models import Chat
from app.chat.memory_store import get_memory
from app.chat.crud import save_chat_log
from app.chat.models import RoleEnum, ChatLog
from app.chat.schemas import ChatLogResponse
from app.database import get_db
from app.report.models import Report, RiskLevel

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

google_api_key = os.environ.get("GOOGLE_API_KEY")
if not google_api_key:
    raise RuntimeError("GOOGLE_API_KEY 환경변수가 설정되어 있지 않습니다.")

client = chromadb.HttpClient(host="chroma-server", port=8000)
vectordb = Chroma(
    client=client,
    collection_name="dementia_chunks",
    embedding_function=GoogleGenerativeAIEmbeddings(google_api_key=google_api_key)
)

def chat_with_ai(report_id: int, chat_id: int, message: str, db: Session) -> str:
    save_chat_log(db, chat_id=chat_id, role=RoleEnum.user, text=message)
    db.flush()
    turn_count = db.query(ChatLog).filter(ChatLog.chat_id == chat_id, ChatLog.role == RoleEnum.user).count()

    response = ""
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-pro-latest",
        temperature=0.1,
        google_api_key=google_api_key,
        convert_system_message_to_human=True
    )

    if turn_count == 7:
        farewell_prompt_text = """
당신은 따뜻한 작별인사 전문가입니다. 당신의 임무는 사용자와의 대화를 자연스럽게 마무리하는 것입니다.

# 규칙
1. 사용자의 마지막 말에 간단히 공감하며 반응해주세요.
2. 새로운 질문은 절대 하지 마세요.
3. 따뜻한 작별 인사를 건네며 대화를 마무리해주세요.
4. 응답의 맨 마지막에는, 다른 말 없이 정확히 '아래에 종료 버튼을 눌러주세요.' 라는 문구를 추가해야 합니다.
5. 답변은 한두 문장으로 매우 간결하게 유지하세요.

사용자의 마지막 말: {question}
"""
        farewell_prompt = PromptTemplate.from_template(farewell_prompt_text)
        farewell_chain = farewell_prompt | llm
        ai_response = farewell_chain.invoke({"question": message})
        response = ai_response.content

    elif turn_count <= 6:
        memory = get_memory(report_id)
        system_prompt_template = """
당신은 사용자와 친근하게 대화하며, 당신은 당신의 이야기를 해서는 안되고, 사용자의 이야기를 경청하고 자연스럽게 대화를 이끌어 나가는 대화 파트너입니다.
사용자의 답변 마지막에 '?'가 있을 경우에만 자신의 생각,경험,취향을 말하세요, 그외에는 리액션과 질문만 가능합니다.
# 페르소나 및 대화 규칙
1. **자신을 드러내지 않기**: 절대로 당신 자신에 대한 이야기(의견, 감정, 취향 등)를 하지 마세요. "저는", "제 생각에는" 같은 문장도 금지입니다. AI라는 말도 하지 마세요.
    - 사용자의 발화를 오해하거나 왜곡하지 마세요. ("안 했어요" → "하셨군요" ❌)

2. **사용자 말 따라하지 않기**: 사용자의 말을 그대로 반복하거나 사용자 입장에서 말하지 마세요.

3. **공감과 질문에 집중**: 짧게 공감하고 이어서 질문하세요.
    - 같은 질문을 표현만 바꿔 반복하지 마세요. ("노인정에서 뭐 하세요?" → "거기서 시간 어떻게 보내세요?" → 금지 ❌)

4. **간결함 유지**: 항상 한두 문장 이내로 짧고 자연스럽게 말하세요.

5. **자연스러운 대화 흐름**:
    - 다음과 같은 표현이 나오면 즉시 주제를 바꾸세요: "모르겠어", "기억 안 나", "딱히", "글쎄", "그냥 그랬어", "생각 안 나", "말하고 싶지 않아", "할 말 없어"

6. **전문 용어 금지**: '검사', '진단', '문진', '점수', '소견' 같은 단어는 쓰지 마세요.

6. **간결함 유지**: 항상 한두 문장 이내로 매우 짧고 자연스럽게 말하세요.
7. **즉각적인 주제 전환**: 사용자가 "없어", "모르겠어", "관심 없어", "글쎄" 등 대화를 이어가기 어려워하는 표현을 사용하면, 바로 대화를 끝내지 말고 다른 주제로 자연스럽게 전환하세요. 
8. **부정적 감정 대응**: 사용자가 짜증, 불쾌감, 거부 반응을 보이면, "아, 제가 실수가 있었네요. 죄송합니다." 와 같이 간결하게 사과하고 즉시 다른 주제로 전환하세요.
9. **특정 계절일때만 할 수 있는 질문은 하지마세요. 예시:더위를 피하시는 방법을 알려주세요.
10. **한 주제에 얽매이지 않기**: 한 가지 주제(예: 음식, 날씨)에 대해 2회 이상 연속으로 질문했다면, 사용자의 답변을 받은 후 자연스럽게 다른 주제로 전환하세요.

9. **직전 발화 반영**: 항상 직전 사용자 말에 반응하세요. 이전 질문을 무시하고 다음 질문을 하지 마세요.


- 참고 논문(Context)을 참고해 자연스럽게 유도형 질문을 하세요.
- 현재 {turn_count}번째 대화입니다. 총 7턴 후에는 대화를 종료해야 합니다.
""".format(turn_count=turn_count)

        prompt = ChatPromptTemplate.from_messages([
            SystemMessagePromptTemplate.from_template(system_prompt_template + "\n\n참고 논문(Context): {context}"),
            HumanMessagePromptTemplate.from_template(
                "이전 대화 요약(chat_history):\n{chat_history}\n\n사용자 발화: {question}"
            )
        ])

        retriever = vectordb.as_retriever()
        docs = retriever.get_relevant_documents(message)

        chain = ConversationalRetrievalChain.from_llm(
            llm=llm,
            retriever=retriever,
            memory=memory,
            combine_docs_chain_kwargs={"prompt": prompt}
        )
        ai_response = chain.run(message)

        if turn_count == 1:
            intro = "안녕하세요. 지금부터 대화를 시작하겠습니다. 보다 정확한 이해를 위해, 단답형보다는 완전한 문장으로 답변해주시면 감사하겠습니다.\n\n"
            response = intro + ai_response
        else:
            response = ai_response

    else:
        response = "이미 대화가 종료되었습니다. 아래 종료 버튼을 눌러 평가를 완료해주세요."

    save_chat_log(db, chat_id=chat_id, role=RoleEnum.ai, text=response)
    return response

def get_chat_logs_by_report_id(db: Session, report_id: int) -> list[ChatLogResponse]:
    chat = db.query(Chat).filter(Chat.report_id == report_id).first()
    if not chat:
        return []
    logs = db.query(ChatLog).filter(ChatLog.chat_id == chat.chat_id).order_by(ChatLog.updated_at.asc()).all()
    return [ChatLogResponse.from_orm(log) for log in logs]

def get_chat_logs(db: Session, chat_id: int) -> list[ChatLogResponse]:
    logs = db.query(ChatLog).filter(ChatLog.chat_id == chat_id).order_by(ChatLog.updated_at.asc()).all()
    return [ChatLogResponse.from_orm(log) for log in logs]

def evaluate_and_save_chat_result(db, chat_id: int, report_id: int):
    logs = db.query(ChatLog).filter(ChatLog.chat_id == chat_id).order_by(ChatLog.log_id.asc()).all()
    conversation = ""
    for log in logs:
        if log.role.value == "user":
            conversation += f"사용자: {log.text}\n"
        else:
            conversation += f"AI: {log.text}\n"

    eval_prompt = PromptTemplate(
        input_variables=["conversation"],
        template=(
            "(평가 프롬프트 내용 그대로 유지)"
        )
    )

    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-pro-latest",
        temperature=0,
        google_api_key=google_api_key,
        convert_system_message_to_human=True
    )

    eval_chain = eval_prompt | llm
    eval_response = eval_chain.invoke({"conversation": conversation})
    response_text = eval_response.content

    m1 = re.search(r"소견[:：]?\s*([^\n]+)", response_text)
    chat_result = m1.group(1).strip() if m1 else ""

    m2 = re.search(r"위험도[:：]?\s*(양호|경계|위험)", response_text)
    chat_risk_str = m2.group(1).strip() if m2 else "양호"

    if chat_risk_str == "양호":
        risk_enum = RiskLevel.GOOD
    elif chat_risk_str == "경계":
        risk_enum = RiskLevel.CAUTION
    elif chat_risk_str == "위험":
        risk_enum = RiskLevel.DANGER
    else:
        risk_enum = RiskLevel.GOOD

    report = db.query(Report).filter(Report.report_id == report_id).first()
    if not report:
        raise ValueError("리포트가 존재하지 않습니다.")
    report.chat_result = chat_result
    report.chat_risk = risk_enum
    db.commit()

    return chat_result, risk_enum
