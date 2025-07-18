from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from . import schemas, service

router = APIRouter()

@router.post(
    "/ad8",
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
def submit_ad8(data: schemas.AD8Request, db: Session = Depends(get_db)):
    if not data.responses:
        raise HTTPException(status_code=400, detail="responses는 최소 1개 이상의 응답을 포함해야 합니다.")
    
    return service.process_ad8_test(db=db, data=data)
