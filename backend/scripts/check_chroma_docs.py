# app/scripts/check_chroma_docs.py

import chromadb
import os

os.environ["CHROMA_SERVER_HOST"] = "localhost"
os.environ["CHROMA_SERVER_HTTP_PORT"] = "8002"
def check_chroma_documents():
    client = chromadb.HttpClient(host="localhost", port=8002)
    collection = client.get_collection(name="dementia_chunks")
    docs = collection.get(include=["documents", "metadatas"])

    print(f"총 문서 수 (chunks): {len(docs['documents'])}")
    for i in range(min(10, len(docs["documents"]))):
        print(f"\n[문서 {i + 1}]")
        print(docs["documents"][i][:300])  # 앞 300자만 출력

if __name__ == "__main__":
    check_chroma_documents()
