"""DOCX Parser for fishing vessel safety certificates.

Extracts structured vessel data from the standardised DOCX format
used for Vietnamese fishing vessel safety certificates.

See docs/field_mapping.md for the coordinate mapping specification.
"""

import re
from typing import Optional

from docx import Document
from pydantic import BaseModel, ValidationError


class ParseError(Exception):
    """Raised when DOCX parsing fails."""


class VesselData(BaseModel):
    """Parsed vessel data extracted from a certificate DOCX."""

    so_dang_ky: str
    ma_tinh: str
    lmax: float
    hinh_thuc_kiem_tra: str
    cap_tau: str
    ho_ten: Optional[str] = ""
    dia_chi: Optional[str] = ""
    may_chinh: Optional[float] = 0.0
    vat_lieu: Optional[str] = ""
    han_dk: Optional[str] = ""
    nghe: Optional[str] = ""
    ngay_cap: Optional[str] = ""


# Inspection type code mapping
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
    """Build concatenated full‑document text for fallback regex searches."""
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
# Main parser
# ---------------------------------------------------------------------------

def parse_vessel_docx(file_path: str) -> VesselData:
    """Parse a fishing vessel safety certificate DOCX file.

    Uses coordinate‑based extraction following ``docs/field_mapping.md``.
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
            r"(?:Chủ tàu|[Oo]wner)\s*\)?[:\s]*([^;]+?)(?:\s*;|\s*Quốc tịch|$)",
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

    # ── 7. Valid‑until date (search paragraphs for effectiveness clause) ─
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