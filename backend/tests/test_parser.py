from io import BytesIO
import os

import pytest
from docx import Document

os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")

from app.models.vessel import InspectionTypeEnum, LengthGroupEnum, MaterialEnum
from app.services.docx_parser import (
    DocxParserError,
    extract_province_code,
    get_length_group,
    parse_docx,
)


@pytest.fixture
def docx_factory(tmp_path):
    """Tao file DOCX tam tu noi dung text de test parser nhu luong upload that."""

    def _create(name: str, text_content: str):
        document = Document()
        for line in text_content.strip().splitlines():
            document.add_paragraph(line)

        path = tmp_path / name
        document.save(path)
        return path

    return _create


@pytest.fixture
def table_docx_factory(tmp_path):
    """Tao file DOCX dang bang key/value de kiem tra parser doc table cells."""

    def _create(name: str, rows: list[tuple[str, str]]):
        document = Document()
        table = document.add_table(rows=0, cols=2)
        for label, value in rows:
            cells = table.add_row().cells
            cells[0].text = label
            cells[1].text = value

        path = tmp_path / name
        document.save(path)
        return path

    return _create


def test_parse_sample_416_extracts_all_fields(docx_factory):
    """Parse file mau 416 va kiem tra cac field quan trong duoc map dung."""
    path = docx_factory(
        "416.docx",
        """
        Số đăng ký: QN-90599-TS
        Tên chủ tàu: Nguyễn Văn A
        Địa chỉ: Phường Y, Thành phố X
        Lmax: 25.5
        Công suất: 500
        Vật liệu: Vỏ Thép
        Hình thức kiểm tra: Hàng năm
        Có giá trị đến: 31/12/2025
        Ngày cấp: 01/01/2024
        Nghề: Lưới kéo
        """,
    )

    vessel = parse_docx(path)

    assert vessel.registration_number == "QN-90599-TS"
    assert vessel.owner_name == "Nguyễn Văn A"
    assert vessel.address == "Phường Y, Thành phố X"
    assert vessel.province_code == "QN"
    assert vessel.lmax == 25.5
    assert vessel.power_kw == 500.0
    assert vessel.material == MaterialEnum.THEP
    assert vessel.inspection_type == InspectionTypeEnum.HANG_NAM
    assert vessel.length_group == LengthGroupEnum.G24_30
    assert vessel.valid_until.isoformat() == "2025-12-31"
    assert vessel.issued_date.isoformat() == "2024-01-01"
    assert vessel.fishing_gear == "Lưới kéo"


def test_parse_sample_417_maps_go_material_and_periodic_inspection(docx_factory):
    """Parse file 417: vat lieu go, kiem tra dinh ky, nhom 15-20m."""
    path = docx_factory(
        "417.docx",
        """
        Số đăng ký: TH-12345-TS
        Tên chủ tàu: Trần Văn B
        Địa chỉ: Thanh Hóa
        Lmax: 18.0
        Công suất: 300
        Vật liệu: Vỏ Gỗ
        Hình thức kiểm tra: Định kỳ
        """,
    )

    vessel = parse_docx(path)

    assert vessel.registration_number == "TH-12345-TS"
    assert vessel.province_code == "TH"
    assert vessel.material == MaterialEnum.GO
    assert vessel.inspection_type == InspectionTypeEnum.DINH_KY
    assert vessel.length_group == LengthGroupEnum.G15_20


def test_parse_sample_418_maps_frp_and_on_slipway_inspection(docx_factory):
    """Parse file 418: vat lieu FRP, kiem tra tren da, nhom >=30m."""
    path = docx_factory(
        "418.docx",
        """
        Số đăng ký: HP-99999-TS
        Tên chủ tàu: Lê Văn C
        Địa chỉ: Hải Phòng
        Lmax: 32.0
        Công suất: 800
        Vật liệu: FRP
        Hình thức kiểm tra: Trên đà
        """,
    )

    vessel = parse_docx(path)

    assert vessel.registration_number == "HP-99999-TS"
    assert vessel.province_code == "HP"
    assert vessel.length_group == LengthGroupEnum.G30_PLUS
    assert vessel.material == MaterialEnum.FRP
    assert vessel.inspection_type == InspectionTypeEnum.TREN_DA


def test_missing_required_field_raises_parser_error(docx_factory):
    """File DOCX thieu so dang ky phai bao loi field bat buoc."""
    path = docx_factory(
        "missing-registration.docx",
        """
        Tên chủ tàu: Nguyễn Văn A
        Địa chỉ: Phường Y, Thành phố X
        Lmax: 25.5
        Công suất: 500
        Vật liệu: Gỗ
        Hình thức kiểm tra: Giám sát
        """,
    )

    with pytest.raises(DocxParserError, match="Missing required field"):
        parse_docx(path)


def test_invalid_docx_format_raises_parser_error():
    """File khong phai DOCX phai duoc wrap thanh DocxParserError ro rang."""
    stream = BytesIO(b"This is not a docx file format")

    with pytest.raises(DocxParserError, match="Invalid DOCX format"):
        parse_docx(stream)


