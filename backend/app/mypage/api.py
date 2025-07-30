from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.auth.models import User


from app.database import get_db
from app.report.models import Report
from app.mypage.schemas import MyReportSummary
from app.auth.utils import get_current_user

router = APIRouter(
    prefix="/mypage",
    tags=["Mypage"]
)

@router.get("/reports", response_model=List[MyReportSummary])
def get_my_reports(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    로그인한 사용자의 모든 리포트 목록을 반환합니다.
    """
    reports = db.query(Report).filter(Report.user_id == current_user.id).order_by(Report.report_id.desc()).all()
    return reports
