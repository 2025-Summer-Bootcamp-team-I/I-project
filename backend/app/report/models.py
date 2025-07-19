from sqlalchemy import Column, Integer, Text, ForeignKey, BigInteger
from sqlalchemy.orm import relationship
from app.database import Base
from app.auth.models import User

class Report(Base):
    __tablename__ = "reports"  # 테이블명 소문자 복수형으로 통일

    report_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    drawingtest_result = Column(Text, nullable=False, default="")
    chat_result = Column(Text, nullable=False, default="")
    ad8test_result = Column(Text, nullable=False, default="")
    soundtest_result = Column(Text, nullable=False, default="")
    final_result = Column(Text, nullable=False, default="")  # 최종 소견 추가
    recommendation = Column(Text, nullable=False, default="")

    total_score = Column(Integer, nullable=False, default=0)
    sound_score = Column(Integer, nullable=False, default=0)
    ad8_score = Column(Integer, nullable=False, default=0)
    drawing_score = Column(Integer, nullable=False, default=0)
    text_score = Column(Integer, nullable=False, default=0)
    memory_score = Column(Integer, nullable=False, default=0)
    time_space_score = Column(Integer, nullable=False, default=0)
    judgment_score = Column(Integer, nullable=False, default=0)
    visual_score = Column(Integer, nullable=False, default=0)
    language_score = Column(Integer, nullable=False, default=0)

    user = relationship("User", back_populates="reports")