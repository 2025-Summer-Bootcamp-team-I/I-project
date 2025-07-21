from sqlalchemy import Column, BigInteger, ForeignKey, Enum, Text, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base
import enum
from sqlalchemy.ext.declarative import declared_attr

class RoleEnum(enum.Enum):
    user = "user"
    ai = "ai"

class Chat(Base):
    __tablename__ = "chat"

    chat_id = Column(BigInteger, primary_key=True, autoincrement=True)
    report_id = Column(BigInteger, ForeignKey("report.report_id"), nullable=False)

    logs = relationship("ChatLog", back_populates="chat")

class BaseTimeEntity:
    @declared_attr
    def created_at(cls):
        return Column(DateTime, server_default=func.now(), nullable=False)
    @declared_attr
    def updated_at(cls):
        return Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

class ChatLog(Base, BaseTimeEntity):
    __tablename__ = "chat_log"

    log_id = Column(BigInteger, primary_key=True, autoincrement=True)
    chat_id = Column(BigInteger, ForeignKey("chat.chat_id"), nullable=False)
    role = Column(Enum(RoleEnum), nullable=False)
    text = Column(Text, nullable=False)
    chat = relationship("Chat", back_populates="logs")
