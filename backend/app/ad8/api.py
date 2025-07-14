from fastapi import APIRouter, HTTPException
from .schemas import AD8Request, AD8Result

router = APIRouter()

@router.post(
    "/ad8",
    response_model=AD8Result,
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
def submit_ad8(data: AD8Request):
    if not data.responses:
        raise HTTPException(status_code=400, detail="responses는 최소 1개 이상의 응답을 포함해야 합니다.")
    
    risk_score = sum(not r.isCorrect for r in data.responses)
    message = "치매 위험이 있습니다." if risk_score >= 2 else "정상 범위입니다."
    return {"risk_score": risk_score, "message": message}
