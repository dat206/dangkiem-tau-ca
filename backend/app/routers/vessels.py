from datetime import date, datetime
import csv
from io import StringIO
from typing import Optional

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.vessel import ReportHistoryORM, VesselORM

router = APIRouter(
    prefix="/vessels",
    tags=["vessels"],
)


INSPECTION_LABELS = {
    "hang_nam": "HN",
    "tren_da": "TĐ",
    "dinh_ky": "ĐK",
    "giam_sat": "GS",
    "cai_hoan": "BT",
    "bat_thuong": "BT",
    "lan_dau": "ĐM",
    "dong_moi": "ĐM",
}

INSPECTION_REVERSE_MAP = {
    "HN": ["hang_nam", "HN"],
    "TĐ": ["tren_da", "TĐ"],
    "ĐK": ["dinh_ky", "ĐK"],
    "GS": ["giam_sat", "GS"],
    "BT": ["cai_hoan", "bat_thuong", "BT"],
    "ĐM": ["lan_dau", "dong_moi", "ĐM"],
}

INSPECTION_OPTIONS = [
    {"value": "HN", "label": "Hàng năm (HN)"},
    {"value": "TĐ", "label": "Trên đà (TĐ)"},
    {"value": "ĐK", "label": "Định kỳ (ĐK)"},
    {"value": "GS", "label": "Giám sát (GS)"},
    {"value": "BT", "label": "Bất thường / cải hoán (BT)"},
    {"value": "ĐM", "label": "Lần đầu / đóng mới (ĐM)"},
]

LENGTH_LABELS = {
    "duoi_12": "< 12m",
    "L12_15": "12 - 15m",
    "L15_20": "15 - 20m",
    "L20_24": "20 - 24m",
    "L24_30": "24 - 30m",
    "L30_plus": ">= 30m",
    "khong_xac_dinh": "Không xác định",
}

LEGACY_LENGTH_MAP = {
    "<12": "duoi_12",
    "12-15": "L12_15",
    "15-20": "L15_20",
    "20-24": "L20_24",
    "24-30": "L24_30",
    ">30": "L30_plus",
    ">=30": "L30_plus",
}


def _format_date(value):
    if not value:
        return ""
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def _format_datetime(value):
    if not value:
        return ""
    if isinstance(value, datetime):
        return value.strftime("%d/%m/%Y %H:%M")
    return str(value)


def _inspection_label(value: Optional[str]) -> str:
    if not value:
        return ""
    return INSPECTION_LABELS.get(value, value)


def _inspection_filter_values(value: str) -> list[str]:
    return INSPECTION_REVERSE_MAP.get(value, [value])


def _length_filter_value(value: str) -> str:
    return LEGACY_LENGTH_MAP.get(value, value)


def _apply_vessel_filters(
    query,
    *,
    search: Optional[str] = None,
    province_code: Optional[str] = None,
    inspection_type: Optional[str] = None,
    length_group: Optional[str] = None,
):
    if search:
        keyword = f"%{search.strip()}%"
        query = query.filter(
            or_(
                VesselORM.registration_no.ilike(keyword),
                VesselORM.owner_name.ilike(keyword),
                VesselORM.address.ilike(keyword),
                VesselORM.source_filename.ilike(keyword),
            )
        )

    if province_code:
        query = query.filter(VesselORM.province_code == province_code.strip().upper())

    if inspection_type:
        query = query.filter(VesselORM.inspection_type.in_(_inspection_filter_values(inspection_type)))

    if length_group:
        query = query.filter(VesselORM.length_group == _length_filter_value(length_group))

    return query


def _serialize_vessel(item: VesselORM) -> dict:
    return {
        "id": item.id,
        "reg": item.registration_no or "",
        "owner": item.owner_name or "",
        "address": item.address or "",
        "address_short": item.address_short or "",
        "prov": item.province_code or "",
        "lmax": item.lmax,
        "power_kw": item.power_kw,
        "material": item.material or "",
        "type": _inspection_label(item.inspection_type),
        "inspection_type": item.inspection_type or "",
        "length_group": item.length_group or "",
        "length_label": LENGTH_LABELS.get(item.length_group, item.length_group or ""),
        "date": _format_date(item.inspection_date),
        "expire": _format_date(item.valid_until),
        "issued_date": _format_date(item.issued_date),
        "job": item.fishing_gear or "",
        "source_filename": item.source_filename or "",
        "created_at": _format_datetime(item.created_at),
    }


def _next_month_start(today: date) -> datetime:
    if today.month == 12:
        return datetime(today.year + 1, 1, 1)
    return datetime(today.year, today.month + 1, 1)


