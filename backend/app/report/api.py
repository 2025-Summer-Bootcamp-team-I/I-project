from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from . import schemas, service
from app.auth.utils import get_current_user
from app.auth import models as auth_models

router = APIRouter()

@router.post("/reports/empty", response_model=schemas.SimpleReportResponse)
def create_empty_report(db: Session = Depends(get_db), current_user: auth_models.User = Depends(get_current_user)):
    new_report = service.create_empty_report_service(db, current_user.id)
    return new_report
