# app/chat/stream_handler.py

import os
import chromadb
from datetime import datetime
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import ConversationalRetrievalChain
from langchain_community.vectorstores import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from app.chat.memory_store import get_memory

# ✅ 환경변수에서 Google API 키 로드
google_api_key = os.environ.get("GOOGLE_API_KEY")
if not google_api_key:
    raise RuntimeError("GOOGLE_API_KEY 환경변수가 설정되어 있지 않습니다.")

# ✅ Chroma 벡터 DB 클라이언트 생성
client = chromadb.HttpClient(host="chroma-server", port=8000)
vectordb = Chroma(
    client=client,
    collection_name="dementia_gemini_v1",
    embedding_function=GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=google_api_key)
)

# ✅ 대화용 system prompt
system_prompt = """
당신은 사용자의 이야기를 들어주는 친근한 대화 파트너입니다...
 당신의 유일한 역할은 사용자의 말을 듣고 다양한 리액션과 질문만 하세요. 자신에 대한 생각을 말하지마세요. 제발

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

# ✅ 작별 인사 전용 프롬프트
farewell_prompt = ChatPromptTemplate.from_messages([
    SystemMessagePromptTemplate.from_template(
        """
당신은 따뜻한 작별인사 전문가입니다. 당신의 임무는 사용자와의 대화를 자연스럽게 마무리하는 것입니다.

# 규칙
1. 사용자의 마지막 말에 간단히 공감하며 반응해주세요. (예: "그렇군요.", "알겠습니다.")
2. 새로운 질문은 절대 하지 마세요.
3. 따뜻한 작별 인사를 건네며 대화를 마무리해주세요.
4. 응답의 맨 마지막에는, 다른 말 없이 정확히 ' 아래에 종료 버튼을 눌러주세요 . ' 라는 문구를 추가해야 합니다.
5. 답변은 한두 문장으로 매우 간결하게 유지하세요.

사용자의 마지막 말: {question}
"""
    )
])

# ✅ 일반 대화 prompt
prompt = ChatPromptTemplate.from_messages([
    SystemMessagePromptTemplate.from_template(system_prompt + "\n\n참고 논문(Context): {context}"),
    HumanMessagePromptTemplate.from_template(
        "이전 대화 요약(chat_history):\n{chat_history}\n\n사용자 발화: {question}"
    )
])

def get_streaming_chain(report_id: int, question: str):
    memory = get_memory(report_id)
    today = datetime.now().strftime("%Y년 %m월 %d일")

    messages = memory.chat_memory.messages
    chat_history = []
    for m in messages:
        if m.type == "human":
            chat_history.append(("user", m.content))
        elif m.type == "ai":
            chat_history.append(("ai", m.content))

    turn_count = len([m for m in messages if m.type == "human"])

    # ✅ 마지막 턴: 작별 응답
    if turn_count == 6:
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-pro-latest",
            temperature=0.1,
            streaming=True,
            google_api_key=google_api_key
        )
        chain = farewell_prompt | llm
        chain = chain.bind(question=question)
        return chain, memory

    # ✅ 첫 턴: 고정 인사 멘트 반환
    if turn_count == 0:
        from langchain_core.output_parsers import StrOutputParser
        greeting = (
            "안녕하세요. 지금부터 대화를 시작하겠습니다. 보다 정확한 이해를 위해, 단답형보다는 완전한 문장으로 답변해주시면 감사하겠습니다.\n\n"
            "먼저, 오늘은 무슨 요일인지 말씀해주시겠어요?"
        )
        parser = StrOutputParser()
        return parser | (lambda _: greeting), memory

    # ✅ 일반 대화 흐름
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-pro-latest",
        temperature=0,
        streaming=True,
        google_api_key=google_api_key,
        max_output_tokens=2048,
        top_p=0.8,
        top_k=40
    )
    retriever = vectordb.as_retriever()
    docs = retriever.get_relevant_documents(question)

    system_prompt_filled = system_prompt.format(turn_count=turn_count + 1, today=today)
    full_prompt = ChatPromptTemplate.from_messages([
        SystemMessagePromptTemplate.from_template(system_prompt_filled + "\n\n참고 논문(Context): {context}"),
        HumanMessagePromptTemplate.from_template(
            "이전 대화 요약(chat_history):\n{chat_history}\n\n사용자 발화: {question}"
        )
    ])

    chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=retriever,
        combine_docs_chain_kwargs={"prompt": full_prompt},
        verbose=True
    )

    return chain, chat_history, turn_count
