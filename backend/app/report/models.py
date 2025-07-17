from sqlalchemy import Column, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from app.auth.models import User

class Report(Base):
    __tablename__ = "reports"

    report_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    drawingtest_result = Column(Text, nullable=False, default="")
    chat_result = Column(Text, nullable=False, default="")
    ad8test_result = Column(Text, nullable=False, default="")
    soundtest_result = Column(Text, nullable=False, default="")
    recommendation = Column(Text, nullable=False, default="")
    total_score = Column(Integer, nullable=False, default=0)

    user = relationship("User", back_populates="reports")