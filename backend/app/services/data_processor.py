from typing import Dict, List, Any


PROVINCE_MAP = {
    'QN':  'Quảng Ninh',
    'TH':  'Thanh Hóa',
    'NA':  'Nghệ An',
    'HT':  'Hà Tĩnh',
    'NB':  'Ninh Bình',
    'NĐ':  'Nam Định',
    'QNg': 'Quảng Ngãi',
    'QT':  'Quảng Trị',
    'TB':  'Thái Bình',
    'HY':  'Hưng Yên',
    'HP':  'Hải Phòng',
}


def classify_length_group(lmax: float) -> str:
    """Classify vessel length into a group bucket.
    """
    if lmax < 12:
        return 'duoi_12'
    if lmax < 15:
        return 'L12_15'
    if lmax < 20:
        return 'L15_20'
    if lmax < 24:
        return 'L20_24'
    if lmax < 30:
        return 'L24_30'
    return 'L30_plus'


def get_province_name(code: str) -> str:
    """Look up full province name from a two‑letter code.

    Returns the *code* itself if no mapping is found.
    """
    # Xử lý QNg đặc biệt
    search_code = "QNg" if code and code.upper() in ["QNG", "QNGAI"] else code
    return PROVINCE_MAP.get(search_code, code)


def map_to_report_category(inspection_type: str) -> str:
    """Ánh xạ inspection_type từ DB sang category trong Báo cáo."""
    mapping = {
        'hang_nam': 'hang_nam',
        'tren_da':  'tren_da',
        'dinh_ky':  'dinh_ky',
        'bat_thuong': 'cai_hoan',    # !! Bất thường → Cải hoán !!
        'cai_hoan': 'cai_hoan',
        'lan_dau':  'dong_moi',      # Lần đầu → Đóng mới
        'dong_moi': 'dong_moi',
        'giam_sat': None,            # Giám sát KHÔNG xuất hiện trong Báo cáo
    }
    return mapping.get(inspection_type)


def count_for_cell(vessels: List[Any], province: str, length_group: str, material: str, inspection_category: str) -> int:
    """
    Đếm số lượng tàu cho một ô cụ thể trong báo cáo quý.
    Nếu inspection_category là 'ALL', đếm tất cả các hình thức.
    """
    count = 0
    for v in vessels:
        if v.province_code != province:
            continue
        if v.length_group != length_group:
            continue
        if v.material != material:
            continue
        
        if inspection_category == 'ALL':
            count += 1
        else:
            rep_cat = map_to_report_category(v.inspection_type)
            if rep_cat == inspection_category:
                count += 1
    return count
