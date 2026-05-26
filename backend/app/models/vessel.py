"""Models - Pydantic + SQLAlchemy"""
from datetime import datetime, date
from enum import Enum
<<<<<<< Updated upstream
from pydantic import BaseModel, Field
from sqlalchemy import Column, String, Float, DateTime, Integer, Text
=======
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import Column, Date, DateTime, Float, Integer, String, Text, UniqueConstraint

>>>>>>> Stashed changes
from app.database import Base


# ========== ENUM ==========
class MaterialEnum(str, Enum):
<<<<<<< Updated upstream
    """Vật liệu tàu"""
=======
    """Hull material."""
>>>>>>> Stashed changes
    GO = "Gỗ"
    THEP = "Thép"
    FRP = "FRP"
    KHONG_XAC_DINH = "Không xác định"


class InspectionTypeEnum(str, Enum):
<<<<<<< Updated upstream
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
=======
    """Inspection type."""
    HANG_NAM = "hang_nam"
    DINH_KY = "dinh_ky"
    TREN_DA = "tren_da"
    GIAM_SAT = "giam_sat"
    CAI_HOAN = "cai_hoan"
    BAT_THUONG = "bat_thuong"
    LAN_DAU = "lan_dau"
    DONG_MOI = "dong_moi"
    KHONG_XAC_DINH = "khong_xac_dinh"


class LengthGroupEnum(str, Enum):
    """Lmax group."""
    DUOI_12 = "duoi_12"
    L12_15 = "L12_15"
    L15_20 = "L15_20"
    L20_24 = "L20_24"
    L24_30 = "L24_30"
    L30_PLUS = "L30_plus"
    KHONG_XAC_DINH = "khong_xac_dinh"
>>>>>>> Stashed changes


# ========== PYDANTIC MODELS (Request/Response) ==========
class VesselData(BaseModel):
<<<<<<< Updated upstream
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
=======
    """Validated vessel data extracted from a certificate DOCX file."""

    model_config = ConfigDict(
        from_attributes=True,
        str_strip_whitespace=True,
    )

    registration_no: Optional[str] = None
    owner_name: Optional[str] = ""
    address: Optional[str] = ""
    address_short: Optional[str] = ""
    province_code: str = Field(..., min_length=2, max_length=10)
    lmax: float = Field(0.0, gt=0.0, description="Vessel length Lmax in meters")
    power_kw: float = Field(0.0, description="Main engine power in kW")
    material: str = "Không xác định"
    inspection_type: str = "khong_xac_dinh"
    length_group: str = "khong_xac_dinh"
    vessel_class: Optional[str] = "khong_xac_dinh"
    inspection_date: date
    valid_until: Optional[date] = None
    issued_date: Optional[date] = None
    fishing_gear: Optional[str] = ""
    source_filename: Optional[str] = ""

    @field_validator("province_code")
    @classmethod
    def normalize_province_code(cls, value: str) -> str:
        # NĐ, QNg etc should keep case logic in processing, but for DB it can be string.
        # We will keep exactly what is parsed or upper() if desired. 
        # But QNg needs 'g' lowercase.
        if value.upper() == "QNG":
            return "QNg"
        return value.upper().replace('Đ', 'Đ')


class ReportConfig(BaseModel):
    """Report generation configuration."""

    model_config = ConfigDict(
        str_strip_whitespace=True,
    )

    quarter: int = Field(..., ge=1, le=4, description="Quarter number from 1 to 4")
    year: int = Field(..., ge=2000, le=2100, description="Report year")
    provinces: list[str] = Field(..., min_length=1, description="Province codes")

    @field_validator("provinces")
    @classmethod
    def normalize_provinces(cls, value: list[str]) -> list[str]:
        provinces = [province.strip().upper() for province in value]
        if any(not province for province in provinces):
            raise ValueError("province codes must not be blank")
        return provinces
>>>>>>> Stashed changes


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
<<<<<<< Updated upstream
    """Model Tàu - lưu vào database"""
    __tablename__ = "vessels"
=======
    """Database model for vessels."""

    __tablename__ = "vessel_inspections"
>>>>>>> Stashed changes

    id = Column(Integer, primary_key=True, index=True)
    registration_no = Column(String(25), nullable=True, index=True)
    province_code = Column(String(10), nullable=False, index=True)
    owner_name = Column(String(120))
    address = Column(String(250))
    address_short = Column(String(60))
    fishing_gear = Column(String(80))
    material = Column(String(20))
    lmax = Column(Float)
    power_kw = Column(Float)
    inspection_type = Column(String(20), nullable=False)
    length_group = Column(String(20), nullable=False)
    vessel_class = Column(String(20))
    
    inspection_date = Column(Date, nullable=False, index=True)
    valid_until = Column(Date)
    issued_date = Column(Date)
    
    source_filename = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Note: DB requires unique registration_no + inspection_date for upserts
    # If registration_no is NULL, we might skip upsert and just insert, 
    # but postgres allows multiple nulls in unique constraints.
    __table_args__ = (
        UniqueConstraint('registration_no', 'inspection_date', name='uq_vessel_inspection'),
    )


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
