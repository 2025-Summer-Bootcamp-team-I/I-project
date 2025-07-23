# scripts/delete_chroma_collection.py

import argparse
import sys
import chromadb
from chromadb.config import Settings

def delete_collection(collection_name: str):
    print(f"⚠️ WARNING: You are about to delete the collection '{collection_name}'.")
    confirm = input("Are you sure you want to proceed? (y/N): ").strip().lower()
    if confirm != 'y':
        print("❌ Deletion aborted.")
        sys.exit()

    client = chromadb.HttpClient(
        host="localhost",
        port=8002,
        settings=Settings(
            chroma_api_impl="chromadb.api.fastapi.FastAPI",
            chroma_server_host="localhost",
            chroma_server_http_port=8002,
        )
    )
    client.delete_collection(name=collection_name)
    print(f"✅ Collection '{collection_name}' deleted.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Delete a ChromaDB collection.")
    parser.add_argument("collection_name", help="Name of the collection to delete.")
    args = parser.parse_args()
    delete_collection(args.collection_name)
