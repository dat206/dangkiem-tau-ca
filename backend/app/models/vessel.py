"""Models - Pydantic + SQLAlchemy"""
from datetime import datetime, date
from enum import Enum
from pydantic import BaseModel, Field
from sqlalchemy import Column, String, Float, DateTime, Integer, Text
from app.database import Base


# ========== ENUM ==========
class MaterialEnum(str, Enum):
    """Vật liệu tàu"""
    GO = "Gỗ"
    THEP = "Thép"
    FRP = "FRP"


class InspectionTypeEnum(str, Enum):
    """Hình thức kiểm tra"""
    HANG_NAM = "Hàng năm"
    DINH_KY = "Định kỳ"
    TREN_DA = "Trên đà"
    GIAM_SAT = "Giám sát"
    CAI_HOAN = "Cải hoán"


class LengthGroupEnum(str, Enum):
    """Nhóm chiều dài Lmax"""
    G12_15 = "12-15m"
    G15_20 = "15-20m"
    G20_24 = "20-24m"
    G24_30 = "24-30m"
    G30_PLUS = "≥30m"


# ========== PYDANTIC MODELS (Request/Response) ==========
class VesselData(BaseModel):
    """Dữ liệu tàu từ DOCX parser"""
    registration_number: str
    owner_name: str
    address: str
    province_code: str
    province_name: str
    lmax: float = Field(..., gt=0, description="Chiều dài tàu (m)")
    power_kw: float = Field(..., gt=0, description="Công suất máy (KW)")
    material: MaterialEnum
    inspection_type: InspectionTypeEnum
    length_group: LengthGroupEnum
    valid_until: date
    issued_date: date
    fishing_gear: str

    class Config:
        from_attributes = True


class ReportConfig(BaseModel):
    """Cấu hình xuất báo cáo"""
    quarter: int = Field(..., ge=1, le=4, description="Quý (1-4)")
    year: int = Field(..., ge=2000, le=2100, description="Năm")
    provinces: list[str] = Field(..., min_items=1, description="Danh sách tỉnh")


class ReportHistoryItem(BaseModel):
    """Thông tin lịch sử xuất báo cáo"""
    id: int
    created_at: datetime
    quarter: int
    year: int
    file_count: int
    provinces: str

    class Config:
        from_attributes = True


# ========== SQLALCHEMY MODELS (Database) ==========
class VesselORM(Base):
    """Model Tàu - lưu vào database"""
    __tablename__ = "vessels"

    id = Column(Integer, primary_key=True, index=True)
    registration_number = Column(String(50), unique=True, index=True)
    owner_name = Column(String(255))
    address = Column(String(255))
    province_code = Column(String(10), index=True)
    province_name = Column(String(100))
    lmax = Column(Float)
    power_kw = Column(Float)
    material = Column(String(20))
    inspection_type = Column(String(50))
    length_group = Column(String(20), index=True)
    valid_until = Column(String(10))
    issued_date = Column(String(10))
    fishing_gear = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)


class ReportHistoryORM(Base):
    """Model Lịch sử báo cáo"""
    __tablename__ = "report_history"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    quarter = Column(Integer)
    year = Column(Integer)
    file_count = Column(Integer)
    provinces = Column(String(500))  # JSON hoặc comma-separated
    file_path = Column(String(500))  # Path to saved Excel files
    status = Column(String(20), default="success")  # success, partial_error, error
    error_message = Column(Text, nullable=True)
