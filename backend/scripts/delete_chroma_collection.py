# scripts/delete_chroma_collection.py

import chromadb
from chromadb.config import Settings

def delete_collection():
    client = chromadb.HttpClient(
        host="localhost",
        port=8002,
        settings=Settings(
            chroma_api_impl="rest",
            chroma_server_host="localhost",
            chroma_server_http_port=8002  # ← 포트까지 명시!
        )
    )
    client.delete_collection(name="dementia_chunks")
    print("컬렉션 삭제 완료.")

if __name__ == "__main__":
    delete_collection()
