# app/chat/stream_handler.py

import os
import chromadb
from langchain_community.chat_models import ChatOpenAI
from langchain.chains import ConversationalRetrievalChain
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain.callbacks.streaming_aiter import AsyncIteratorCallbackHandler
from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate

from app.chat.memory_store import get_memory

# 환경변수에서 OpenAI 키 로드
openai_api_key = os.environ.get("OPENAI_API_KEY")
if not openai_api_key:
    raise RuntimeError("OPENAI_API_KEY 환경변수가 설정되어 있지 않습니다.")

# Chroma 벡터 DB 클라이언트 생성
client = chromadb.HttpClient(host="chroma-server", port=8000)
vectordb = Chroma(
    client=client,
    collection_name="dementia_chunks",
    embedding_function=OpenAIEmbeddings(openai_api_key=openai_api_key)
)

# 프롬프트 템플릿 정의 (chat_with_ai와 동일하게)
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

# 스트리밍 처리용 체인 생성 함수
def get_streaming_chain(report_id: int):
    memory = get_memory(report_id)
    handler = AsyncIteratorCallbackHandler()

    chain = ConversationalRetrievalChain.from_llm(
        llm=ChatOpenAI(
            model="gpt-4",
            temperature=0,
            streaming=True,
            callbacks=[handler],
            openai_api_key=openai_api_key
        ),
        retriever=vectordb.as_retriever(),
        memory=memory,
        combine_docs_chain_kwargs={"prompt": prompt}  # ✅ 프롬프트 적용
    )

    return chain, memory, handler
