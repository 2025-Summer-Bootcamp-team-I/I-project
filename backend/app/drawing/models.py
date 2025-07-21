from sqlalchemy import Column, BigInteger, String, Integer, ForeignKey
from ..database import Base

class DrawingTest(Base):
    __tablename__ = "drawing_tests"

    drawing_id = Column(Integer, primary_key=True, autoincrement=True)
    report_id = Column(Integer, ForeignKey("reports.report_id"))
    image_url = Column(String(255))
    risk_score = Column(Integer)