def test_extract_province_code_from_qn_registration_number():
    """Kiem tra province_code extract dung tu chuoi QN-90599-TS."""
    assert extract_province_code("QN-90599-TS") == "QN"


def test_parse_docx_assigns_qn_province_code(docx_factory):
    """Parser phai gan province_code QN tu so dang ky QN-90599-TS."""
    path = docx_factory(
        "province-code.docx",
        """
        Số đăng ký: QN-90599-TS
        Tên chủ tàu: A
        Địa chỉ: B
        Lmax: 12.0
        Công suất: 100
        Vật liệu: Gỗ
        Hình thức kiểm tra: Giám sát
        """,
    )

    vessel = parse_docx(path)

    assert vessel.province_code == "QN"


@pytest.mark.parametrize(
    ("length", "expected"),
    [
        (13.5, LengthGroupEnum.G12_15),
        (22.0, LengthGroupEnum.G20_24),
    ],
)
def test_get_length_group_boundaries(length, expected):
    """Kiem tra phan loai nhom chieu dai cho cac nguong parser dung."""
    assert get_length_group(length) == expected


def test_parse_cai_hoan_inspection_type(docx_factory):
    """Parser nhan dien hinh thuc kiem tra cai hoan tu noi dung DOCX."""
    path = docx_factory(
        "cai-hoan.docx",
        """
        Số đăng ký: QN-90599-TS
        Tên chủ tàu: A
        Địa chỉ: B
        Lmax: 16.0
        Công suất: 100
        Vật liệu: Gỗ
        Hình thức kiểm tra: Cải hoán
        """,
    )

    vessel = parse_docx(path)

    assert vessel.inspection_type == InspectionTypeEnum.CAI_HOAN


def test_invalid_lmax_format_raises_parser_error(docx_factory):
    """Lmax khong co so hop le phai raise DocxParserError."""
    path = docx_factory(
        "invalid-lmax.docx",
        """
        Số đăng ký: QN-90599-TS
        Tên chủ tàu: A
        Địa chỉ: B
        Lmax: ABC
        Công suất: 100
        Vật liệu: Gỗ
        Hình thức kiểm tra: Cải hoán
        """,
    )

    with pytest.raises(DocxParserError, match="Invalid numeric value"):
        parse_docx(path)


def test_invalid_registration_number_format_raises_parser_error(docx_factory):
    """So dang ky khong co ma tinh o dau phai raise loi format."""
    path = docx_factory(
        "invalid-registration-format.docx",
        """
        Số đăng ký: 90599-TS
        Tên chủ tàu: A
        Địa chỉ: B
        Lmax: 16.0
        Công suất: 100
        Vật liệu: Gỗ
        Hình thức kiểm tra: Giám sát
        """,
    )

    with pytest.raises(DocxParserError, match="Invalid registration number format"):
        parse_docx(path)


def test_invalid_material_raises_parser_error(docx_factory):
    """Vat lieu khong thuoc danh muc ho tro phai raise loi."""
    path = docx_factory(
        "invalid-material.docx",
        """
        Số đăng ký: QN-90599-TS
        Tên chủ tàu: A
        Địa chỉ: B
        Lmax: 16.0
        Công suất: 100
        Vật liệu: Xi măng
        Hình thức kiểm tra: Giám sát
        """,
    )

    with pytest.raises(DocxParserError, match="Invalid material"):
        parse_docx(path)


def test_invalid_dates_fallback_to_parser_defaults(docx_factory):
    """Ngay thang sai format phai fallback ve default thay vi lam hong parse."""
    path = docx_factory(
        "invalid-dates.docx",
        """
        Số đăng ký: HP-111-TS
        Tên chủ tàu: D
        Địa chỉ: E
        Lmax: 15.0
        Công suất: 200
        Vật liệu: Nhựa FRP
        Hình thức kiểm tra: Kiểm tra ABC
        Có giá trị đến: 99/99/9999
        Ngày cấp: InvalidDate
        """,
    )

    vessel = parse_docx(path)

    assert vessel.valid_until.isoformat() == "2024-01-01"
    assert vessel.issued_date.isoformat() == "2020-01-01"
    assert vessel.inspection_type == InspectionTypeEnum.GIAM_SAT


def test_parse_table_based_docx_fields(table_docx_factory):
    """Parser doc duoc DOCX co du lieu nam trong bang key/value."""
    path = table_docx_factory(
        "table.docx",
        [
            ("Số đăng ký", "BD-77777-TS"),
            ("Tên chủ tàu", "Chủ tàu bảng"),
            ("Địa chỉ", "Bình Định"),
            ("Lmax", "24,5 m"),
            ("Công suất", "450 KW"),
            ("Vật liệu", "Thép"),
            ("Hình thức kiểm tra", "Hàng năm"),
        ],
    )

    vessel = parse_docx(path)

    assert vessel.registration_number == "BD-77777-TS"
    assert vessel.lmax == 24.5
    assert vessel.power_kw == 450.0
    assert vessel.material == MaterialEnum.THEP
