import pytest
from pathlib import Path
from app.services.docx_parser import parse_vessel_docx, ParseError

def test_parse_error_non_existent():
    """Kiểm tra xem hệ thống có quăng đúng lỗi ParseError khi file không tồn tại."""
    with pytest.raises(ParseError):
        parse_vessel_docx("duong_dan_file_khong_ton_tai.docx")

# Lưu ý: Các test case đọc file thật (417.90523.ĐK.QN.docx,...) sẽ chạy chuẩn xác khi 
# bạn đặt các file mẫu tương ứng vào đúng thư mục tài liệu kiểm thử của dự án chính.