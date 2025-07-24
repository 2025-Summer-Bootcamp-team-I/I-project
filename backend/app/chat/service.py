# app/chat/service.py

import os
import re
import chromadb
from sqlalchemy.orm import Session
from langchain_community.chat_models import ChatOpenAI
from langchain.chains import ConversationalRetrievalChain
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
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

openai_api_key = os.environ.get("OPENAI_API_KEY")
if not openai_api_key:
    raise RuntimeError("OPENAI_API_KEY 환경변수가 설정되어 있지 않습니다.")

# ChromaDB 연결 설정
vectordb = None
try:
    client = chromadb.HttpClient(host="chroma-server", port=8000)
    vectordb = Chroma(
        client=client,
        collection_name="dementia_chunks",
        embedding_function=OpenAIEmbeddings(openai_api_key=openai_api_key)
    )
    print("ChromaDB 연결 성공")
except Exception as e:
    print(f"ChromaDB 연결 실패: {e}")
    print("ChromaDB 없이 서비스가 시작됩니다.")

def chat_with_ai(report_id: int, chat_id: int, message: str, db: Session) -> str:
    # 1. 사용자 메시지 저장 및 턴 수 계산
    save_chat_log(db, chat_id=chat_id, role=RoleEnum.user, text=message)
    db.flush()
    turn_count = db.query(ChatLog).filter(ChatLog.chat_id == chat_id, ChatLog.role == RoleEnum.user).count()

    response = ""
    llm = ChatOpenAI(model="gpt-4", temperature=0.1, openai_api_key=openai_api_key)

    #  작별 인사
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

    # 일반 대화
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

4. **간결함 유지**: 항상 한두 문장 이내로 짧고 자연스럽게 말하세요.

5. **자연스러운 대화 흐름**:
    - 다음과 같은 표현이 나오면 즉시 주제를 바꾸세요: "모르겠어", "기억 안 나", "딱히", "글쎄", "그냥 그랬어", "생각 안 나", "말하고 싶지 않아", "할 말 없어"

6. **전문 용어 금지**: '검사', '진단', '문진', '점수', '소견' 같은 단어는 쓰지 마세요.

7. **어조**: 따뜻하고 존중하는 어조를 사용하세요.

8. **종료 조건**: '그만', '끝', '이제 됐어' 등의 표현이 나오면 대화를 마무리하세요.

9. **직전 발화 반영**: 항상 직전 사용자 말에 반응하세요. 이전 질문을 무시하고 다음 질문을 하지 마세요.

10. **초기 인사 멘트는 turn 1에서만 출력됩니다.**

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

        # 🔍 ChromaDB에서 context 검색 (예외처리 포함)
        docs = []
        if vectordb is not None:
            try:
                retriever = vectordb.as_retriever()
                docs = retriever.get_relevant_documents(message)
                
                print("\n===== 검색된 논문 Context 일부 =====")
                for i, doc in enumerate(docs[:3]):
                    print(f"[{i+1}] {doc.page_content[:300]}...\n")
                print("====================================\n")
            except Exception as e:
                print(f"ChromaDB 검색 실패: {e}")
                docs = []
        else:
            print("ChromaDB가 연결되지 않아 검색을 건너뜁니다.")

        # 🔍 실제 프롬프트 주입 확인
        context_content = "\n\n".join([d.page_content for d in docs]) if docs else "참고할 수 있는 논문 데이터가 없습니다."
        formatted = prompt.format(
            context=context_content,
            chat_history="(예시 대화)",
            question=message
        )
        print("\n===== 실제 GPT에 전달될 프롬프트 (앞 1000자) =====")
        print(formatted[:1000])
        print("==================================================\n")

        # ChromaDB가 없으면 일반 LLM 체인 사용
        if vectordb is not None:
            try:
                chain = ConversationalRetrievalChain.from_llm(
                    llm=llm,
                    retriever=vectordb.as_retriever(),
                    memory=memory,
                    combine_docs_chain_kwargs={"prompt": prompt}
                )
                ai_response = chain.run(message)
            except Exception as e:
                print(f"ChromaDB 체인 실행 실패: {e}")
                # 일반 LLM으로 대체
                chain = prompt | llm
                ai_response = chain.invoke({
                    "context": context_content,
                    "chat_history": "(예시 대화)",
                    "question": message
                }).content
        else:
            # ChromaDB가 없으면 일반 LLM 체인 사용
            chain = prompt | llm
            ai_response = chain.invoke({
                "context": context_content,
                "chat_history": "(예시 대화)",
                "question": message
            }).content

        if turn_count == 1:
            intro = "안녕하세요. 지금부터 대화를 시작하겠습니다. 보다 정확한 이해를 위해, 단답형보다는 완전한 문장으로 답변해주시면 감사하겠습니다.\n\n"
            response = intro + ai_response
        else:
            response = ai_response

    else:
        response = "이미 대화가 종료되었습니다. 아래 종료 버튼을 눌러 평가를 완료해주세요."

    # 2. AI 응답 저장
    save_chat_log(db, chat_id=chat_id, role=RoleEnum.ai, text=response)
    return response

# app/chat/service.py

def get_chat_logs_by_report_id(db: Session, report_id: int) -> list[ChatLogResponse]:
    chat = db.query(Chat).filter(Chat.report_id == report_id).first()
    if not chat:
        return []  # 채팅이 존재하지 않으면 빈 리스트 반환

    logs = (
        db.query(ChatLog)
        .filter(ChatLog.chat_id == chat.chat_id)
        .order_by(ChatLog.updated_at.asc())
        .all()
    )
    return [ChatLogResponse.from_orm(log) for log in logs]

def get_chat_logs(db: Session, chat_id: int) -> list[ChatLogResponse]:
    logs = (
        db.query(ChatLog)
        .filter(ChatLog.chat_id == chat_id)
        .order_by(ChatLog.updated_at.asc())  # updated_at 기준 오름차순
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

    llm = ChatOpenAI(model="gpt-4", temperature=0, openai_api_key=openai_api_key)
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
