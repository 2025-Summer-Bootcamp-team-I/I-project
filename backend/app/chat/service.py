# app/chat/service.py

import os
import re
import chromadb
from sqlalchemy.orm import Session
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import ConversationalRetrievalChain
from langchain_community.vectorstores import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate, PromptTemplate

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
    embedding_function=GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=google_api_key)
)

def chat_with_ai(report_id: int, chat_id: int, message: str, db: Session) -> str:
    # 1. 사용자 메시지 저장 및 턴 수 계산
    save_chat_log(db, chat_id=chat_id, role=RoleEnum.user, text=message)
    db.flush()
    turn_count = db.query(ChatLog).filter(ChatLog.chat_id == chat_id, ChatLog.role == RoleEnum.user).count()

    response = ""
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro-latest", temperature=0.1, google_api_key=google_api_key, convert_system_message_to_human=True)

    # ✅ 작별 인사
    if turn_count == 7:
        farewell_prompt_text = """
당신은 따뜻한 작별인사 전문가입니다. 당신의 임무는 사용자와의 대화를 자연스럽게 마무리하는 것입니다.

# 규칙
1. 사용자의 마지막 말에 간단히 공감하며 반응해주세요.
3. 따뜻한 작별 인사를 건네며 대화를 마무리해주세요.
4. 응답의 맨 마지막에는, 다른 말 없이 정확히 '아래에 종료 버튼을 눌러주세요.' 라는 문구를 추가해야 합니다.
5. 답변은 한두 문장으로 매우 간결하게 유지하세요.

사용자의 마지막 말: {question}
"""
        farewell_prompt = PromptTemplate.from_template(farewell_prompt_text)
        farewell_chain = farewell_prompt | llm
        ai_response = farewell_chain.invoke({"question": message})
        response = ai_response.content

    # ✅ 일반 대화
    elif turn_count <= 6:
        memory = get_memory(report_id)
        system_prompt_template = """
당신은 사용자와 친근하게 대화하며, 당신은 당신의 이야기를 해서는 안되고, 사용자의 이야기를 경청하고 자연스럽게 대화를 이끌어 나가는 대화 파트너입니다.
사용자의 답변 마지막에 '?'가 있을 경우에만 자신의 생각,경험,취향을 말하세요, 그외에는 리액션과 질문만 가능합니다.


# [대화의 3대 절대 원칙]
1. **중복 질문 금지**: 대화 기록을 항상 확인하여 이미 했던 질문이나 비슷한 질문을 절대 반복하지 마세요.
2. **모순 질문 금지**: 사용자의 답변에 모순되는 질문을 하지 마세요. 사용자가 "평범했다"고 답하면 "특별한 순간"을 묻는 것은 모순입니다. 사용자가 대화를 이어가기 힘들어하면(예: "글쎄", "없어"), 즉시 다른 주제로 전환하세요.
3. **자기 언급 및 추측 금지**: AI인 자신에 대해 말하거나('저는...'), 사용자의 의도를 추측하지 마세요('~가 궁금하시군요').

# [대화 진행 방법]
- 모든 답변은 **[사용자 말에 대한 반응] + [관련된 새로운 질문]** 순서로 구성해야 합니다.
- 반응은 짧게, 질문은 자연스럽게 이어져야 합니다.
- 한 가지 주제에 대한 대화가 2번 이상 오갔다면, 자연스럽게 다른 주제로 넘어가세요.

### **기타 주요 규칙**
2. **한 주제에 얽매이지 않기**: 한 가지 주제(예: 음식, 날씨)에 대해 2회 이상 연속으로 질문했다면, 사용자의 답변을 받은 후 자연스럽게 다른 주제로 전환하세요.
3. **자연스러운 공감 표현**: '공감합니다'와 같이 기계적인 표현 대신, "아, 그렇군요.", "정말요?"처럼 감정이 느껴지는 자연스러운 추임새를 사용하세요.
4. **주도적인 대화 시작**: 사용자가 "아무 얘기나 해줘"라고 명시적으로 말하는 경우에만 먼저 적절한 일상 주제로 대화를 시작하세요. 일반적인 인사에는 간단하게 답하고 사용자가 대화를 이끌어가도록 하세요.
5. **기억력 활용**: 사용자가 이전에 제공한 정보(예: 장소, 이름)를 기억하고, 동일한 내용을 다시 질문하지 마세요.
6. **간결함 유지**: 항상 한두 문장 이내로 매우 짧고 자연스럽게 말하세요.
7. **즉각적인 주제 전환**: 사용자가 "없어", "모르겠어", "관심 없어", "글쎄" 등 대화를 이어가기 어려워하는 표현을 사용하면, 바로 대화를 끝내지 말고 다른 주제로 자연스럽게 전환하세요. - **나쁜 예시**: (사용자: "과일 글쎄") → "그렇군요. 오늘 대화 나눠서 즐거웠습니다." (X) - **좋은 예시 1**: (사용자: "과일 글쎄") → "아, 그렇군요. 그럼 음식 말고, 평소에 즐겨 가시는 장소는 있으신가요?" (장소 전환) - **좋은 예시 2**: (사용자: "몰라") → "그럴 수 있죠. 혹시 요즘 듣는 노래 중에 좋아하시는 거 있으세요?" (음악 전환) - **좋은 예시 3**: (사용자: "관심 없어") → "괜찮아요. 그럼 혹시 최근에 있었던 인상 깊은 일이 있으셨나요?" (일상/감정 전환)
8. **부정적 감정 대응**: 사용자가 짜증, 불쾌감, 거부 반응을 보이면, "아, 제가 실수가 있었네요. 죄송합니다." 와 같이 간결하게 사과하고 즉시 다른 주제로 전환하세요.
9. **특정 계절일때만 할 수 있는 질문은 하지마세요. 예시:더위를 피하시는 방법을 알려주세요.
10. **전문 용어 금지**: '검사', '진단', '문진', '점수', '소견' 같은 단어는 쓰지 마세요.
11. **어조**: 따뜻하고 존중하는 어조를 사용하세요.

# 기타 정보
- 참고 논문(Context)을 참고해 자연스럽게 유도형 질문을 하세요.
- 현재 {turn_count}번째 대화입니다. 총 7턴 후에는 대화를 종료해야 합니다.
"""
        system_prompt = system_prompt_template.format(turn_count=turn_count)
        prompt = ChatPromptTemplate.from_messages([
            SystemMessagePromptTemplate.from_template(system_prompt + "\n\n참고 논문(Context): {context}"),
            HumanMessagePromptTemplate.from_template(
                "이전 대화 요약(chat_history):\n{chat_history}\n\n사용자 발화: {question}"
            )
        ])
        chain = ConversationalRetrievalChain.from_llm(
            llm=llm,
            retriever=vectordb.as_retriever(),
            memory=memory,
            combine_docs_chain_kwargs={"prompt": prompt}
        )
        ai_response = chain.run(message)
        response = ai_response

    else:
        response = "이미 대화가 종료되었습니다. 아래 종료 버튼을 눌러 평가를 완료해주세요."

    # 2. AI 응답 저장
    save_chat_log(db, chat_id=chat_id, role=RoleEnum.ai, text=response)
    return response

