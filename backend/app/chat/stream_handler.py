# app/chat/stream_handler.py
import os
from langchain_community.chat_models import ChatOpenAI
from langchain.chains import ConversationalRetrievalChain
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain.callbacks.streaming_aiter import AsyncIteratorCallbackHandler
from app.chat.memory_store import get_memory
from langchain_community.vectorstores import Chroma
import chromadb

openai_api_key = os.environ.get("OPENAI_API_KEY")
if not openai_api_key:
    raise RuntimeError("OPENAI_API_KEY 환경변수가 설정되어 있지 않습니다.")

def get_streaming_chain(report_id: int):
    # Memory 기반 대화 유지
    memory = get_memory(report_id)

    # 스트리밍 콜백 핸들러
    handler = AsyncIteratorCallbackHandler()

    # 벡터 DB (chroma)
    client = chromadb.HttpClient(host="chroma-server", port=8000)
    vectordb = Chroma(
        client=client,
        collection_name="dementia_chunks",    # 반드시 임베딩 컬렉션명과 일치
        embedding_function=OpenAIEmbeddings(openai_api_key=openai_api_key)
    )

    # LangChain 체인
    chain = ConversationalRetrievalChain.from_llm(
        llm=ChatOpenAI(model="gpt-4", temperature=0, streaming=True, callbacks=[handler], openai_api_key=openai_api_key),
        retriever=vectordb.as_retriever(),
        memory=memory,
    )

    return chain, memory, handler
