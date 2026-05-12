"""Database configuration - SQLAlchemy setup"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Đọc DATABASE_URL từ environment
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/fishing_db")

# Tạo engine
engine = create_engine(
    DATABASE_URL,
    echo=False,  # Set True để debug SQL queries
    pool_pre_ping=True,  # Kiểm tra connection trước khi dùng
)

# Tạo session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class cho models
Base = declarative_base()


def get_db():
    """Dependency injection cho database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
