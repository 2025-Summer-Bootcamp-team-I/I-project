# from fastapi import FastAPI
# from prometheus_fastapi_instrumentator import Instrumentator

# app = FastAPI()

# @app.get("/")
# def read_root():
#     return {"message": "Hello from FastAPI!"}


# Instrumentator().instrument(app).expose(app)

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

#테스트용
print("✅ main.py 실행 중")