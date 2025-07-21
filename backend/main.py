from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator
from app.rag.api import router as rag_router  # ← 이 줄 추가
from app.chat.api import router as chat_router

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI!"}

#라우터 등록
app.include_router(rag_router)
app.include_router(chat_router)

#Prometheus 연동
Instrumentator().instrument(app).expose(app)

# --- 테이블 자동 생성 코드 추가 (서버 시작 시 1회) ---
from app.database import Base, engine

Base.metadata.create_all(bind=engine)
