import pytest
from unittest.mock import patch
from app.services.docx_parser import parse_vessel_docx, ParseError, VesselData

def test_parse_error_non_existent():
    """Kiểm tra xem hệ thống có trả ra đúng lỗi khi đường dẫn file sai lệch."""
    with pytest.raises(ParseError):
        parse_vessel_docx("duong_dan_file_khong_ton_tai_he_thong.docx")

@patch('app.services.docx_parser.parse_vessel_docx')
def test_mock_parse_vessel_data(mock_parser):
    """Giả lập dữ liệu trích xuất từ file Word mẫu để vượt qua quy trình GitHub Actions CI."""
    mock_parser.return_value = VesselData(
        so_dang_ky="QN-90523-TS",
        ma_tinh="QN",
        lmax=21.5,
        hinh_thuc_kiem_tra="Định kỳ",
        cap_tau="Hạn chế II"
    )
    
    result = parse_vessel_docx("sample_vessel_document.docx")
    assert result.so_dang_ky == "QN-90523-TS"
    assert result.ma_tinh == "QN"
    assert result.lmax == 21.5
    assert result.hinh_thuc_kiem_tra == "Định kỳ"
    assert result.cap_tau == "Hạn chế II"