"""Pydantic and SQLAlchemy models for fishing vessel reports."""
from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import Column, DateTime, Float, Integer, String, Text

from app.database import Base


class MaterialEnum(str, Enum):
    """Hull material."""

    GO = "Gỗ"
    THEP = "Thép"
    FRP = "FRP"


class InspectionTypeEnum(str, Enum):
    """Inspection type used in quarterly reports."""

    LAN_DAU = "Lần đầu"
    HANG_NAM = "Hàng năm"
    TRUNG_GIAN_TREN_DA = "Trung gian (Trên đà)"
    DINH_KY = "Định kỳ"
    BAT_THUONG = "Bất thường"
    CAI_HOAN = "Cải hoán"
    TREN_DA = "Trên đà"
    GIAM_SAT = "Giám sát"


class LengthGroupEnum(str, Enum):
    """Lmax group used for aggregation."""

    G12_15 = "12-15m"
    G15_20 = "15-20m"
    G20_24 = "20-24m"
    G24_30 = "24-30m"
    G30_PLUS = "≥30m"


OPTIONAL_TEXT_FIELDS = (
    "province_name",
    "registry_book_number",
    "inspection_authority",
    "inspector_name",
    "technical_record_number",
    "safety_certificate_number",
    "inspection_conclusion",
    "classification_symbol",
)


class VesselData(BaseModel):
    """Validated vessel data extracted from a certificate DOCX file."""

    model_config = ConfigDict(
        from_attributes=True,
        str_strip_whitespace=True,
        json_schema_extra={
            "example": {
                "registration_number": "QN-90599-TS",
                "owner_name": "Hoàng Văn Sinh",
                "address": "xã Đường Hoa, tỉnh Quảng Ninh",
                "province_code": "QN",
                "province_name": "Quảng Ninh",
                "lmax": 12.8,
                "power_kw": 169.92,
                "material": "Gỗ",
                "inspection_type": "Hàng năm",
                "length_group": "12-15m",
                "valid_until": "2027-05-09",
                "issued_date": "2026-05-09",
                "fishing_gear": "Lưới rê",
                "registry_book_number": "90599/26/HN.QN/ĐKTC",
                "registry_book_issued_date": "2026-05-09",
                "inspection_authority": "Công ty CP Công nghệ cao Hoàng Bảo Minh",
                "inspector_name": "Nguyễn Văn A",
                "technical_record_number": "90599.26/HN.QN/ĐKTC",
                "technical_record_date": "2026-05-09",
                "safety_certificate_number": "416.26/HN.QN/ĐKTC",
                "safety_certificate_date": "2026-05-09",
                "extension_inspection_date": None,
                "inspection_conclusion": "Thỏa mãn hoạt động",
                "classification_symbol": "Hạn chế II",
            }
        },
    )

    registration_number: str = Field(..., min_length=1)
    owner_name: str = Field(..., min_length=1)
    address: str = Field(..., min_length=1)
    province_code: str = Field(..., min_length=2, max_length=10)
    province_name: str | None = Field(default=None, min_length=1)
    lmax: float = Field(..., gt=0, description="Vessel length Lmax in meters")
    power_kw: float = Field(..., gt=0, description="Main engine power in kW")
    material: MaterialEnum
    inspection_type: InspectionTypeEnum
    length_group: LengthGroupEnum
    valid_until: date
    issued_date: date
    fishing_gear: str = Field(..., min_length=1)
    registry_book_number: str | None = Field(
        default=None,
        min_length=1,
        description="Số sổ đăng kiểm/Sổ ATKT",
    )
    registry_book_issued_date: date | None = Field(
        default=None,
        description="Ngày cấp sổ đăng kiểm",
    )
    inspection_authority: str | None = Field(
        default=None,
        min_length=1,
        description="Cơ quan đăng kiểm",
    )
    inspector_name: str | None = Field(
        default=None,
        min_length=1,
        description="Đăng kiểm viên",
    )
    technical_record_number: str | None = Field(
        default=None,
        min_length=1,
        description="Biên bản KTKT số",
    )
    technical_record_date: date | None = Field(
        default=None,
        description="Ngày biên bản KTKT",
    )
    safety_certificate_number: str | None = Field(
        default=None,
        min_length=1,
        description="Giấy chứng nhận ATKT số",
    )
    safety_certificate_date: date | None = Field(
        default=None,
        description="Ngày chứng nhận ATKT",
    )
    extension_inspection_date: date | None = Field(
        default=None,
        description="Ngày kiểm tra gia hạn",
    )
    inspection_conclusion: str | None = Field(
        default=None,
        min_length=1,
        description="Kết luận chung",
    )
    classification_symbol: str | None = Field(
        default=None,
        min_length=1,
        description="Ký hiệu phân cấp",
    )

    @field_validator(*OPTIONAL_TEXT_FIELDS, mode="before")
    @classmethod
    def blank_optional_text_to_none(cls, value: str | None) -> str | None:
        if isinstance(value, str) and not value.strip():
            return None
        return value

    @field_validator("province_code")
    @classmethod
    def normalize_province_code(cls, value: str) -> str:
        return value.upper()


class ReportConfig(BaseModel):
    """Report generation configuration."""

    model_config = ConfigDict(
        str_strip_whitespace=True,
        json_schema_extra={
            "example": {
                "quarter": 1,
                "year": 2026,
                "provinces": ["QN", "TH"],
            }
        },
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
    """Database model for vessels."""

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
    """Database model for report history."""

    __tablename__ = "report_history"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    quarter = Column(Integer)
    year = Column(Integer)
    file_count = Column(Integer)
    provinces = Column(String(500))
    file_path = Column(String(500))
    status = Column(String(20), default="success")
    error_message = Column(Text, nullable=True)
