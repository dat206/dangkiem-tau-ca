import os
from datetime import date

import pytest
from pydantic import ValidationError

os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")

from app.models.vessel import (  # noqa: E402
    InspectionTypeEnum,
    LengthGroupEnum,
    MaterialEnum,
    ReportConfig,
    VesselData,
)


def make_vessel_data(**overrides):
    data = {
        "registration_number": "QN-90599-TS",
        "owner_name": "Hoàng Văn Sinh",
        "address": "xã Đường Hoa, tỉnh Quảng Ninh",
        "province_code": "qn",
        "province_name": "Quảng Ninh",
        "lmax": 12.8,
        "power_kw": 169.92,
        "material": MaterialEnum.GO,
        "inspection_type": InspectionTypeEnum.HANG_NAM,
        "length_group": LengthGroupEnum.G12_15,
        "valid_until": date(2027, 5, 9),
        "issued_date": date(2026, 5, 9),
        "fishing_gear": "Lưới rê",
        "registry_book_number": "90599/26/HN.QN/ĐKTC",
        "registry_book_issued_date": date(2026, 5, 9),
        "inspection_authority": "Công ty CP Công nghệ cao Hoàng Bảo Minh",
        "inspector_name": "Nguyễn Văn A",
        "technical_record_number": "90599.26/HN.QN/ĐKTC",
        "technical_record_date": date(2026, 5, 9),
        "safety_certificate_number": "416.26/HN.QN/ĐKTC",
        "safety_certificate_date": date(2026, 5, 9),
        "extension_inspection_date": None,
        "inspection_conclusion": "Thỏa mãn hoạt động",
        "classification_symbol": "Hạn chế II",
    }
    data.update(overrides)
    return data


def test_vessel_data_validates_types_and_normalizes_province_code():
    vessel = VesselData(**make_vessel_data())

    assert vessel.registration_number == "QN-90599-TS"
    assert vessel.province_code == "QN"
    assert vessel.province_name == "Quảng Ninh"
    assert vessel.material is MaterialEnum.GO
    assert vessel.length_group is LengthGroupEnum.G12_15


def test_vessel_data_accepts_extended_inspection_fields_from_registration_form():
    vessel = VesselData(
        **make_vessel_data(
            inspection_type=InspectionTypeEnum.LAN_DAU,
            inspection_authority="",
            technical_record_date="2026-05-09",
            safety_certificate_date="2026-05-09",
        )
    )

    assert vessel.inspection_type is InspectionTypeEnum.LAN_DAU
    assert vessel.inspection_authority is None
    assert vessel.technical_record_date == date(2026, 5, 9)
    assert vessel.safety_certificate_number == "416.26/HN.QN/ĐKTC"
    assert vessel.inspection_conclusion == "Thỏa mãn hoạt động"
    assert vessel.classification_symbol == "Hạn chế II"


def test_vessel_data_rejects_non_positive_lmax():
    with pytest.raises(ValidationError):
        VesselData(**make_vessel_data(lmax=0))


def test_report_config_restricts_quarter_to_one_through_four():
    assert ReportConfig(quarter=4, year=2026, provinces=["qn"]).quarter == 4

    with pytest.raises(ValidationError):
        ReportConfig(quarter=5, year=2026, provinces=["QN"])


def test_report_config_requires_at_least_one_province():
    with pytest.raises(ValidationError):
        ReportConfig(quarter=1, year=2026, provinces=[])


def test_models_generate_json_schema_for_api_docs():
    vessel_schema = VesselData.model_json_schema()
    config_schema = ReportConfig.model_json_schema()

    assert "registration_number" in vessel_schema["properties"]
    assert "registry_book_number" in vessel_schema["properties"]
    assert "technical_record_date" in vessel_schema["properties"]
    assert "safety_certificate_number" in vessel_schema["properties"]
    assert "inspection_conclusion" in vessel_schema["properties"]
    assert "quarter" in config_schema["properties"]
    assert config_schema["properties"]["quarter"]["minimum"] == 1
    assert config_schema["properties"]["quarter"]["maximum"] == 4
