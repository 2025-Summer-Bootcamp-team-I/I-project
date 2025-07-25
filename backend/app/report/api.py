from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from . import schemas, service, crud
from app.auth.utils import get_current_user
from app.auth.models import User
import logging
from .models import RiskLevel
from .service import determine_final_risk, generate_final_report_with_gpt
from .crud import update_final_result_and_risk

router = APIRouter()

@router.post("/reports/empty", response_model=schemas.SimpleReportResponse)
def create_empty_report(
    report: schemas.EmptyReportCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """현재 로그인한 유저를 위한 빈 리포트를 생성합니다."""
    report_data = report.dict()
    
    from . import models
    new_report = models.Report(
        user_id=current_user.id,
        drawingtest_result=report_data.get("drawingtest_result", ""),
        chat_result=report_data.get("chat_result", ""),
        ad8test_result=report_data.get("ad8test_result", ""),
        final_result=report_data.get("final_result", ""),
        recommendation=report_data.get("recommendation", ""),
        total_score=report_data.get("total_score", 0),
        ad8_score=report_data.get("ad8_score", 0),
        drawing_score=report_data.get("drawing_score", 0),
        memory_score=report_data.get("memory_score", 0),
        time_space_score=report_data.get("time_space_score", 0),
        judgment_score=report_data.get("judgment_score", 0),
        visual_score=report_data.get("visual_score", 0),
        language_score=report_data.get("language_score", 0),
        ad8_risk=None,
        drawing_risk=None,
        chat_risk=None,
        final_risk=None
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    logging.info(f"✅ 새 리포트 생성됨: ID={new_report.report_id}, User={current_user.id}")

    return schemas.SimpleReportResponse(
        report_id=new_report.report_id,
        user_id=new_report.user_id
    )

@router.get("/reports/{report_id}", response_model=schemas.DetailedReportResponse)
def get_report_detail(
    report_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = crud.get_report(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if report.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    return report

@router.put("/reports/{report_id}/finalize", response_model=schemas.DetailedReportResponse)
def finalize_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = crud.get_report(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if report.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Permission denied")

    if not all([report.ad8_risk, report.drawing_risk, report.chat_risk]):
        raise HTTPException(status_code=400, detail="모든 위험도 정보가 있어야 최종 판단이 가능합니다.")

    final_risk = determine_final_risk(report.ad8_risk, report.drawing_risk, report.chat_risk)

    final_result = generate_final_report_with_gpt(
        ad8_score=report.ad8_score,
        drawing_score=report.drawing_score,
        chat_risk=report.chat_risk,
        drawing_risk=report.drawing_risk,
        ad8_risk=report.ad8_risk,
        total_score=report.total_score
    )

    updated = update_final_result_and_risk(db, report_id, final_risk, final_result)
    return updated