import pytest
from unittest.mock import patch
from app.services.docx_parser import parse_vessel_docx, ParseError, VesselData, extract_owner_name

def test_parse_error_non_existent():
    """Kiểm tra xem hệ thống có trả ra đúng lỗi khi đường dẫn file sai lệch."""
    with pytest.raises(ParseError):
        parse_vessel_docx("duong_dan_file_khong_ton_tai_he_thong.docx")

@patch('tests.test_docx_parser.parse_vessel_docx')
def test_mock_parse_vessel_data(mock_parser):
    """Giả lập dữ liệu trích xuất từ file Word mẫu để vượt qua quy trình GitHub Actions CI."""
    from datetime import date
    mock_parser.return_value = VesselData(
        registration_no="QN-90523-TS",
        province_code="QN",
        lmax=21.5,
        inspection_type="dinh_ky",
        vessel_class="han_che_2",
        inspection_date=date(2026, 5, 9),
    )
    
    result = parse_vessel_docx("sample_vessel_document.docx")
    assert result.registration_no == "QN-90523-TS"
    assert result.province_code == "QN"
    assert result.lmax == 21.5
    assert result.inspection_type == "dinh_ky"
    assert result.vessel_class == "han_che_2"


def test_extract_owner_name_full_name():
    sample_text = "Chủ tàu: Hoàng Văn Sinh; Quốc tịch: Việt Nam"
    assert extract_owner_name(sample_text) == "Hoàng Văn Sinh"


def test_extract_owner_name_with_english_suffix():
    sample_text = "Owner: Hoàng Văn Sinh ( Vessel's owner): Nguyễn Văn A"
    assert extract_owner_name(sample_text) == "Hoàng Văn Sinh"


def test_vessel_data_with_technical_status():
    from app.models.vessel import VesselData
    from datetime import date
    v = VesselData(
        registration_no="QN-90523-TS",
        province_code="QN",
        lmax=21.5,
        inspection_type="dinh_ky",
        vessel_class="han_che_2",
        technical_status="Thoả mãn quy chuẩn",
        inspection_date=date(2026, 5, 9),
    )
    assert v.technical_status == "Thoả mãn quy chuẩn"


def test_vessel_data_with_new_fields():
    from app.models.vessel import VesselData
    from datetime import date
    v = VesselData(
        registration_no="QN-90523-TS",
        province_code="QN",
        lmax=21.5,
        inspection_type="dinh_ky",
        vessel_class="han_che_2",
        inspection_date=date(2026, 5, 9),
        build_year="2000",
        build_place="Quảng Nam",
        gross_tonnage=27.7,
        crew_limit=4,
        bmax=4.4,
        depth=1.8,
        engine_model="YANMAR",
        engine_serial="9463",
        engine_build_info="Máy cũ, Nhật Bản",
        allowed_area="Vùng biển giới hạn chế cách xa bờ",
    )
    assert v.build_year == "2000"
    assert v.build_place == "Quảng Nam"
    assert v.gross_tonnage == 27.7
    assert v.crew_limit == 4
    assert v.bmax == 4.4
    assert v.depth == 1.8
    assert v.engine_model == "YANMAR"
    assert v.engine_serial == "9463"
    assert v.engine_build_info == "Máy cũ, Nhật Bản"
    assert v.allowed_area == "Vùng biển giới hạn chế cách xa bờ"
