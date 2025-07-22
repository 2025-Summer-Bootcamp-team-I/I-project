# app/chat/stream_handler.py

import os
import chromadb
from langchain_community.chat_models import ChatOpenAI
from langchain.chains import ConversationalRetrievalChain
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain.callbacks.streaming_aiter import AsyncIteratorCallbackHandler
from app.chat.memory_store import get_memory

# ✅ 환경변수로부터 API 키 읽기
openai_api_key = os.environ.get("OPENAI_API_KEY")
if not openai_api_key:
    raise RuntimeError("OPENAI_API_KEY 환경변수가 설정되어 있지 않습니다.")

# ✅ Chroma 클라이언트와 벡터스토어 인스턴스는 모듈 상단에서 1회만 생성
client = chromadb.HttpClient(host="chroma-server", port=8000)
vectordb = Chroma(
    client=client,
    collection_name="dementia_chunks",
    embedding_function=OpenAIEmbeddings(openai_api_key=openai_api_key)
)

# ✅ 요청마다 필요한 것만 생성
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
    )

    return chain, memory, handler
