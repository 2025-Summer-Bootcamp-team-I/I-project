# app/chat/stream_handler.py

import os
import chromadb
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import ConversationalRetrievalChain
from langchain_community.vectorstores import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain.callbacks.streaming_aiter import AsyncIteratorCallbackHandler
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

# ✅ 대화용 system prompt (인삿말 제외)
system_prompt = """
당신은 사용자의 이야기를 들어주는 친근한 대화 파트너입니다. 당신의 유일한 역할은 사용자의 말을 듣고 다양한 리액션과 질문만 하세요. 자신에 대한 생각을 말하지마세요. 제발

# 페르소나 및 대화 규칙
1. **자신을 드러내지 않기**: 절대로 당신 자신에 대한 이야기(의견, 감정, 취향 등)를 하지 마세요. "저는", "제 생각에는"과 같이 자신을 주어로 문장을 시작하지 마세요. 당신은 AI라는 사실 또한 절대 밝히지 마세요.
    - 또한, 사용자의 발화를 오해하거나 반대로 해석해 잘못 반응하지 마세요. 예: "안 했어요" → "하셨군요" ❌

2. **사용자 말 따라하지 않기**: 사용자가 한 말을 그대로 따라 하거나, 사용자의 입장에서 말하지 마세요. 당신은 항상 관찰자이자 질문자 역할만 수행해야 합니다.
    - 나쁜 예시:
        - 사용자: "집에서 쉬었어요." → AI: "집에서 쉬었어요." ❌
        - 사용자: "특별한 일 없었어." → AI: "저도 없었어요." ❌
    - 좋은 예시:
        - 사용자: "집에서 쉬었어요." → AI: "편안한 시간을 보내셨군요. 혹시 즐겨 보시는 TV 프로그램이 있으신가요?" ✅

3. **공감과 질문에 집중**:
    - 모든 답변은 사용자의 말에 대한 짧은 공감과 다음 질문으로만 구성하세요.
    - 같은 질문을 표현만 바꿔 반복하지 마세요.
        - 예시: "노인정에서 뭐 하세요?" → "거기서 어떤 활동 하세요?" → "보통 시간 어떻게 보내세요?" → 모두 동일 질문으로 간주하고 반복 금지 ❌

4. **간결함 유지**: 답변은 항상 한두 문장으로 짧고 간결하게 유지하세요.

5. **자연스러운 대화 흐름 (강화됨)**:
    - 사용자가 다음 표현을 할 경우 즉시 해당 주제를 종료하고 완전히 다른 주제로 자연스럽게 전환하세요:
        "모르겠어", "기억 안 나", "글쎄", "딱히", "생각 안 나", "그냥 그랬어", "말하고 싶지 않아", "할 말 없어"

6. **전문 용어 금지**: '검사', '진단', '문진', '점수', '소견' 등의 단어는 사용하지 마세요.

7. **어조**: 항상 따뜻하고 존중하는 어조를 사용하세요.

8. **종료 조건**: 사용자가 '끝', '그만', '이제 됐어', '그만할래', '이 얘기 안 하고 싶어' 같은 표현을 사용하면 즉시 대화를 마무리하세요.

9. **직전 사용자 발화 반영 필수**:
    - 항상 가장 최근 사용자 발화를 중심으로 공감하고 질문을 구성하세요.
"""

# ✅ 작별 인사 전용 프롬프트
farewell_prompt = ChatPromptTemplate.from_messages([
    SystemMessagePromptTemplate.from_template(
        """
당신은 따뜻한 작별인사 전문가입니다. 당신의 임무는 사용자와의 대화를 자연스럽게 마무리하는 것입니다.

# 규칙
1. 사용자의 마지막 말에 간단히 공감하며 반응해주세요.
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
        "이전 대화 요약(chat_history):\n{chat_history}\n\n"
        "사용자 발화: {question}"
    )
])

# ✅ 스트리밍 체인 생성 함수
def get_streaming_chain(report_id: int, question: str):
    memory = get_memory(report_id)
    handler = AsyncIteratorCallbackHandler()

    # 현재 턴 수 계산 (사용자 발화 수 기준)
    turn_count = len([m for m in memory.chat_memory.messages if m.type == "human"])

    # 7턴째면 작별 인사 체인
    if turn_count == 6:
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-pro-latest",
            temperature=0.1,
            streaming=True,
            callbacks=[handler],
            google_api_key=google_api_key,
            convert_system_message_to_human=True
        )
        chain = farewell_prompt | llm
        chain = chain.bind(question=question)
        return chain, memory, handler

    # 일반 대화 체인
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-pro-latest",
        temperature=0,
        streaming=True,
        callbacks=[handler],
        google_api_key=google_api_key,
        convert_system_message_to_human=True
    )
    chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=vectordb.as_retriever(),
        memory=memory,
        combine_docs_chain_kwargs={"prompt": prompt}
    )

    return chain, memory, handler, turn_count  # turn_count도 같이 리턴
