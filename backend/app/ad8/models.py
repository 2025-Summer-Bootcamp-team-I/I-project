from sqlalchemy import Column, Integer, Boolean, ForeignKey, BigInteger
from app.database import Base

class AD8Test(Base):
    __tablename__ = "ad8_test"

    ad8test_id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.report_id"), nullable=False)
    risk_score = Column(Integer, nullable=False)

class AD8Response(Base):
    __tablename__ = "ad8_response"

    response_id = Column(Integer, primary_key=True, index=True)
    ad8test_id = Column(Integer, ForeignKey("ad8_test.ad8test_id"), nullable=False)
    question_no = Column(Integer, nullable=False)
    is_correct = Column(Boolean, nullable=False)

