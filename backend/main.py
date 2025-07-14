from fastapi import FastAPI
from app.auth import models
from app import database
from app.auth import api

# DB 테이블 생성
models.Base.metadata.create_all(bind=database.engine)

# FastAPI 인스턴스
app = FastAPI()

# 라우터 등록
app.include_router(api.router, prefix="/user", tags=["User"])

@app.get("/")
def root():
    return {"msg": "API 서버는 현재 작동 중입니다!"}