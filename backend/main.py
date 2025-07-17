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

# DB 테이블 생성 (모든 모델 import 후에 실행!)
models.Base.metadata.create_all(bind=database.engine)

# FastAPI 인스턴스
app = FastAPI(
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           # 실제 운영 환경에서는 프론트 도메인만 허용 권장
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 정적 파일 제공 (이미지, 첨부파일 등)
app.mount("/static", StaticFiles(directory="static"), name="static")

# 전역 예외 처리
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.error(f"Global error occurred: {exc}")
    logging.error(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "traceback": traceback.format_exc()}
    )

# 라우터 등록
app.include_router(user_api.router, prefix="/user", tags=["User"])
app.include_router(report_api.router)
app.include_router(stt_api.router, prefix="/api", tags=["STT"])
app.include_router(drawing_api.router, prefix="/drawing", tags=["Drawing"])
app.include_router(ad8_api.router, prefix="/ad8", tags=["AD8"])

@app.get("/")
def root():
    return {"msg": "API 서버는 현재 작동 중입니다!"}

# (로컬에서 uvicorn 단독 실행 시)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
