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
        "registration_no": "QN-90599-TS",
        "owner_name": "Hoàng Văn Sinh",
        "address": "xã Đường Hoa, tỉnh Quảng Ninh",
        "province_code": "qn",
        "lmax": 12.8,
        "power_kw": 169.92,
        "material": MaterialEnum.GO.value,
        "inspection_type": InspectionTypeEnum.HANG_NAM.value,
        "length_group": LengthGroupEnum.L12_15.value,
        "inspection_date": date(2026, 5, 9),
        "valid_until": date(2027, 5, 9),
        "issued_date": date(2026, 5, 9),
        "fishing_gear": "Lưới rê",
    }
    data.update(overrides)
    return data


def test_vessel_data_validates_types_and_normalizes_province_code():
    vessel = VesselData(**make_vessel_data())

    assert vessel.registration_no == "QN-90599-TS"
    assert vessel.province_code == "QN"
    assert vessel.material == MaterialEnum.GO.value
    assert vessel.length_group == LengthGroupEnum.L12_15.value


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

    assert "registration_no" in vessel_schema["properties"]
    assert "quarter" in config_schema["properties"]
    assert config_schema["properties"]["quarter"]["minimum"] == 1
    assert config_schema["properties"]["quarter"]["maximum"] == 4
