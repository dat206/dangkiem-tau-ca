"""DOCX parser service for vessel certificate files.

Extracts structured vessel data from the standardised DOCX format
used for Vietnamese fishing vessel safety certificates.

See docs/field_mapping.md for the coordinate mapping specification.
"""

from __future__ import annotations

import re
import unicodedata
from datetime import date
from pathlib import Path
from typing import BinaryIO, Optional
from zipfile import BadZipFile

from docx import Document
from docx.opc.exceptions import PackageNotFoundError
from pydantic import BaseModel, ValidationError

from app.models.vessel import (
    InspectionTypeEnum,
    LengthGroupEnum,
    MaterialEnum,
    VesselData as ParsedVesselData,
)


class DocxParserError(Exception):
    """Raised when a DOCX vessel certificate cannot be parsed."""


class ParseError(DocxParserError):
    """Backward-compatible parser exception used by the batch upload flow."""


class VesselData(BaseModel):
    """Parsed vessel data extracted from a certificate DOCX (Vietnamese field names)."""

    so_dang_ky: str
    ma_tinh: str
    lmax: float
    hinh_thuc_kiem_tra: str
    cap_tau: str = "Không xác định"
    ho_ten: Optional[str] = ""
    dia_chi: Optional[str] = ""
    may_chinh: Optional[float] = 0.0
    vat_lieu: Optional[str] = ""
    han_dk: Optional[str] = ""
    nghe: Optional[str] = ""
    ngay_cap: Optional[str] = ""


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_REQUIRED_FIELDS = {
    "registration_number",
    "owner_name",
    "address",
    "lmax",
    "power_kw",
    "material",
    "inspection_type",
}

_LABEL_ALIASES = {
    "registration_number": ("so dang ky", "so dk", "registration number"),
    "owner_name": ("ten chu tau", "chu tau", "owner name"),
    "address": ("dia chi", "address"),
    "lmax": ("lmax", "chieu dai lon nhat"),
    "power_kw": ("cong suat", "cong suat may chinh", "power"),
    "material": ("vat lieu", "material"),
    "inspection_type": ("hinh thuc kiem tra", "loai kiem tra", "inspection type"),
    "valid_until": ("co gia tri den", "co hieu luc den", "han dang kiem", "valid until"),
    "issued_date": ("ngay cap", "issued date"),
    "fishing_gear": ("nghe", "cong dung", "fishing gear"),
}

_INSPECTION_CODES = {
    "DK": InspectionTypeEnum.DINH_KY,
    "HN": InspectionTypeEnum.HANG_NAM,
    "TD": InspectionTypeEnum.TREN_DA,
    "GS": InspectionTypeEnum.GIAM_SAT,
    "CH": InspectionTypeEnum.CAI_HOAN,
}

# Inspection type code mapping (Vietnamese labels)
INSPECTION_TYPES = {
    "ĐK": "Định kỳ",
    "HN": "Hàng năm",
    "TĐ": "Trên đà",
}

