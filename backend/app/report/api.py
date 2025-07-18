from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from . import schemas, service

router = APIRouter()

@router.post("/reports/empty", response_model=schemas.SimpleReportResponse)
def create_empty_report(report: schemas.ReportCreate, db: Session = Depends(get_db)):
    new_report = service.create_empty_report_service(db, report)
    return new_report