def get_chat_logs(db: Session, chat_id: int) -> list[ChatLogResponse]:
    logs = (
        db.query(ChatLog)
        .filter(ChatLog.chat_id == chat_id)
        .order_by(ChatLog.updated_at.asc())
        .all()
    )
    return [ChatLogResponse.from_orm(log) for log in logs]

def evaluate_and_save_chat_result(db, chat_id: int, report_id: int):
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

    eval_prompt = PromptTemplate(
        input_variables=["conversation"],
        template=(
            "아래는 사용자와 AI의 전체 대화 내용입니다.\n"
            "{conversation}\n\n"
            "참고 논문(치매 관련 연구 데이터)도 함께 참고하세요.\n"
            "\n"
            "1. 대화 중 사용자가 보인 '치매가 있는 사람이 자주 보이는 특징적인 응답'이 몇 번 나왔는지 논문을 참고해 판단하세요.\n"
            "2. 그 횟수가 2개 이상이면 '경계', 4개 이상이면 '위험', 그 미만이면 '양호'로 정하세요.\n"
            "3. 아래 예시 형식을 따라 주세요:\n\n"
            "<양호>\n"
            "소견: 대화 검사 결과, 특별한 이상 징후가 관찰되지 않았습니다. 사용자는 일상적인 질문에 일관되게 답변하였으며, 기억력이나 인지에 뚜렷한 혼동은 보이지 않았습니다.\n\n"
            "<경계>\n"
            "소견: 대화 검사 결과, 사용자는 [문제되는 패턴]을 반복적으로 보였습니다. 예: [예시1], [예시2]\n\n"
            "<위험>\n"
            "소견: 대화 검사 결과, 사용자는 [문제되는 패턴]을 여러 차례 반복했습니다. 예: [예시1], [예시2]\n\n"
            "위험도: <양호/경계/위험>\n"
        )
    )

    llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro-latest", temperature=0, google_api_key=google_api_key)
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
