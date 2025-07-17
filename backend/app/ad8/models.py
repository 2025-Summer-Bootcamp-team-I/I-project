from sqlalchemy import Column, Integer, Boolean, ForeignKey
from app.database import Base

class AD8Test(Base):
    __tablename__ = "ad8_test"

    AD8Test_id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.report_id"), nullable=False)
    risk_score = Column(Integer, nullable=False)

class AD8Response(Base):
    __tablename__ = "ad8_response"

    response_id = Column(Integer, primary_key=True, index=True)
    AD8Test_id = Column(Integer, ForeignKey("ad8_test.AD8Test_id"), nullable=False)
    question_no = Column(Integer, nullable=False)
    is_correct = Column(Boolean, nullable=False)

