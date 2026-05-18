import re
import docx
from pydantic import BaseModel
from typing import Optional

class ParseError(Exception):
    pass

class VesselData(BaseModel):
    so_dang_ky: str
    ma_tinh: str
    lmax: float
    hinh_thuc_kiem_tra: str
    cap_tau: str
    ho_ten: Optional[str] = ""
    dia_chi: Optional[str] = ""
    may_chinh: Optional[float] = 0.0
    han_dk: Optional[str] = ""
    nghe: Optional[str] = ""

INSPECTION_TYPES = {
    "ĐK": "Định kỳ",
    "HN": "Hàng năm",
    "TĐ": "Trên đà",
    "GS": "Giám sát",
    "CH": "Cải hoán"
}

def clean_inline_text(text: str) -> str:
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def extract_value(pattern, text):
    match = re.search(pattern, text, re.I)
    if match:
        val = match.group(1).strip()
        if ':' in val:
            val = val.split(':')[-1].strip()
        return val
    return ""

def extract_float(pattern, text):
    match = re.search(pattern, text, re.I)
    if match:
        val_str = match.group(1)
        num_match = re.search(r'([\d,.]+)', val_str)
        if num_match:
            try:
                return float(num_match.group(1).replace(',', '.'))
            except:
                pass
    return 0.0

def parse_vessel_docx(file_path: str) -> VesselData:
    try:
        doc = docx.Document(file_path)
    except Exception as e:
        raise ParseError(f"Không thể đọc file DOCX: {str(e)}")

    full_text_blocks = []
    
    for para in doc.paragraphs:
        cleaned = clean_inline_text(para.text)
        if cleaned:
            full_text_blocks.append(cleaned)

    for table in doc.tables:
        for row in table.rows:
            row_texts = [clean_inline_text(cell.text) for cell in row.cells if clean_inline_text(cell.text)]
            if row_texts:
                full_text_blocks.append(" | ".join(row_texts))

    full_text = "\n".join(full_text_blocks)

    so_dk_match = re.search(r'([a-zA-ZĐđ]{2}\s*-\s*\d+\s*-\s*[tT][sS])', full_text)
    if so_dk_match:
        so_dang_ky = so_dk_match.group(1).replace(" ", "").upper()
        ma_tinh = so_dang_ky.split('-')[0]
    else:
        so_dang_ky = ""
        ma_tinh = ""

    hinh_thuc_kiem_tra = "Không xác định"
    so_chung_nhan_match = re.search(r'Số[^\n]*?:\s*[\d\.]+/(ĐK|HN|TĐ|GS|CH)', full_text, re.I)
    if so_chung_nhan_match:
        ma_hk = so_chung_nhan_match.group(1).upper()
        hinh_thuc_kiem_tra = INSPECTION_TYPES.get(ma_hk, ma_hk)
    else:
        ht_match = extract_value(r"(?:Hình thức kiểm tra|Loại kiểm tra)[^\n]*?:\s*([^\n]+)", full_text)
        ht_val = ht_match.lower()
        if "định kỳ" in ht_val: hinh_thuc_kiem_tra = "Định kỳ"
        elif "hàng năm" in ht_val: hinh_thuc_kiem_tra = "Hàng năm"
        elif "trên đà" in ht_val: hinh_thuc_kiem_tra = "Trên đà"
        elif "giám sát" in ht_val: hinh_thuc_kiem_tra = "Giám sát"
        lmax = extract_float(r"(?:Lmax|Chiều dài lớn nhất)[^\n]*?:\s*([^\n]+)", full_text)
    may_chinh = extract_float(r"(?:công suất máy chính|Công suất)[^\n]*?:\s*([^\n]+)", full_text)
    
    ho_ten = ""
    m_ho_ten = re.search(r'(?:Chủ tàu|Họ và tên)[^:]*:[^:]*:\s*([^;\n\|]+)', full_text, re.I)
    if m_ho_ten: ho_ten = m_ho_ten.group(1).strip()
    
    dia_chi = ""
    m_dia_chi = re.search(r'Địa chỉ[^:]*:\s*([^;\n\|]+)', full_text, re.I)
    if m_dia_chi:
        dia_chi = m_dia_chi.group(1).strip()
        if dia_chi.lower().startswith('(address)'):
            dia_chi = dia_chi[9:].strip(': \t')
        
        # Format as [Mã Tỉnh], [Tên Phường/Xã] if matched
        m_ward = re.search(r'(?:xã|phường|thị trấn)\s+([^,]+)', dia_chi, re.I)
        if m_ward and ma_tinh:
            dia_chi = f"{ma_tinh}, {m_ward.group(1).strip()}"
            
    nghe = ""
    m_nghe = re.search(r'(?:Công dụng|Nghề)[^:]*:\s*([^;\n\|U]+)', full_text, re.I)
    if m_nghe: nghe = m_nghe.group(1).strip()
    
    han_dk = ""
    m_han = re.search(r'(?:có hiệu lực đến|giá trị đến hết ngày|Hạn đăng kiểm)[^\n]*?:\s*([^\n\|]+)', full_text, re.I)
    if m_han:
        date_str = m_han.group(1)
        dm = re.search(r'ngày\s+(\d+)\s+tháng\s+(\d+)\s+năm\s+(\d+)', date_str, re.I)
        if dm:
            han_dk = f"{int(dm.group(1)):02d}/{int(dm.group(2)):02d}/{dm.group(3)}"
        else:
            dm2 = re.search(r'(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})', date_str)
            if dm2:
                han_dk = dm2.group(1)

    cap_tau = "Không xác định"
    for table in doc.tables:
        table_rows = [[clean_inline_text(cell.text) for cell in row.cells] for row in table.rows]
        if len(table_rows) >= 2 and "Cấp tàu" in table_rows[0][0]:
            header_row = table_rows[0]
            value_row = table_rows[1]
            for cap_name in ["Hạn chế III", "Hạn chế II", "Hạn chế I", "Không hạn chế"]:
                for idx, cell_val in enumerate(header_row):
                    if cap_name in cell_val:
                        if idx < len(value_row) and value_row[idx].strip().upper() == "X":
                            cap_tau = cap_name
                            break
                if cap_tau != "Không xác định": break

    return VesselData(
        so_dang_ky=so_dang_ky,
        ma_tinh=ma_tinh,
        lmax=lmax,
        hinh_thuc_kiem_tra=hinh_thuc_kiem_tra,
        cap_tau=cap_tau,
        ho_ten=ho_ten,
        dia_chi=dia_chi,
        may_chinh=may_chinh,
        han_dk=han_dk,
        nghe=nghe
    )