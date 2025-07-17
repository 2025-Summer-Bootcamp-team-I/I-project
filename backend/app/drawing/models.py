from sqlalchemy import Column, BigInteger, String, Integer, ForeignKey
from ..database import Base

class DrawingTest(Base):
    __tablename__ = "drawing_tests"

    drawing_id = Column(BigInteger, primary_key=True, index=True)
    report_id = Column(BigInteger, ForeignKey("reports.report_id"), index=True)  # reports 테이블 참조로 수정
    image_url = Column(String(255))
    risk_score = Column(Integer)

