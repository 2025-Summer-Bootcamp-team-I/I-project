from sqlalchemy import Column, Integer, Text, ForeignKey, Enum, DateTime, func
import enum
from sqlalchemy.orm import relationship
from app.database import Base
from app.auth.models import User

# 위험도 Enum 정의
class RiskLevel(enum.Enum):
    GOOD = "양호"       # 위험도 낮음
    CAUTION = "경계"    # 중간
    DANGER = "위험"     # 위험도 높음

# 리포트 테이블 정의
class Report(Base):
    __tablename__ = "reports"

    report_id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # 검사 결과 텍스트
    drawingtest_result = Column(Text, nullable=False)
    chat_result = Column(Text, nullable=False)
    ad8test_result = Column(Text, nullable=False)
    final_result = Column(Text, nullable=False)  # 최종 소견
    recommendation = Column(Text, nullable=False)  # 추천 멘트

    # 점수들
    total_score = Column(Integer, nullable=False, default=0)
    ad8_score = Column(Integer, nullable=False, default=0)
    drawing_score = Column(Integer, nullable=False, default=0)
    memory_score = Column(Integer, nullable=False, default=0)
    time_space_score = Column(Integer, nullable=False, default=0)
    judgment_score = Column(Integer, nullable=False, default=0)
    visual_score = Column(Integer, nullable=False, default=0)
    language_score = Column(Integer, nullable=False, default=0)

    # 위험도: 각 검사별 + 최종
    ad8_risk = Column(Enum(RiskLevel, native_enum=True), nullable=True)
    drawing_risk = Column(Enum(RiskLevel, native_enum=True), nullable=True)
    chat_risk = Column(Enum(RiskLevel, native_enum=True), nullable=True)
    final_risk = Column(Enum(RiskLevel, native_enum=True), nullable=True)

    # 유저와 연결
    user = relationship("User", back_populates="reports")