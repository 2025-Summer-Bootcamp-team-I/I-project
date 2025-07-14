from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.auth.schemas import TokenResponse, UserCreate, UserLogin, Message
from app.auth.service import signup_user, login_user
from app.database import get_db
from app.auth import models
from app.auth.utils import get_current_user

router = APIRouter()

@router.post("/signup", response_model=Message)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    return signup_user(db, user)

@router.post("/login", response_model=TokenResponse)
def login(user: UserLogin, db: Session = Depends(get_db)):
    return login_user(db, user)

#로그아웃 기능
@router.post("/logout", response_model=Message)
def logout():
    return {"msg": "로그아웃 요청이 수신되었습니다. 클라이언트 측 토큰을 삭제해주세요."}

#탈퇴 기능
@router.delete("/delete", response_model=Message)
def delete_user(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    
    username = user.username  #삭제 전에 이름 저장해두기
    db.delete(user)
    db.commit()
    return {"msg": f"'{username}' 님의 계정이 성공적으로 삭제되었습니다."}