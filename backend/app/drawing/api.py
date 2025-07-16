    # app/drawing/api.py
from fastapi import APIRouter, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
from app.database import get_db  # ← DB 세션 함수 import!
from . import schemas, service, crud
import json

router = APIRouter()

@router.post("/", response_model=schemas.DrawingResult)
async def upload_drawing(
        reportId: int = Form(...),
        responses: str = Form(...),
        file: UploadFile = File(...),
        db: Session = Depends(get_db)  # ★ 이 줄 추가!
    ):
        responses = json.loads(responses)
        # service나 crud에 db 세션 넘겨줌
        result = await service.handle_upload(file, reportId, responses, db)
        return result