NUMBER_RE = re.compile(r"[-+]?\d+(?:[.,]\d+)?")
DATE_RE = re.compile(
    r"ngày\s*(\d{1,2})\s*tháng\s*(\d{1,2})\s*năm\s*(\d{4})", re.IGNORECASE
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def normalize_text(text: str) -> str:
    """Collapse whitespace and strip."""
    return re.sub(r"\s+", " ", text or "").strip()


def strip_english_suffix(text: str) -> str:
    """Remove trailing English labels commonly found in bilingual cells.

    E.g. ``'Gỗ Materials…………….…..'`` → ``'Gỗ'``
         ``'Lưới kéo. Used for'`` → ``'Lưới kéo'``
         ``'( Vessel's owner): Nguyễn Văn A'`` → ``'Nguyễn Văn A'``
    """
    # Remove leading English preamble like "( Vessel's owner):"
    text = re.sub(r"^\s*\(.*?\)\s*:?\s*", "", text)
    # Remove trailing English words, ellipsis, and punctuation
    text = re.sub(r"[.…]+\s*$", "", text)  # trailing dots/ellipsis
    text = re.sub(r"\s+[A-Za-z][A-Za-z'\s]*$", "", text)  # trailing English words
    return text.strip(". \t")


def extract_number(text: str) -> Optional[float]:
    """Extract the first number from *text*, handling Vietnamese comma decimals."""
    m = NUMBER_RE.search(normalize_text(text))
    if not m:
        return None
    return float(m.group(0).replace(",", "."))


def extract_date_vn(text: str) -> Optional[str]:
    """Extract Vietnamese date ``ngày X tháng Y năm Z`` → ``DD/MM/YYYY``."""
    m = DATE_RE.search(normalize_text(text))
    if not m:
        return None
    day, month, year = int(m.group(1)), int(m.group(2)), m.group(3)
    return f"{day:02d}/{month:02d}/{year}"


def safe_cell_text(table, row_idx: int, col_idx: int) -> str:
    """Get cell text safely, returning ``''`` if out of bounds."""
    try:
        if row_idx < len(table.rows):
            cells = table.rows[row_idx].cells
            if col_idx < len(cells):
                return normalize_text(cells[col_idx].text)
    except (IndexError, AttributeError):
        pass
    return ""


def _build_full_text(doc) -> str:
    """Build concatenated full-document text for fallback regex searches."""
    blocks: list[str] = []
    for para in doc.paragraphs:
        t = normalize_text(para.text)
        if t:
            blocks.append(t)
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                t = normalize_text(cell.text)
                if t:
                    blocks.append(t)
    return " | ".join(blocks)


# ---------------------------------------------------------------------------
# Low-level text-based parser (used as fallback / alternative strategy)
# ---------------------------------------------------------------------------

def parse_docx(docx_file: str | BinaryIO) -> ParsedVesselData:
    """Parse a DOCX vessel certificate and return structured vessel data."""

    text = _extract_text(docx_file)
    fields = _extract_fields(text)

    missing = sorted(field for field in _REQUIRED_FIELDS if not fields.get(field))
    if missing:
        raise DocxParserError(f"Missing required field(s): {', '.join(missing)}")

    registration_number = fields["registration_number"]
    lmax = _parse_float(fields["lmax"], "lmax")
    power_kw = _parse_float(fields["power_kw"], "power_kw")

    return ParsedVesselData(
        registration_number=registration_number,
        owner_name=fields["owner_name"],
        address=fields["address"],
        province_code=extract_province_code(registration_number),
        lmax=lmax,
        power_kw=power_kw,
        material=_parse_material(fields["material"]),
        inspection_type=_parse_inspection_type(fields["inspection_type"]),
        length_group=get_length_group(lmax),
        valid_until=_parse_date(fields.get("valid_until"), date(2024, 1, 1)),
        issued_date=_parse_date(fields.get("issued_date"), date(2020, 1, 1)),
        fishing_gear=fields.get("fishing_gear") or "Khong xac dinh",
    )


# ---------------------------------------------------------------------------
# Main coordinate-based parser
# ---------------------------------------------------------------------------

def parse_vessel_docx(file_path: str) -> VesselData:
    """Parse a fishing vessel safety certificate DOCX file.

    Uses coordinate-based extraction following ``docs/field_mapping.md``.
    Falls back to regex search on full text when coordinates miss.

    Args:
        file_path: Path to the ``.docx`` file.

    Returns:
        :class:`VesselData` with extracted fields.

    Raises:
        ParseError: If the file cannot be read or critical fields are missing.
    """
    try:
        doc = Document(file_path)
    except Exception as exc:
        raise ParseError(f"Không thể đọc file DOCX: {exc}")

    tables = doc.tables
    paragraphs = doc.paragraphs
    full_text = _build_full_text(doc)

    # ── 1. Inspection type from certificate number (T0 or full text) ──────
    hinh_thuc_kiem_tra = "Giám sát"
    cert_text = safe_cell_text(tables[0], 0, 0) if tables else ""
    cert_match = re.search(
        r"Số[^:]*:\s*[\d.]+/([a-zA-ZĐđ]+)", cert_text, re.IGNORECASE
    )
    if not cert_match:
        cert_match = re.search(
            r"Số[^:]*:\s*[\d.]+/([a-zA-ZĐđ]+)", full_text, re.IGNORECASE
        )
    if cert_match:
        ma_hk = cert_match.group(1).upper()
        hinh_thuc_kiem_tra = INSPECTION_TYPES.get(ma_hk, "Giám sát")

    # ── 2. Registration number (T1.R0.C1 → fallback full text) ────────────
    so_dang_ky = ""
    if len(tables) > 1:
        reg_text = safe_cell_text(tables[1], 0, 1)
        reg_match = re.search(r"([a-zA-ZĐđ]{2,4}\s*-\s*\d+\s*-\s*[Tt][Ss])", reg_text)
        if reg_match:
            so_dang_ky = reg_match.group(1).replace(" ", "").upper()

    if not so_dang_ky:
        reg_match = re.search(r"([a-zA-ZĐđ]{2,4}\s*-\s*\d+\s*-\s*[Tt][Ss])", full_text)
        if reg_match:
            so_dang_ky = reg_match.group(1).replace(" ", "").upper()

    if not so_dang_ky:
        raise ParseError("Không tìm thấy Số đăng ký")

    ma_tinh = so_dang_ky.split("-")[0]

    # ── 3. Owner name (P2 → fallback full text) ──────────────────────────
    ho_ten = ""
    if len(paragraphs) > 2:
        p2 = normalize_text(paragraphs[2].text)
        m = re.search(
            r"(?:Chủ tàu|[Oo]wner)\s*\)?\s*[:\s]*([^;]+?)(?:\s*;|\s*Quốc tịch|$)",
            p2,
            re.IGNORECASE,
        )
        if m:
            ho_ten = strip_english_suffix(m.group(1).strip(": "))

    if not ho_ten:
        m = re.search(
            r"(?:Chủ tàu|Họ và tên)[^:]*:[^:]*:?\s*([^;\n|]+)",
            full_text,
            re.IGNORECASE,
        )
        if m:
            ho_ten = m.group(1).strip()

    # ── 4. Address (P3 → fallback full text) ─────────────────────────────
    dia_chi = ""
    if len(paragraphs) > 3:
        p3 = normalize_text(paragraphs[3].text)
        m = re.search(
            r"Địa chỉ[^:]*:\s*(?:\(Address\)\s*:?\s*)?(.+)", p3, re.IGNORECASE
        )
        if m:
            dia_chi = m.group(1).strip()

    if not dia_chi:
        m = re.search(r"Địa chỉ[^:]*:\s*([^;\n|]+)", full_text, re.IGNORECASE)
        if m:
            raw = m.group(1).strip()
            if raw.lower().startswith("(address)"):
                raw = raw[9:].strip(": \t")
            dia_chi = raw

    # ── 5. Technical specs from T2 ───────────────────────────────────────
    # Fishing gear: T2.R0.C0
    nghe = ""
    if len(tables) > 2:
        t2r0c0 = safe_cell_text(tables[2], 0, 0)
        m = re.search(r"Công dụng[^:]*:\s*([^(\n]+)", t2r0c0, re.IGNORECASE)
        if m:
            nghe = strip_english_suffix(m.group(1).strip())

    if not nghe:
        m = re.search(
            r"(?:Công dụng|Nghề)[^:]*:\s*([^;\n|U]+)", full_text, re.IGNORECASE
        )
        if m:
            nghe = m.group(1).strip()

    # Hull material: T2.R0.C2 (may be in last cell of row due to merge)
    vat_lieu = ""
    if len(tables) > 2 and tables[2].rows:
        row0_cells = tables[2].rows[0].cells
        for cell in reversed(list(row0_cells)):
            ct = normalize_text(cell.text)
            m = re.search(r"Vật liệu[^:]*:\s*([^(\n]+)", ct, re.IGNORECASE)
            if m:
                vat_lieu = strip_english_suffix(m.group(1).strip())
                break

    if not vat_lieu:
        m = re.search(r"Vật liệu[^:]*:\s*([^(\n|]+)", full_text, re.IGNORECASE)
        if m:
            vat_lieu = m.group(1).strip()

    # Lmax: T2.R2.C0
    lmax = 0.0
    if len(tables) > 2:
        t2r2c0 = safe_cell_text(tables[2], 2, 0)
        if "Lmax" in t2r2c0 or "lmax" in t2r2c0.lower():
            after_label = t2r2c0.split("Lmax")[-1]
            cleaned = re.sub(r"\(.*?\)", "", after_label)
            val = extract_number(cleaned)
            if val and val > 0:
                lmax = val

    if lmax <= 0:
        m = re.search(
            r"(?:Chiều dài[^,]*,\s*Lmax|Lmax)[^:]*:\s*([^(\n|]+)",
            full_text,
            re.IGNORECASE,
        )
        if m:
            val = extract_number(m.group(1))
            if val and val > 0:
                lmax = val

    if lmax <= 0:
        raise ParseError("Không tìm thấy Chiều dài Lmax")

    # Engine power: T2.R4.C0
    may_chinh = 0.0
    if len(tables) > 2:
        t2r4c0 = safe_cell_text(tables[2], 4, 0)
        m = re.search(r"Ne\s*\(?KW\)?[^:]*:\s*([^(\n]+)", t2r4c0, re.IGNORECASE)
        if m:
            val = extract_number(m.group(1))
            if val:
                may_chinh = val

    if may_chinh <= 0:
        m = re.search(
            r"(?:công suất máy chính|Công suất|Ne)[^:]*:\s*([^(\n|]+)",
            full_text,
            re.IGNORECASE,
        )
        if m:
            val = extract_number(m.group(1))
            if val:
                may_chinh = val

    # ── 6. Operation class from T4 ───────────────────────────────────────
    cap_tau = "Không xác định"
    if len(tables) > 4:
        t4_rows = [
            [normalize_text(cell.text) for cell in row.cells]
            for row in tables[4].rows
        ]
        if len(t4_rows) >= 2:
            header = t4_rows[0]
            values = t4_rows[1]
            for cap_name in [
                "Hạn chế III",
                "Hạn chế II",
                "Hạn chế I",
                "Không hạn chế",
            ]:
                for idx, cell_val in enumerate(header):
                    if cap_name in cell_val and idx < len(values):
                        if values[idx].strip().upper() == "X":
                            cap_tau = cap_name
                            break
                if cap_tau != "Không xác định":
                    break

    # ── 7. Valid-until date (search paragraphs for effectiveness clause) ─
    han_dk = ""
    for para in paragraphs:
        pt = normalize_text(para.text).lower()
        if "hiệu lực đến" in pt or "giá trị đến" in pt:
            d = extract_date_vn(para.text)
            if d:
                han_dk = d
                break

    if not han_dk:
        m = re.search(
            r"(?:có hiệu lực đến|giá trị đến hết ngày|Hạn đăng kiểm)[^\n|]*",
            full_text,
            re.IGNORECASE,
        )
        if m:
            d = extract_date_vn(m.group(0))
            if d:
                han_dk = d

    # ── 8. Issued date from T5 (last table) ──────────────────────────────
    ngay_cap = ""
    if len(tables) > 5:
        t5r0c1 = safe_cell_text(tables[5], 0, 1)
        d = extract_date_vn(t5r0c1)
        if d:
            ngay_cap = d

    if not ngay_cap and tables:
        last_table = tables[-1]
        for row in last_table.rows:
            for cell in row.cells:
                d = extract_date_vn(normalize_text(cell.text))
                if d:
                    ngay_cap = d
                    break
            if ngay_cap:
                break

    # ── Build result ─────────────────────────────────────────────────────
    try:
        return VesselData(
            so_dang_ky=so_dang_ky,
            ma_tinh=ma_tinh,
            lmax=lmax,
            hinh_thuc_kiem_tra=hinh_thuc_kiem_tra,
            cap_tau=cap_tau,
            ho_ten=ho_ten,
            dia_chi=dia_chi,
            may_chinh=may_chinh,
            vat_lieu=vat_lieu,
            han_dk=han_dk,
            nghe=nghe,
            ngay_cap=ngay_cap,
        )
    except ValidationError as exc:
        raise ParseError(f"Lỗi xác thực dữ liệu: {exc}")


# ---------------------------------------------------------------------------
# Utility functions (used by parse_docx fallback path)
# ---------------------------------------------------------------------------

def get_length_group(length: float) -> LengthGroupEnum:
    """Return the vessel length group for a given Lmax value."""

    if length < 15:
        return LengthGroupEnum.G12_15
    if length < 20:
        return LengthGroupEnum.G15_20
    if length < 24:
        return LengthGroupEnum.G20_24
    if length < 30:
        return LengthGroupEnum.G24_30
    return LengthGroupEnum.G30_PLUS


def extract_province_code(registration_number: str) -> str:
    """Extract province code from registration number, e.g. QN-90599-TS."""

    match = re.match(r"\s*([A-Za-zĐđ]{1,4})\s*-", registration_number)
    if not match:
        raise DocxParserError("Invalid registration number format")
    return match.group(1).upper()


def _extract_text(docx_file: str | BinaryIO) -> str:
    try:
        document = Document(docx_file)
    except (PackageNotFoundError, BadZipFile, ValueError, TypeError, OSError) as exc:
        raise DocxParserError("Invalid DOCX format") from exc

    lines: list[str] = []
    lines.extend(paragraph.text for paragraph in document.paragraphs)

    for table in document.tables:
        for row in table.rows:
            cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
            if len(cells) >= 2:
                lines.append(f"{cells[0]}: {cells[1]}")
            elif cells:
                lines.append(cells[0])

    text = "\n".join(line.strip() for line in lines if line.strip())
    if not text:
        raise DocxParserError("Missing required field(s): empty document")
    return text


def _extract_fields(text: str) -> dict[str, str]:
    fields: dict[str, str] = {}

    certificate_code = re.search(r"Số[^\n]*?:\s*[\d.]+/([A-ZĐ]{2})", text, re.I)
    if certificate_code:
        inspection = _parse_inspection_code(certificate_code.group(1))
        if inspection:
            fields["inspection_type"] = inspection.value

    for line in text.splitlines():
        if ":" not in line:
            continue

        raw_label, raw_value = line.split(":", 1)
        label = _normalize(raw_label)
        value = raw_value.strip()

        for field, aliases in _LABEL_ALIASES.items():
            if label in aliases:
                fields[field] = value
                break

    if not fields:
        raise DocxParserError("Missing required field(s): no recognized fields")
    return fields


def _parse_float(value: str, field_name: str) -> float:
    match = re.search(r"\d+(?:[,.]\d+)?", value)
    if not match:
        raise DocxParserError(f"Invalid numeric value for {field_name}")
    return float(match.group(0).replace(",", "."))


def _parse_material(value: str) -> MaterialEnum:
    normalized = _normalize(value)
    if "frp" in normalized or "composite" in normalized:
        return MaterialEnum.FRP
    if "thep" in normalized:
        return MaterialEnum.THEP
    if "go" in normalized:
        return MaterialEnum.GO
    raise DocxParserError("Invalid material")


def _parse_inspection_code(value: str) -> InspectionTypeEnum | None:
    normalized = _normalize(value).upper().replace("Đ", "D")
    return _INSPECTION_CODES.get(normalized)


def _parse_inspection_type(value: str) -> InspectionTypeEnum:
    code_match = re.fullmatch(r"\s*([A-ZĐ]{2})\s*", value, re.I)
    if code_match:
        by_code = _parse_inspection_code(code_match.group(1))
        if by_code:
            return by_code

    normalized = _normalize(value)
    if "hang nam" in normalized:
        return InspectionTypeEnum.HANG_NAM
    if "dinh ky" in normalized:
        return InspectionTypeEnum.DINH_KY
    if "tren da" in normalized:
        return InspectionTypeEnum.TREN_DA
    if "cai hoan" in normalized:
        return InspectionTypeEnum.CAI_HOAN
    if "giam sat" in normalized:
        return InspectionTypeEnum.GIAM_SAT
    return InspectionTypeEnum.GIAM_SAT


def _parse_date(value: str | None, default: date) -> date:
    if not value:
        return default

    match = re.search(r"(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})", value)
    if not match:
        match = re.search(r"ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})", value, re.I)
    if not match:
        return default

    day, month, year = (int(part) for part in match.groups())
    if year < 100:
        year += 2000
    try:
        return date(year, month, day)
    except ValueError:
        return default


def _normalize(value: str) -> str:
    decomposed = unicodedata.normalize("NFD", value)
    without_marks = "".join(
        character for character in decomposed if unicodedata.category(character) != "Mn"
    )
    without_marks = without_marks.replace("đ", "d").replace("Đ", "D")
    return re.sub(r"\s+", " ", without_marks.strip().lower())
