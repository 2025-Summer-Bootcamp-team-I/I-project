from fastapi import FastAPI
from app.auth import models as auth_models
from app import database
from app.auth import api as auth_api
from app.ad8 import router as ad8_router
from app.ad8 import models as ad8_models

# DB 테이블 생성
auth_models.Base.metadata.create_all(bind=database.engine)
ad8_models.Base.metadata.create_all(bind=database.engine)

# FastAPI 인스턴스
app = FastAPI()

# 라우터 등록
app.include_router(auth_api.router, prefix="/user", tags=["User"])
app.include_router(ad8_router, prefix="/ad8", tags=["AD8"])

@app.get("/")
def root():
    return {"msg": "API 서버는 현재 작동 중입니다!"}