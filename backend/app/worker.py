from celery import Celery
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from fastapi import FastAPI
from fastapi.responses import Response
import time
import logging
from typing import Dict, Any
import os
import newrelic.agent

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# New Relic 초기화
newrelic.agent.initialize('newrelic.ini')

# Celery 앱 설정
celery_app = Celery(
    "app",
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
    task_track_started=True,
    task_time_limit=30 * 60,  # 30분
    task_soft_time_limit=25 * 60,  # 25분
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

# Prometheus 메트릭 정의
task_counter = Counter('celery_tasks_total', 'Total number of Celery tasks', ['task_name', 'status'])
task_duration = Histogram('celery_task_duration_seconds', 'Celery task duration in seconds', ['task_name'])
task_queue_size = Counter('celery_queue_size', 'Number of tasks in queue', ['queue_name'])

# FastAPI 앱 생성 (메트릭 엔드포인트용)
app = FastAPI()

@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "celery-worker"}

# Celery 태스크 모니터링 데코레이터
def monitor_task(func):
    def wrapper(*args, **kwargs):
        start_time = time.time()
        task_name = func.__name__
        
        try:
            logger.info(f"Starting task: {task_name}")
            result = func(*args, **kwargs)
            task_counter.labels(task_name=task_name, status='success').inc()
            logger.info(f"Task {task_name} completed successfully")
            return result
        except Exception as e:
            task_counter.labels(task_name=task_name, status='error').inc()
            logger.error(f"Task {task_name} failed: {str(e)}")
            raise
        finally:
            duration = time.time() - start_time
            task_duration.labels(task_name=task_name).observe(duration)
            logger.info(f"Task {task_name} took {duration:.2f} seconds")
    
    return wrapper

# 실제 비즈니스 로직 태스크들

@celery_app.task(bind=True)
@monitor_task
def process_chat_message(self, message_data: Dict[str, Any]) -> Dict[str, Any]:
    """채팅 메시지 처리 태스크"""
    try:
        # 메시지 처리 로직
        logger.info(f"Processing chat message: {message_data.get('message_id', 'unknown')}")
        
        # 실제 처리 로직 (예시)
        processed_result = {
            "message_id": message_data.get("message_id"),
            "status": "processed",
            "response": "Message processed successfully"
        }
        
        return processed_result
    except Exception as e:
        logger.error(f"Error processing chat message: {e}")
        raise

@celery_app.task(bind=True)
@monitor_task
def generate_report(self, report_data: Dict[str, Any]) -> Dict[str, Any]:
    """리포트 생성 태스크"""
    try:
        logger.info(f"Generating report: {report_data.get('report_id', 'unknown')}")
        
        # 리포트 생성 로직 (예시)
        report_result = {
            "report_id": report_data.get("report_id"),
            "status": "generated",
            "file_path": f"/reports/{report_data.get('report_id')}.pdf"
        }
        
        return report_result
    except Exception as e:
        logger.error(f"Error generating report: {e}")
        raise

@celery_app.task(bind=True)
@monitor_task
def process_drawing(self, drawing_data: Dict[str, Any]) -> Dict[str, Any]:
    """그림 처리 태스크"""
    try:
        logger.info(f"Processing drawing: {drawing_data.get('drawing_id', 'unknown')}")
        
        # 그림 처리 로직 (예시)
        drawing_result = {
            "drawing_id": drawing_data.get("drawing_id"),
            "status": "processed",
            "analysis_result": "Drawing analysis completed"
        }
        
        return drawing_result
    except Exception as e:
        logger.error(f"Error processing drawing: {e}")
        raise

@celery_app.task(bind=True)
@monitor_task
def send_notification(self, notification_data: Dict[str, Any]) -> Dict[str, Any]:
    """알림 발송 태스크"""
    try:
        logger.info(f"Sending notification: {notification_data.get('notification_id', 'unknown')}")
        
        # 알림 발송 로직 (예시)
        notification_result = {
            "notification_id": notification_data.get("notification_id"),
            "status": "sent",
            "recipient": notification_data.get("recipient")
        }
        
        return notification_result
    except Exception as e:
        logger.error(f"Error sending notification: {e}")
        raise

@celery_app.task(bind=True)
@monitor_task
def cleanup_old_data(self, cleanup_config: Dict[str, Any]) -> Dict[str, Any]:
    """오래된 데이터 정리 태스크"""
    try:
        logger.info("Starting cleanup of old data")
        
        # 데이터 정리 로직 (예시)
        cleanup_result = {
            "status": "completed",
            "deleted_records": 100,
            "freed_space": "50MB"
        }
        
        return cleanup_result
    except Exception as e:
        logger.error(f"Error during cleanup: {e}")
        raise

# 태스크 라우팅 설정
celery_app.conf.task_routes = {
    'app.worker.process_chat_message': {'queue': 'chat'},
    'app.worker.generate_report': {'queue': 'reports'},
    'app.worker.process_drawing': {'queue': 'drawings'},
    'app.worker.send_notification': {'queue': 'notifications'},
    'app.worker.cleanup_old_data': {'queue': 'maintenance'},
}

# 태스크 등록
__all__ = [
    'celery_app',
    'process_chat_message',
    'generate_report', 
    'process_drawing',
    'send_notification',
    'cleanup_old_data'
]

# FastAPI 서버 실행 (메트릭 엔드포인트용)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 