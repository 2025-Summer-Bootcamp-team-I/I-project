from fastapi import FastAPI
from app.auth import models
from app import database
from app.auth import api
from app.report import api as report_api
from app.trans import stt as stt_api
from app.ad8 import api as ad8_api

# DB 테이블 생성
models.Base.metadata.create_all(bind=database.engine)

# FastAPI 인스턴스
app = FastAPI(
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# 라우터 등록
app.include_router(api.router, prefix="/user", tags=["User"])
app.include_router(report_api.router, prefix="/reports", tags=["Report"])
app.include_router(stt_api.router, prefix="/api", tags=["STT"])
app.include_router(ad8_api.router, tags=["AD8"])

@app.get("/")
def root():
    return {"msg": "API 서버는 현재 작동 중입니다!"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
