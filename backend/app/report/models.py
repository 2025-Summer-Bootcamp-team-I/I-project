from sqlalchemy import Column, Integer, Text, ForeignKey, BigInteger, Enum
import enum
from sqlalchemy.orm import relationship
from app.database import Base
from app.auth.models import User

class RiskLevel(enum.Enum):
    GOOD = "양호"
    CAUTION = "경계"
    DANGER = "위험"

class Report(Base):
    __tablename__ = "reports"  # 테이블명 소문자 복수형으로 통일

    report_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    drawingtest_result = Column(Text, nullable=False)
    chat_result = Column(Text, nullable=False)
    ad8test_result = Column(Text, nullable=False)
    final_result = Column(Text, nullable=False)  # 최종 소견 추가
    recommendation = Column(Text, nullable=False)

    total_score = Column(Integer, nullable=False, default=0)
    ad8_score = Column(Integer, nullable=False, default=0)
    drawing_score = Column(Integer, nullable=False, default=0)
    memory_score = Column(Integer, nullable=False, default=0)
    time_space_score = Column(Integer, nullable=False, default=0)
    judgment_score = Column(Integer, nullable=False, default=0)
    visual_score = Column(Integer, nullable=False, default=0)
    language_score = Column(Integer, nullable=False, default=0)

    # 위험도 필드 - RiskLevel enum 사용, NULL 허용 (아직 테스트 안함)
    ad8_risk = Column(Enum(RiskLevel), nullable=True)
    drawing_risk = Column(Enum(RiskLevel), nullable=True)
    chat_risk = Column(Enum(RiskLevel), nullable=True)
    final_risk = Column(Enum(RiskLevel), nullable=True)

    user = relationship("User", back_populates="reports")