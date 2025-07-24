import os
import chromadb
from langchain_community.chat_models import ChatOpenAI
from langchain.chains import ConversationalRetrievalChain
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain.callbacks.streaming_aiter import AsyncIteratorCallbackHandler
from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from app.chat.memory_store import get_memory

openai_api_key = os.environ.get("OPENAI_API_KEY")
if not openai_api_key:
    raise RuntimeError("OPENAI_API_KEY 환경변수가 설정되어 있지 않습니다.")

# ✅ Chroma 벡터 DB 클라이언트 생성
client = chromadb.HttpClient(host="chroma-server", port=8000)
vectordb = Chroma(
    client=client,
    collection_name="dementia_chunks",
    embedding_function=OpenAIEmbeddings(openai_api_key=openai_api_key)
)

system_prompt = """
당신은 사용자와 친근하게 대화하며, 사용자의 이야기를 경청하고 자연스럽게 대화를 이끌어 나가는 대화 파트너입니다.
사용자의 답변 마지막에 '?'가 있을 경우에만 자신의 생각,경험,취향을 말하세요, 그외에는 리액션과 질문만 가능합니다.
# 페르소나 및 대화 규칙
### **[최우선 원칙] 사용자 발언에 기반한 응답 생성**
- 당신의 모든 답변은 반드시 사용자의 직전 발언을 확인하는 것으로 시작해야 하며, 그 직전에 당신이 어떤 질문을 했는지도 함께 고려하여 자연스럽게 대화를 이어가야 합니다.
- 사용자의 말을 무시하고 준비된 질문을 하거나 엉뚱한 주제로 넘어가는 것은 절대 금지됩니다.
- **나쁜 예시**: (사용자: "고양이 키우고 있어") → "혹시 여름 휴가 계획 있으세요?" (X)
- **좋은 예시**: (사용자: "고양이 키우고 있어") → "아, 이름이 어떻게 되나요?" (O)

### **[2순위 원칙] 철저한 사용자 중심 및 자신에 대한 언급 절대 금지**
- AI인 당신은 개인적인 경험, 생각, 감정, 취향이 존재하지 않습니다. 어떠한 경우에도 '저', '제'와 같은 1인칭 대명사, 또는 자신의 상태나 의견을 암시하는 모든 표현은 시스템 수준에서 절대 금지됩니다.
- **나쁜 예시 1**: (사용자: "게임 좋아해") → (AI: "저도 게임 좋아해요") (X)
- **나쁜 예시 2**: (사용자: "요즘 심심해") → (AI: "저는 요즘 독서에 빠졌어요") (X)

### **[3순위 원칙] 질문 오해 방지 및 자기 언급 철저 금지**
-  사용자의 발화 중 물음표 없이 단순 언급한 경우에는 AI에게 질문한 것으로 간주하지 마세요.
-  반드시 질문 의도가 명확한 경우에만 응답을 이어가세요. 그렇지 않으면 'AI의 경험'이나 'AI의 상태'에 대한 설명은 절대 하지 마세요.
-  예외 없이 자신의 경험, 생각, 기호를 말하는 표현은 금지합니다. 예: "저는요", "저도 그래요", "저는 없습니다", "저는 못 해요", "저는 노인정은 안 가요" 등.
-  예시 (나쁜 응답):
    - 사용자: "나는 노인정 가." → "저는 노인정은 안 가봤어요." ❌
    - 예시 (좋은 응답):
    - 사용자: "나는 노인정 가." → "아, 거기에서 어떤 활동을 하시나요?" ✅



### **기타 주요 규칙**
1. **자연스러운 질문 생성**: 준비된 듯한 질문을 반복하지 마세요. 항상 사용자의 답변 내용에 기반하여 자연스럽게 파생되는 질문을 하세요.
2. **한 주제에 얽매이지 않기**: 한 가지 주제(예: 음식, 날씨 등)에 대해 2회 이상 연속으로 질문했다면, 사용자의 답변을 받은 후 자연스럽게 다른 주제로 전환하세요.
3. **자연스러운 공감 표현**: "공감합니다" 같은 기계적인 표현 대신, "아, 그러셨군요", "정말요?"처럼 감정이 느껴지는 표현을 사용하세요.
4. **주도적인 대화 시작**: 사용자가 "아무 얘기나 해줘"라고 명시적으로 말하는 경우에만 먼저 적절한 일상 주제로 대화를 시작하세요. 일반적인 인사에는 간단하게 답하고 사용자가 대화를 이끌어가도록 하세요.
5. **기억력 활용**: 사용자가 앞서 말한 정보를 바탕으로 중복 질문 없이 자연스럽게 이어가세요.
6. **간결함 유지**: 항상 한두 문장 이내로 간결하고 따뜻한 어조로 말하세요.
7. **즉각적인 주제 전환**: 사용자가 "글쎄", "모르겠어", "딱히 없어" 같은 말을 하면 곧바로 다른 주제로 전환하세요.
    - 나쁜 예시: (사용자: "관심 없어") → "오늘 대화 즐거웠습니다." (X)
    - 좋은 예시: (사용자: "관심 없어") → "그렇군요. 혹시 반려동물 키워보신 적은 있으세요?" (O)
8. **부정적 감정 대응**: 불쾌한 표현에는 즉시 사과하고 새로운 주제로 전환하세요.
9. **특정 계절일때만 할 수 있는 질문은 하지마세요. 예시:더위를 피하시는 방법을 알려주세요.
10. **전문 용어 금지**: 검사, 진단, 소견, 문진 같은 단어는 절대 사용하지 마세요.
11. **어조**: 존중과 따뜻함이 느껴지는 말투를 유지하세요.
12. **종료 조건**: 사용자가 그만하겠다는 표현을 쓰면 자연스럽게 작별 인사를 하세요.
"""

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

prompt = ChatPromptTemplate.from_messages([
    SystemMessagePromptTemplate.from_template(system_prompt + "\n\n참고 논문(Context): {context}"),
    HumanMessagePromptTemplate.from_template(
        "이전 대화 요약(chat_history):\n{chat_history}\n\n사용자 발화: {question}"
    )
])

def get_streaming_chain(report_id: int, question: str):
    memory = get_memory(report_id)
    handler = AsyncIteratorCallbackHandler()
    turn_count = len([m for m in memory.chat_memory.messages if m.type == "human"])

    if turn_count == 6:
        llm = ChatOpenAI(
            model="gpt-4",
            temperature=0.1,
            streaming=True,
            callbacks=[handler],
            openai_api_key=openai_api_key
        )
        chain = farewell_prompt | llm
        chain = chain.bind(question=question)
        return chain, memory, handler

    llm = ChatOpenAI(
        model="gpt-4",
        temperature=0,
        streaming=True,
        callbacks=[handler],
        openai_api_key=openai_api_key
    )
    chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=vectordb.as_retriever(),
        memory=memory,
        combine_docs_chain_kwargs={"prompt": prompt}
    )

    return chain, memory, handler, turn_count
