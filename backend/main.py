from fastapi import FastAPI
from app.trans import stt as stt_api  # ← STT 라우터만 연결

app = FastAPI()

# 라우터 등록 (로그인 라우터는 뺌!)
app.include_router(stt_api.router, prefix="/api", tags=["STT"])

@app.get("/")
def root():
    return {"msg": "STT 테스트 서버 작동 중!"}