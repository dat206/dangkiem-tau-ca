"""Pydantic and SQLAlchemy models for fishing vessel reports."""
from datetime import date, datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import Column, Date, DateTime, Float, Integer, String, Text, UniqueConstraint

from app.database import Base


class MaterialEnum(str, Enum):
    """Hull material."""
    GO = "Gỗ"
    THEP = "Thép"
    FRP = "FRP"
    KHONG_XAC_DINH = "Không xác định"


class InspectionTypeEnum(str, Enum):
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


class VesselData(BaseModel):
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
    technical_status: Optional[str] = ""
    inspection_date: date
    valid_until: Optional[date] = None
    issued_date: Optional[date] = None
    fishing_gear: Optional[str] = ""
    source_filename: Optional[str] = ""
    build_year: Optional[str] = ""
    build_place: Optional[str] = ""
    gross_tonnage: Optional[float] = 0.0
    crew_limit: Optional[int] = 0
    bmax: Optional[float] = 0.0
    depth: Optional[float] = 0.0
    engine_model: Optional[str] = ""
    engine_serial: Optional[str] = ""
    engine_build_info: Optional[str] = ""
    allowed_area: Optional[str] = ""

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


class ReportHistoryItem(BaseModel):
    """Report generation history item."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    quarter: int
    year: int
    file_count: int
    provinces: str


class VesselORM(Base):
    """Database model for vessels (mapped to vessel_inspections table after migration 0003)."""

    __tablename__ = "vessel_inspections"

    id = Column(Integer, primary_key=True, index=True)
    # registration_no: đã rename từ registration_number trong migration 0003
    registration_no = Column(String(50), nullable=True, index=True)
    province_code = Column(String(10), nullable=True, index=True)
    owner_name = Column(String(255))
    address = Column(String(255))
    address_short = Column(String(60))
    fishing_gear = Column(String(255))
    material = Column(String(20))
    lmax = Column(Float)
    power_kw = Column(Float)
    inspection_type = Column(String(50), nullable=True)
    length_group = Column(String(20), nullable=True)
    vessel_class = Column(String(20))
    technical_status = Column(String(255), nullable=True)

    # Các cột date – inspection_date được thêm trong migration 0003
    inspection_date = Column(Date, nullable=True, index=True)
    valid_until = Column(Date)
    issued_date = Column(Date)

    source_filename = Column(String(255))
    build_year = Column(String(50), nullable=True)
    build_place = Column(String(255), nullable=True)
    gross_tonnage = Column(Float, nullable=True)
    crew_limit = Column(Integer, nullable=True)
    bmax = Column(Float, nullable=True)
    depth = Column(Float, nullable=True)
    engine_model = Column(String(100), nullable=True)
    engine_serial = Column(String(100), nullable=True)
    engine_build_info = Column(String(255), nullable=True)
    allowed_area = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # UNIQUE(registration_no, inspection_date) – PostgreSQL cho phép nhiều NULL
    __table_args__ = (
        UniqueConstraint('registration_no', 'inspection_date', name='uq_vessel_inspection'),
    )


class ReportHistoryORM(Base):
    """Database model for report history."""

    __tablename__ = "report_history"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    quarter = Column(Integer)
    year = Column(Integer)
    file_count = Column(Integer)
    record_count = Column(Integer, default=0)
    provinces = Column(String(500))
    file_path = Column(String(500))
    file_types = Column(String(100), default="registry,summary")
    created_by = Column(String(255), default="Nguyen Thi Binh")
    status = Column(String(20), default="success")
    error_message = Column(Text, nullable=True)


class SystemSettingORM(Base):
    """Database model for system settings (key-value store)."""

    __tablename__ = "system_settings"

    key = Column(String(50), primary_key=True, index=True)
    value = Column(Text, nullable=True)


class BatchTaskORM(Base):
    """Database model for background batch task tracking."""

    __tablename__ = "batch_tasks"

    id = Column(String(50), primary_key=True, index=True)
    status = Column(String(20), default="processing")
    total = Column(Integer, default=0)
    success = Column(Integer, default=0)
    failed = Column(Integer, default=0)
    error = Column(Text, nullable=True)
    data = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
