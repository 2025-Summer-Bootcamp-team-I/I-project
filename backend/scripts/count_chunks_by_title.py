# scripts/count_chunks_by_title.py

import chromadb
from collections import defaultdict
import os

os.environ["CHROMA_SERVER_HOST"] = "localhost"
os.environ["CHROMA_SERVER_HTTP_PORT"] = "8002"

def count_chunks_grouped_by_title():
    client = chromadb.HttpClient(host="localhost", port=8002)
    collection = client.get_collection(name="dementia_chunks")
    result = collection.get(include=["metadatas"])

    counts = defaultdict(int)
    for metadata in result["metadatas"]:
        # metadata는 dict 형태라고 가정
        source = metadata.get("source", "알 수 없음")
        counts[source] += 1

    print(f"총 논문 수: {len(counts)}\n")
    print("논문별 chunk 개수:")
    for source, count in sorted(counts.items(), key=lambda x: -x[1]):
        print(f"- {source}: {count} chunks")

if __name__ == "__main__":
    count_chunks_grouped_by_title()
