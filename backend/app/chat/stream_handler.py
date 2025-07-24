# app/chat/stream_handler.py

import os
import chromadb
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import ConversationalRetrievalChain
from langchain_community.vectorstores import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from app.chat.memory_store import get_memory
from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate, PromptTemplate


# ✅ 환경변수에서 OpenAI 키 로드
google_api_key = os.environ.get("GOOGLE_API_KEY")
if not google_api_key:
    raise RuntimeError("GOOGLE_API_KEY 환경변수가 설정되어 있지 않습니다.")

# ✅ Chroma 벡터 DB 클라이언트 생성
client = chromadb.HttpClient(host="chroma-server", port=8000)
vectordb = Chroma(
    client=client,
    collection_name="dementia_chunks",
    embedding_function=GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=google_api_key)
)

# ✅ 대화용 system prompt (수정된 문장 포함)
system_prompt = """
당신은 사용자와 친근하게 대화하며, 사용자의 이야기를 경청하고 자연스럽게 대화를 이끌어 나가는 대화 파트너입니다.
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
1. **한 주제에 얽매이지 않기**: 한 가지 주제(예: 음식, 날씨 등)에 대해 2회 이상 연속으로 질문했다면, 사용자의 답변을 받은 후 자연스럽게 다른 주제로 전환하세요.
2. **자연스러운 공감 표현**: "공감합니다" 같은 기계적인 표현 대신, "아, 그러셨군요", "정말요?"처럼 감정이 느껴지는 표현을 사용하세요.
3. **주도적인 대화 시작**: 사용자가 "아무 얘기나 해줘"라고 명시적으로 말하는 경우에만 먼저 적절한 일상 주제로 대화를 시작하세요. 일반적인 인사에는 간단하게 답하고 사용자가 대화를 이끌어가도록 하세요.
4. **기억력 활용**: 사용자가 앞서 말한 정보를 바탕으로 중복 질문 없이 자연스럽게 이어가세요.
5. **간결함 유지**: 항상 한두 문장 이내로 간결하고 따뜻한 어조로 말하세요.
6. **즉각적인 주제 전환**: 사용자가 "글쎄", "모르겠어", "딱히 없어" 같은 말을 하면 곧바로 다른 주제로 전환하세요.
7. **부정적 감정 대응**: 불쾌한 표현에는 즉시 사과하고 새로운 주제로 전환하세요.
8. **특정 계절일때만 할 수 있는 질문은 하지마세요. 예시:더위를 피하시는 방법을 알려주세요.
9. **전문 용어 금지**: 검사, 진단, 소견, 문진 같은 단어는 절대 사용하지 마세요.
10. **어조**: 존중과 따뜻함이 느껴지는 말투를 유지하세요.
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
def get_streaming_chain(report_id: int):
    memory = get_memory(report_id)
    handler = AsyncIteratorCallbackHandler()


    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-pro-latest",
        temperature=0.1,
        streaming=True,
        google_api_key=google_api_key,
        convert_system_message_to_human=True,
    )
    chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=vectordb.as_retriever(),
        memory=memory,
        combine_docs_chain_kwargs={"prompt": prompt},
    )

    return chain, memory, handler
