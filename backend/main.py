from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import logging
import traceback
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from prometheus_fastapi_instrumentator import Instrumentator

# .env 파일 로드
load_dotenv()

from app import database
from app.auth import models
from app.auth import api as auth_api
from app.report import api as report_api
from app.trans import stt as stt_api
from app.ad8 import api as ad8_api
from app.chat import api as chat_api
from app.drawing import api as drawing_api
from app.trans import tts as tts_api
from app.mypage import api as mypage_api
from sqlalchemy.exc import OperationalError
from tenacity import retry, stop_after_attempt, wait_fixed

@retry(
    stop=stop_after_attempt(10),
    wait=wait_fixed(3),
    retry_error_callback=lambda retry_state: print(f"DB 연결 재시도 중... ({retry_state.attempt_number}번째)")
)
def connect_to_db():
    try:
        database.engine.connect()
        print("DB 연결 성공.")
    except OperationalError as e:
        print(f"DB 연결 오류: {e}")
        raise

def create_tables():
    database.create_tables()
    print("DB 테이블 생성 완료.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    connect_to_db()
    create_tables()
    yield

app = FastAPI(
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

# Prometheus 메트릭 설정
Instrumentator().instrument(app).expose(app)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.error(f"Global error occurred: {exc}")
    logging.error(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "traceback": traceback.format_exc()}
    )

# 라우터 등록
app.include_router(auth_api.router, prefix="/user", tags=["User"])
app.include_router(report_api.router)
app.include_router(stt_api.router,tags=["STT"])
app.include_router(tts_api.router, tags=["TTS"])
app.include_router(drawing_api.router, prefix="/drawing", tags=["Drawing"])
app.include_router(ad8_api.router, prefix="/ad8", tags=["AD8"])
app.include_router(chat_api.router, prefix="/chat", tags=["Chat"])
app.include_router(mypage_api.router)


# 기본 루트 엔드포인트
@app.get("/", tags=["Default"])

def root():
    return {"msg": "API 서버는 현재 작동 중입니다!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)