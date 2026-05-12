"""Hằng số - Tỉnh, nhóm Lmax, vật liệu"""

# Mapping mã tỉnh
PROVINCE_CODES = {
    "QN": "Quảng Ninh",
    "TH": "Thanh Hóa",
    "HT": "Hà Tĩnh",
    "NB": "Ninh Bình",
    "NA": "Nam Định",
    "NG": "Nghệ An",
    "CT": "Cà Mau",
    "KG": "Kiên Giang",
    "BD": "Bạc Liêu",
    "SL": "Sóc Trăng",
}

# Nhóm chiều dài tàu (Lmax)
LENGTH_GROUPS = {
    "12-15m": (12, 15),
    "15-20m": (15, 20),
    "20-24m": (20, 24),
    "24-30m": (24, 30),
    "≥30m": (30, float("inf")),
}

# Vật liệu tàu
MATERIALS = ["Gỗ", "Thép", "FRP"]

# Hình thức kiểm tra
INSPECTION_TYPES = ["Hàng năm", "Định kỳ", "Trên đà", "Giám sát", "Cải hoán"]
