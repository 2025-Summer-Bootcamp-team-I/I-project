# app/chat/service.py

import ast
import os
import re
import chromadb
from sqlalchemy.orm import Session
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate, PromptTemplate
from langchain_community.vectorstores import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain.chains import ConversationalRetrievalChain
from app.chat.models import Chat
from app.chat.memory_store import get_memory
from app.chat.crud import save_chat_log
from app.chat.models import RoleEnum, ChatLog
from app.chat.schemas import ChatLogResponse
from app.database import get_db
from app.report.models import Report, RiskLevel
from datetime import datetime


today_str = datetime.now().strftime("%Y년 %m월 %d일")

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
    collection_name="dementia_gemini_v1",
    embedding_function=GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=google_api_key)
)

def chat_with_ai(report_id: int, chat_id: int, message: str, db: Session) -> str:
    save_chat_log(db, chat_id=chat_id, role=RoleEnum.user, text=message)
    db.flush()
    turn_count = db.query(ChatLog).filter(ChatLog.chat_id == chat_id, ChatLog.role == RoleEnum.user).count()

    response = ""
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro-latest", temperature=0.5, google_api_key=google_api_key)

    if turn_count == 7:
        farewell_prompt_text = """
당신은 따뜻한 작별인사 전문가입니다. 당신의 임무는 사용자와의 대화를 자연스럽게 마무리하는 것입니다.

# 규칙
1. 사용자의 마지막 말에 간단히 공감하며 반응해주세요. (예: "그렇군요.", "알겠습니다.")
2. 새로운 질문은 절대 하지 마세요.
3. 따뜻한 작별 인사를 건네며 대화를 마무리해주세요.
4. 응답의 맨 마지막에는, 다른 말 없이 정확히 ' 아래에 종료 버튼을 눌러주세요 . ' 라는 문구를 추가해야 합니다.
5. 답변은 한두 문장으로 매우 간결하게 유지하세요.

사용자의 마지막 말: {question}
"""
        farewell_prompt = PromptTemplate.from_template(farewell_prompt_text)
        farewell_chain = farewell_prompt | llm
        ai_response = farewell_chain.invoke({"question": message})
        response = ai_response.content

    elif turn_count == 1:
        response = (
            "안녕하세요. 지금부터 대화를 시작하겠습니다. 보다 정확한 이해를 위해, 단답형보다는 완전한 문장으로 답변해주시면 감사하겠습니다.\n\n"
            "먼저, 오늘은 무슨 요일인지 말씀해주시겠어요?"
        )

    elif turn_count <= 6:
        memory = get_memory(report_id)
        system_prompt_template = """
당신은 사용자의 이야기를 들어주는 친근한 대화 파트너입니다. 당신의 유일한 역할은 사용자의 말을 듣고 다양한 리액션과 질문만 하세요. 자신에 대한 생각을 말하지마세요. 제발

# 페르소나 및 대화 규칙
1. **자신을 드러내지 않기**: 절대로 당신 자신에 대한 이야기(의견, 감정, 취향 등)를 하지 마세요. "저는", "제 생각에는" 같은 문장도 금지입니다. AI라는 말도 하지 마세요.
    - 사용자의 발화를 오해하거나 왜곡하지 마세요. ("안 했어요" → "하셨군요" ❌)

2. **사용자 말 따라하지 않기**: 사용자의 말을 그대로 반복하거나 사용자 입장에서 말하지 마세요.

3. **공감과 질문에 집중**: 짧게 공감하고 이어서 질문하세요.
    - 같은 질문을 표현만 바꿔 반복하지 마세요. ("노인정에서 뭐 하세요?" → "거기서 시간 어떻게 보내세요?" → 금지 ❌)

4. **간결함 유지**: 가능한 한 간결하게 말하되, 사용자의 말에 자연스럽게 반응하세요.

5. **자연스러운 대화 흐름**:
    - 다음과 같은 표현이 나오면 즉시 주제를 바꾸세요: "모르겠어", "기억 안 나", "딱히", "글쎄", "그냥 그랬어", "생각 안 나", "말하고 싶지 않아", "할 말 없어"

6. **전문 용어 금지**: '검사', '진단', '문진', '점수', '소견' 같은 단어는 쓰지 마세요.

7. **어조**: 단답형이나 무뚝뚝한 말투는 피하고, 따뜻한 어조를 사용하세요.

8. **종료 조건**: '그만', '끝', '이제 됐어' 등의 표현이 나오면 대화를 마무리하세요.

9. **직전 발화 반영**: 항상 직전 사용자 말에 반응하세요. 이전 질문을 무시하고 다음 질문을 하지 마세요. 사용자가 말한 내용을 절대로 되묻지 마세요. (예: "오늘은 목요일인 것 같아요." → "무슨 요일인지 궁금하시군요?" ❌)

10. **추측 금지**: 사용자가 말하지 않은 활동이나 정보를 상상하거나 삽입하지 마세요.  

11. **초기 인사 멘트는 turn 1에서만 출력됩니다.**

# 기타 정보
- 참고 논문(Context)을 참고해 자연스럽게 유도형 질문을 하세요.
- 현재 {turn_count}번째 대화입니다. 총 7턴 후에는 대화를 종료해야 합니다.
- 이 대화는 MMSE(간이 인지 대화)를 참고하여 자연스럽게 구성되어야 합니다.
- 사용자에게 검사받는 느낌을 주지 않도록 주의하세요.
- 오늘은 {today}입니다. 날짜에 대한 질문을 할 때 참고하세요.

# MMSE 기반 유도 질문 예시
아래는 참고 문항입니다. 그대로 출력하지 말고 자연스럽게 유도하세요.  
텍스트 기반 대화만 가능하므로 음성/행동 지시는 금지입니다.

- "오늘 하루는 어떻게 시작하셨어요?" → 요일/날짜 파악 유도  
- "요즘 날씨 어때요? 달력 볼 일이 좀 있었나요?" → 날짜/계절 감각  
- "요즘은 주로 어디서 지내세요?" → 장소 인지  
- "제가 단어 몇 개 적어볼게요: 사과, 연필, 자동차. 기억하실 수 있겠어요?" → 기억 유도  
- "100에서 7씩 빼면 뭐가 될까요? 심심풀이로 해보실래요?" → 계산력  
- "짧은 문장 하나 써보실래요? 아무 말이나 괜찮아요." → 문장 구성 능력  
- "제가 적은 문장 한번 읽어보세요: ‘눈을 감으세요’" → 읽기/이해
"""

        system_prompt = system_prompt_template.format(turn_count=turn_count, today=today_str)

        prompt = ChatPromptTemplate.from_messages([
            SystemMessagePromptTemplate.from_template(system_prompt + "\n\n참고 논문(Context): {context}"),
            HumanMessagePromptTemplate.from_template("이전 대화 요약(chat_history):\n{chat_history}\n\n사용자 발화: {question}\n\n위 규칙을 참고하여 다음 질문을 하세요.")
        ])

        retriever = vectordb.as_retriever()
        docs = retriever.get_relevant_documents(message)

        logs = get_chat_logs(db, chat_id)
        chat_history = [
            ("user" if log.role == RoleEnum.user else "ai", log.text) for log in logs
        ]

        chain = ConversationalRetrievalChain.from_llm(
            llm=llm,
            retriever=retriever,
            combine_docs_chain_kwargs={"prompt": prompt},
        )

        result = chain.invoke({
            "question": message,
            "chat_history": chat_history
        })

        answer = result["answer"] if isinstance(result, dict) and "answer" in result else str(result)
        response = answer

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
    conversation = "".join([
        f"사용자: {log.text}\n" if log.role.value == "user" else f"AI: {log.text}\n" for log in logs
    ])

    eval_prompt = PromptTemplate(
        input_variables=["conversation"],
        template=(
            "아래는 사용자와 AI의 전체 대화 내용입니다.\n"
            "{conversation}\n\n"
            "참고 논문(치매 관련 연구 데이터)도 함께 참고하세요.\n"
            "※ 사용자의 표현이 짧더라도 질문 의도에 부합하고 맥락에 어긋나지 않으면 단답형으로 간주하지 마세요.\n"
            "※ 날씨, 위치, 기억 회상 등의 대답이 간결하지만 정확한 경우는 정상 반응입니다.\n"
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

    llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro-latest", temperature=0.7, google_api_key=google_api_key)
    eval_chain = eval_prompt | llm
    eval_response = eval_chain.invoke({"conversation": conversation})
    response_text = eval_response.content

    # chat_result: <양호> ~ 소견까지 한 블록 추출
    m = re.search(r"(<(양호|경계|위험)>[\s\S]*?소견[:：]?\s*[^\n]+)", response_text)
    chat_result = m.group(1).strip() if m else ""

    # chat_risk_str: <양호> 또는 위험도 라벨 기반으로 판단
    m1 = re.search(r"<(양호|경계|위험)>", response_text)
    if m1:
        chat_risk_str = m1.group(1).strip()
    else:
        m2 = re.search(r"위험도[:：]?\s*(양호|경계|위험)", response_text)
        chat_risk_str = m2.group(1).strip() if m2 else "양호"

    risk_enum = {
        "양호": RiskLevel.GOOD,
        "경계": RiskLevel.CAUTION,
        "위험": RiskLevel.DANGER
    }.get(chat_risk_str, RiskLevel.GOOD)

    report = db.query(Report).filter(Report.report_id == report_id).first()
    if not report:
        raise ValueError("리포트가 존재하지 않습니다.")
    report.chat_result = chat_result
    report.chat_risk = risk_enum
    db.commit()

    return chat_result, risk_enum