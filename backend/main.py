from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import logging
import traceback

from app import database
from app.auth import models
from app.auth import api as user_api
from app.report import api as report_api
from app.trans import stt as stt_api
from app.drawing import api as drawing_api
from app.ad8 import api as ad8_api
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
    # 모든 모델 import된 이후 테이블 생성
    models.Base.metadata.create_all(bind=database.engine)
    print("DB 테이블 생성 완료.")

# FastAPI 앱 생성
app = FastAPI(
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# 앱 시작 시 DB 연결 + 테이블 생성
@app.on_event("startup")
def on_startup():
    connect_to_db()
    create_tables()  # ✅ 이 줄이 복구 포인트야!

# CORS 허용 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 정적 파일 마운트
app.mount("/static", StaticFiles(directory="static"), name="static")

# 전역 예외 처리 핸들러
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.error(f"Global error occurred: {exc}")
    logging.error(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "traceback": traceback.format_exc()}
    )

# 라우터 연결
app.include_router(user_api.router, prefix="/user", tags=["User"])
app.include_router(report_api.router)
app.include_router(stt_api.router, prefix="/api", tags=["STT"])
app.include_router(drawing_api.router, prefix="/drawing", tags=["Drawing"])
app.include_router(ad8_api.router, prefix="/ad8", tags=["AD8"])

# 기본 루트 엔드포인트
@app.get("/")
def root():
    return {"msg": "API 서버는 현재 작동 중입니다!"}

# 로컬 실행 시
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