def _current_quarter_range(today: date) -> tuple[datetime, datetime]:
    start_month = ((today.month - 1) // 3) * 3 + 1
    start = datetime(today.year, start_month, 1)
    if start_month == 10:
        end = datetime(today.year + 1, 1, 1)
    else:
        end = datetime(today.year, start_month + 3, 1)
    return start, end


@router.get("/options")
def get_vessel_options(db: Session = Depends(get_db)):
    province_rows = (
        db.query(VesselORM.province_code, func.count(VesselORM.id).label("count"))
        .filter(VesselORM.province_code.isnot(None), VesselORM.province_code != "")
        .group_by(VesselORM.province_code)
        .order_by(VesselORM.province_code.asc())
        .all()
    )

    length_counts = {
        row.length_group: row.count
        for row in db.query(VesselORM.length_group, func.count(VesselORM.id).label("count"))
        .group_by(VesselORM.length_group)
        .all()
        if row.length_group
    }

    return {
        "provinces": [
            {"value": row.province_code, "label": row.province_code, "count": row.count}
            for row in province_rows
        ],
        "inspectionTypes": INSPECTION_OPTIONS,
        "lengthGroups": [
            {"value": value, "label": label, "count": length_counts.get(value, 0)}
            for value, label in LENGTH_LABELS.items()
        ],
    }


@router.get("/export")
def export_vessels_csv(
    search: Optional[str] = None,
    province_code: Optional[str] = None,
    inspection_type: Optional[str] = None,
    length_group: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = _apply_vessel_filters(
        db.query(VesselORM),
        search=search,
        province_code=province_code,
        inspection_type=inspection_type,
        length_group=length_group,
    )
    items = query.order_by(VesselORM.created_at.desc(), VesselORM.id.desc()).all()

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "STT",
            "Số đăng ký",
            "Chủ tàu",
            "Địa chỉ",
            "Tỉnh",
            "Lmax (m)",
            "Công suất (kW)",
            "Vật liệu",
            "Hình thức KT",
            "Nhóm Lmax",
            "Ngày KT",
            "Hạn ĐK",
            "Nghề hoạt động",
            "File nguồn",
            "Ngày nhập",
        ]
    )
    for index, item in enumerate(items, start=1):
        row = _serialize_vessel(item)
        writer.writerow(
            [
                index,
                row["reg"],
                row["owner"],
                row["address"],
                row["prov"],
                row["lmax"],
                row["power_kw"],
                row["material"],
                row["type"],
                row["length_label"],
                row["date"],
                row["expire"],
                row["job"],
                row["source_filename"],
                row["created_at"],
            ]
        )

    filename = f"du_lieu_tau_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        content=output.getvalue().encode("utf-8-sig"),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/")
def get_vessels(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=500),
    search: Optional[str] = None,
    province_code: Optional[str] = None,
    inspection_type: Optional[str] = None,
    length_group: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = _apply_vessel_filters(
        db.query(VesselORM),
        search=search,
        province_code=province_code,
        inspection_type=inspection_type,
        length_group=length_group,
    )

    total = query.count()
    items = query.order_by(VesselORM.created_at.desc(), VesselORM.id.desc()).offset(skip).limit(limit).all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": [_serialize_vessel(item) for item in items],
    }


@router.get("/dashboard-stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    today = date.today()
    month_start = datetime(today.year, today.month, 1)
    month_end = _next_month_start(today)
    quarter_start, quarter_end = _current_quarter_range(today)

    total_vessels = db.query(VesselORM).count()
    uploaded_this_month = (
        db.query(VesselORM)
        .filter(VesselORM.created_at >= month_start, VesselORM.created_at < month_end)
        .count()
    )
    reports_this_quarter = (
        db.query(ReportHistoryORM)
        .filter(ReportHistoryORM.created_at >= quarter_start, ReportHistoryORM.created_at < quarter_end)
        .count()
    )

    prov_stats = (
        db.query(VesselORM.province_code, func.count(VesselORM.id).label("count"))
        .filter(VesselORM.province_code.isnot(None), VesselORM.province_code != "")
        .group_by(VesselORM.province_code)
        .order_by(func.count(VesselORM.id).desc())
        .limit(6)
        .all()
    )
    bar_data = [{"name": row.province_code, "count": row.count} for row in prov_stats]

    raw_type_stats = (
        db.query(VesselORM.inspection_type, func.count(VesselORM.id).label("count"))
        .filter(VesselORM.inspection_type.isnot(None), VesselORM.inspection_type != "")
        .group_by(VesselORM.inspection_type)
        .all()
    )
    type_totals: dict[str, int] = {}
    for row in raw_type_stats:
        label = _inspection_label(row.inspection_type)
        type_totals[label] = type_totals.get(label, 0) + row.count
    pie_data = [{"name": label, "value": count} for label, count in sorted(type_totals.items())]

    recent = db.query(VesselORM).order_by(VesselORM.created_at.desc(), VesselORM.id.desc()).limit(8).all()
    recent_uploads = [
        {
            "id": item.id,
            "file": item.source_filename or f"Hồ sơ {item.registration_no or item.id}",
            "reg": item.registration_no or "",
            "owner": item.owner_name or "",
            "prov": item.province_code or "",
            "type": _inspection_label(item.inspection_type),
            "time": _format_datetime(item.created_at),
            "status": "success",
        }
        for item in recent
    ]

    return {
        "stats": [
            {
                "label": "Tổng tàu trong DB",
                "value": str(total_vessels),
                "subtitle": "Toàn bộ dữ liệu",
                "trend": "up",
            },
            {
                "label": "Upload tháng này",
                "value": str(uploaded_this_month),
                "subtitle": f"Tháng {today.month}/{today.year}",
                "trend": "up",
            },
            {
                "label": "Báo cáo đã xuất",
                "value": str(reports_this_quarter),
                "subtitle": "Trong quý này",
                "trend": "up",
            },
        ],
        "barData": bar_data,
        "pieData": pie_data,
        "recentUploads": recent_uploads,
    }
