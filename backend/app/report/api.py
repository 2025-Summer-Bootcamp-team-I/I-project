from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from . import schemas, service, crud
from app.auth.utils import get_current_user
from app.auth.models import User
import logging

router = APIRouter()

@router.post("/reports/empty", response_model=schemas.SimpleReportResponse)
def create_empty_report(
    report: schemas.EmptyReportCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """현재 로그인한 유저를 위한 빈 리포트를 생성합니다."""
    report_data = report.dict()
    
    # Report 객체 생성 - risk 필드들을 기본값으로 설정
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
        # 빈 리포트이므로 NULL로 설정 (아직 테스트하지 않음)
        ad8_risk=None,
        drawing_risk=None,
        chat_risk=None,
        final_risk=None
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    
    # 로그 추가
    print(f"✅ 새 리포트 생성됨: ID={new_report.report_id}, User={current_user.id}")
    logging.info(f"New report created: ID={new_report.report_id}, User={current_user.id}")
    
    # 명시적으로 SimpleReportResponse 형태로 반환
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
    """
    리포트의 상세 정보를 조회합니다.
    - 기본 리포트 정보 (점수, 소견, 위험도 등)
    - Drawing 테스트 이미지 URL
    - AD8 테스트 응답 상세 내역
    """
    report = crud.get_report(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # 자신의 리포트만 조회 가능
    if report.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    return report
