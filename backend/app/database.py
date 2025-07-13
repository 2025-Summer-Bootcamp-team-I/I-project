from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "mysql+pymysql://iteam:iteampass@mysql:3306/iteamdb"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # 연결 유지
    echo=True  # SQL 출력 (디버깅용, 나중에 False로)
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
