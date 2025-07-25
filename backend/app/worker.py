from celery import Celery
from fastapi import FastAPI
import os
from dotenv import load_dotenv
from prometheus_fastapi_instrumentator import Instrumentator

load_dotenv()

# FastAPI 앱 생성
app = FastAPI()

# Celery 앱 생성
celery_app = Celery(
    "worker",
    broker=os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://redis:6379/0")
)

# Celery 설정
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Asia/Seoul',
    enable_utc=True,
)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Prometheus 메트릭 설정
Instrumentator().instrument(app).expose(app)

# 예시 Celery 태스크
@celery_app.task
def example_task():
    return "Task completed successfully" 