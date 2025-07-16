from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging
import traceback
from fastapi.responses import JSONResponse
from app import database
from app.auth import api as user_api  # 기존 main.py의 user 라우터
from app.auth import models as user_models
from app.ad8.api import router as ad8_router
from app.ad8 import models as ad8_models
from app.drawing import api as drawing_api
from app.drawing import models as drawing_models

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# DB 테이블 생성
database.Base.metadata.create_all(bind=database.engine)

# FastAPI 인스턴스
app = FastAPI(
    title="Drawing Analysis API",
    description="시계 그리기 검사 분석 API",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 전역 예외 처리
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global error occurred: {exc}")
    logger.error(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "traceback": traceback.format_exc()}
    )

# 정적 파일 제공
app.mount("/static", StaticFiles(directory="static"), name="static")

# 라우터 등록
app.include_router(user_api.router, prefix="/user", tags=["User"])   # ★ 기존 기능 포함
app.include_router(ad8_router, prefix="/ad8", tags=["AD8"])
app.include_router(drawing_api.router, prefix="/drawing", tags=["drawing"])

@app.get("/")
def root():
    return {"msg": "API 서버는 현재 작동 중입니다!"}
