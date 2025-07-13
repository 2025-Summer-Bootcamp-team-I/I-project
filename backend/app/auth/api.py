from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.auth.schemas import UserCreate, UserLogin, TokenResponse, Message
from app.auth.service import signup_user, login_user
from app.database import get_db

router = APIRouter()

@router.post("/signup", response_model=Message)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    return signup_user(db, user)

@router.post("/login", response_model=TokenResponse)
def login(user: UserLogin, db: Session = Depends(get_db)):
    return login_user(db, user)