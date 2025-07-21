# app/rag/service.py
import os
import uuid
import chromadb
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings

openai_api_key = os.environ.get("OPENAI_API_KEY")

def embed_pdf_to_chroma(pdf_path: str, chroma_host="chroma-server", chroma_port=8000, collection_name="dementia_chunks"):
    # 1. PDF 로드
    loader = PyPDFLoader(pdf_path)
    docs = loader.load()

    # 2. 텍스트 분할
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    split_docs = splitter.split_documents(docs)

    # 3. 임베딩 생성
    embedding = OpenAIEmbeddings(openai_api_key=openai_api_key)
    texts = [d.page_content for d in split_docs]
    metadatas = [d.metadata for d in split_docs]
    embs = embedding.embed_documents(texts)
    ids = [str(uuid.uuid4()) for _ in split_docs]

    # 4. REST API 모드로 ChromaDB 접속
    client = chromadb.HttpClient(
        host=chroma_host,
        port=chroma_port,
    )

    # 5. 컬렉션 생성 또는 가져오기
    collection = client.get_or_create_collection(name=collection_name)

    # 6. 임베딩 추가
    collection.add(
        documents=texts,
        metadatas=metadatas,
        embeddings=embs,
        ids=ids
    )
    return f"{len(split_docs)} chunks embedded to Chroma REST ({chroma_host}:{chroma_port})"
