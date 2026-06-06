from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.vessel import VesselORM

router = APIRouter(
    prefix="/vessels",
    tags=["vessels"]
)

# Mappings for frontend/backend inspection type conversion
INSPECTION_LABELS = {
    'hang_nam': 'HN',
    'tren_da': 'TĐ',
    'dinh_ky': 'ĐK',
    'giam_sat': 'GS',
    'cai_hoan': 'BT',
    'bat_thuong': 'BT',
    'lan_dau': 'ĐM',
    'dong_moi': 'ĐM'
}

INSPECTION_REVERSE_MAP = {
    'HN': 'hang_nam',
    'TĐ': 'tren_da',
    'ĐK': 'dinh_ky',
    'GS': 'giam_sat',
    'BT': 'cai_hoan',
    'ĐM': 'dong_moi'
}

@router.get("/")
def get_vessels(
    skip: int = 0,
    limit: int = 20,
    province_code: Optional[str] = None,
    inspection_type: Optional[str] = None,
    length_group: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(VesselORM)
    
    if province_code:
        query = query.filter(VesselORM.province_code == province_code)
    if inspection_type:
        db_type = INSPECTION_REVERSE_MAP.get(inspection_type, inspection_type)
        query = query.filter(VesselORM.inspection_type == db_type)
    if length_group:
        query = query.filter(VesselORM.length_group == length_group)
        
    total = query.count()
    items = query.order_by(VesselORM.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "items": [
            {
                "id": item.id,
                "reg": item.registration_no,
                "owner": item.owner_name,
                "address": item.address,
                "prov": item.province_code,
                "lmax": item.lmax,
                "material": item.material,
                "type": INSPECTION_LABELS.get(item.inspection_type, item.inspection_type),
                "date": item.inspection_date,
                "expire": item.valid_until,
                "job": item.fishing_gear,
                "source_filename": item.source_filename,
                "created_at": item.created_at.strftime("%d/%m/%Y %H:%M") if item.created_at else ""
            }
            for item in items
        ]
    }

@router.get("/dashboard-stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_vessels = db.query(VesselORM).count()
    
    # Đếm số lượng upload trong tháng hiện tại
    now = datetime.now()
    uploads_this_month = db.query(VesselORM).filter(
        extract('month', VesselORM.created_at) == now.month,
        extract('year', VesselORM.created_at) == now.year
    ).count()
    
    # Số tàu theo tỉnh (Top 6)
    prov_stats = db.query(
        VesselORM.province_code, 
        func.count(VesselORM.id).label('count')
    ).group_by(VesselORM.province_code).order_by(func.count(VesselORM.id).desc()).limit(6).all()
    
    bar_data = [{"name": p.province_code, "count": p.count} for p in prov_stats if p.province_code]
    
    # Phân loại theo hình thức KT
    type_stats = db.query(
        VesselORM.inspection_type,
        func.count(VesselORM.id).label('count')
    ).group_by(VesselORM.inspection_type).all()
    
    pie_data = [{"name": INSPECTION_LABELS.get(t.inspection_type, t.inspection_type), "value": t.count} for t in type_stats if t.inspection_type]
    
    # Recent uploads
    recent = db.query(VesselORM).order_by(VesselORM.created_at.desc()).limit(8).all()
    recent_uploads = [
        {
            "id": r.id,
            "file": r.source_filename or f"Hồ sơ {r.registration_no}",
            "reg": r.registration_no,
            "owner": r.owner_name,
            "prov": r.province_code,
            "type": INSPECTION_LABELS.get(r.inspection_type, r.inspection_type),
            "time": r.created_at.strftime("%d/%m/%Y %H:%M") if r.created_at else "",
            "status": "success"
        }
        for r in recent
    ]
    
    return {
        "stats": [
            { "label": "Tổng tàu trong DB", "value": str(total_vessels), "subtitle": "Toàn bộ dữ liệu", "trend": "up" },
            { "label": "Upload tháng này", "value": str(uploads_this_month), "subtitle": "Mới cập nhật", "trend": "up" },
            { "label": "Báo cáo đã xuất", "value": "0", "subtitle": "Trong quý này", "trend": "up" }
        ],
        "barData": bar_data,
        "pieData": pie_data,
        "recentUploads": recent_uploads
    }
