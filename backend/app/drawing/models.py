from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base

class Drawing(Base):
    __tablename__ = "drawings"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, index=True)  # 임시로 ForeignKey 제거
    image_url = Column(String(255))
    risk_score = Column(Integer)
    summary = Column(String(255))
    detail = Column(String(1000))
    
    # report = relationship("Report", back_populates="drawings")  # 임시로 관계 제거
