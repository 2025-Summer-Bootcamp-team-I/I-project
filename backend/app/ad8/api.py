from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from . import schemas, service
from app.auth.utils import get_current_user
from app.auth.models import User
from app.report.models import Report

router = APIRouter()

@router.post(
    "",
    response_model=schemas.AD8Result,
    status_code=201,
    responses={
        400: {
            "description": "Bad Request",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "responses는 최소 1개 이상의 응답을 포함해야 합니다."
                    }
                }
            }
        }
    }
)
def submit_ad8(
    data: schemas.AD8Request, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not data.responses:
        raise HTTPException(status_code=400, detail="responses는 최소 1개 이상의 응답을 포함해야 합니다.")
    
    # 리포트 소유권 확인
    report = db.query(Report).filter(Report.report_id == data.report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if report.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    return service.process_ad8_test(db=db, data=data)
