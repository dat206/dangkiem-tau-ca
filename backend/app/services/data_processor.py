"""Data Processor – Xử lý và tổng hợp dữ liệu tàu cá.

Provides helpers to classify vessel length groups, look up province
names, and aggregate lists of parsed vessel data.
"""

from typing import Dict, List, Any

from app.utils.constants import LENGTH_GROUPS, PROVINCE_CODES


def classify_length_group(lmax: float) -> str:
    """Classify vessel length into a group bucket.

    Args:
        lmax: Maximum vessel length in metres.

    Returns:
        Length group string like ``'12-15m'``, ``'15-20m'``, etc.
        Returns ``'Không xác định'`` if *lmax* is below 12 m.
    """
    for group_name, (min_val, max_val) in LENGTH_GROUPS.items():
        if min_val <= lmax < max_val:
            return group_name
    return "Không xác định"


def get_province_name(code: str) -> str:
    """Look up full province name from a two‑letter code.

    Returns the *code* itself if no mapping is found.
    """
    return PROVINCE_CODES.get(code.upper(), code)


def aggregate_vessels(vessels: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Group and count vessels by province, length group, and material.

    Args:
        vessels: List of vessel dictionaries (as returned by batch processor).

    Returns:
        Dictionary with aggregation results::

            {
                "by_province": {"QN": 5, "TH": 3, ...},
                "by_length_group": {"12-15m": 2, "15-20m": 4, ...},
                "by_material": {"Gỗ": 3, "Thép": 2, ...},
                "by_inspection_type": {"Hàng năm": 4, ...},
                "total": 8,
            }
    """
    by_province: Dict[str, int] = {}
    by_length: Dict[str, int] = {}
    by_material: Dict[str, int] = {}
    by_inspection: Dict[str, int] = {}

    for v in vessels:
        prov = v.get("ma_tinh") or v.get("province_code") or "N/A"
        by_province[prov] = by_province.get(prov, 0) + 1

        lmax = v.get("lmax", 0)
        lg = classify_length_group(float(lmax)) if lmax else "Không xác định"
        by_length[lg] = by_length.get(lg, 0) + 1

        mat = v.get("vat_lieu") or v.get("material") or "Không xác định"
        by_material[mat] = by_material.get(mat, 0) + 1

        insp = (
            v.get("hinh_thuc_kiem_tra")
            or v.get("inspection_type")
            or "Không xác định"
        )
        by_inspection[insp] = by_inspection.get(insp, 0) + 1

    return {
        "by_province": by_province,
        "by_length_group": by_length,
        "by_material": by_material,
        "by_inspection_type": by_inspection,
        "total": len(vessels),
    }
