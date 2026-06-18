
import tempfile
import zipfile
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from fastapi.responses import FileResponse
from sqlalchemy import extract
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.vessel import VesselORM, ReportHistoryORM
from app.services.data_processor import get_province_name
from app.services.excel_generator import generate_vessel_excel, generate_quarterly_summary_excel
router = APIRouter(
    prefix="/reports",
    tags=["reports"]
)
COASTAL_PROVINCES = [
    {"code": "QN", "name": "Quảng Ninh"},
    {"code": "HP", "name": "Hải Phòng"},
    {"code": "TB", "name": "Thái Bình"},
    {"code": "ND", "name": "Nam Định"},
    {"code": "TH", "name": "Thanh Hóa"},
    {"code": "NA", "name": "Nghệ An"},
    {"code": "HT", "name": "Hà Tĩnh"},
    {"code": "QB", "name": "Quảng Bình"},
    {"code": "QT", "name": "Quảng Trị"},
    {"code": "DN", "name": "Đà Nẵng"},
    {"code": "QNG", "name": "Quảng Ngãi"},
    {"code": "BDI", "name": "Bình Định"},
    {"code": "KH", "name": "Khánh Hòa"},
    {"code": "NT", "name": "Ninh Thuận"},
    {"code": "BT", "name": "Bình Thuận"},
]
FILE_TYPE_NAMES = {
    "registry": "Bảng kê tổng hợp",
    "summary": "Báo cáo quý theo tỉnh",
}
def _quarter_date_range(quarter: int, year: int) -> tuple[datetime, datetime]:
    start_month = (quarter - 1) * 3 + 1
    start = datetime(year, start_month, 1)
    end = datetime(year + 1, 1, 1) if quarter == 4 else datetime(year, start_month + 3, 1)
    return start, end
def _parse_vessel_date(value: str | date | datetime | None) -> Optional[datetime]:
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, date):
        return datetime.combine(value, datetime.min.time())
    for date_format in ("%d/%m/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(value, date_format)
        except (TypeError, ValueError):
            continue
    return None
def _vessel_in_period(vessel: VesselORM, quarter: int, year: int) -> bool:
    start, end = _quarter_date_range(quarter, year)
    date_value = _parse_vessel_date(vessel.inspection_date) or _parse_vessel_date(vessel.issued_date) or vessel.created_at
    return bool(date_value and start <= date_value < end)
def _split_csv(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]
def _normalize_province_code(code: str | None) -> str:
    if not code:
        return ""
    normalized = code.strip().upper()
    aliases = {"NĐ": "ND", "ĐN": "DN", "BĐ": "BDI", "QNI": "QNG"}
    return aliases.get(normalized, normalized)
def _province_name(code: str) -> str:
    province = next((item for item in COASTAL_PROVINCES if item["code"] == code), None)
    return province["name"] if province else get_province_name(code)
def _query_period_vessels(db: Session, quarter: int, year: int) -> list[VesselORM]:
    vessels = db.query(VesselORM).all()
    return [vessel for vessel in vessels if _vessel_in_period(vessel, quarter, year)]
def _history_response(item: ReportHistoryORM) -> dict:
    created_at = item.created_at or datetime.utcnow()
    available_until = created_at + timedelta(days=30)
    file_types = _split_csv(getattr(item, "file_types", None)) or ["registry", "summary"]
    existing_file = bool(item.file_path and Path(item.file_path).exists())
    return {
        "id": item.id,
        "created_at": item.created_at.isoformat() if item.created_at else None,
        "quarter": item.quarter,
        "year": item.year,
        "file_count": item.file_count,
        "record_count": item.record_count if item.record_count is not None else item.file_count,
        "provinces": item.provinces,
        "status": item.status,
        "file_path": item.file_path,
        "file_types": file_types,
        "file_type_label": ", ".join(FILE_TYPE_NAMES.get(file_type, file_type) for file_type in file_types),
        "created_by": item.created_by or "Nguyen Thi Binh",
        "available_until": available_until.isoformat(),
        "has_file": existing_file and datetime.utcnow() <= available_until,
    }
@router.get("/history")
def get_report_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    quarter: Optional[int] = Query(None, ge=1, le=4),
    year: Optional[int] = Query(None, ge=2000, le=2100),
    created_by: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Lấy danh sách lịch sử các lượt báo cáo trích xuất dữ liệu,
    há»— trợ lọc theo quý, năm và phân trang.
    """
    query = db.query(ReportHistoryORM)
    if quarter is not None:
        query = query.filter(ReportHistoryORM.quarter == quarter)
    if year is not None:
        query = query.filter(ReportHistoryORM.year == year)
    if created_by:
        query = query.filter(ReportHistoryORM.created_by == created_by)
    total = query.count()
    items = query.order_by(ReportHistoryORM.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "items": [
            _history_response(item)
            for item in items
        ]
    }
@router.get("/history/creators")
def get_report_creators(db: Session = Depends(get_db)):
    creators = (
        db.query(ReportHistoryORM.created_by)
        .filter(ReportHistoryORM.created_by.isnot(None))
        .distinct()
        .order_by(ReportHistoryORM.created_by.asc())
        .all()
    )
    return {"items": [row[0] for row in creators if row[0]]}
@router.get("/history/{report_id}/download")
def download_report_history(report_id: int, db: Session = Depends(get_db)):
    """
    Tải tệp ZIP báo cáo đã được lưu trong lịch sử theo ID.
    """
    item = db.query(ReportHistoryORM).filter(ReportHistoryORM.id == report_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy lịch sử báo cáo này."
        )
    
    if not item.file_path or not Path(item.file_path).exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File báo cáo không tồn tại trên server hoặc đã bị xóa."
        )
    
    if item.created_at and datetime.utcnow() > item.created_at + timedelta(days=30):
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="File báo cáo đã quá hạn tải lại 30 ngày."
        )
    return FileResponse(
        path=item.file_path,
        media_type="application/zip",
        filename=Path(item.file_path).name
    )
@router.delete("/history/{report_id}")
def delete_report_history(report_id: int, db: Session = Depends(get_db)):
    item = db.query(ReportHistoryORM).filter(ReportHistoryORM.id == report_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy lịch sử báo cáo này."
        )
    if item.file_path:
        file_path = Path(item.file_path)
        reports_dir = Path("saved_reports").resolve()
        try:
            resolved_file = file_path.resolve()
            if resolved_file.exists() and reports_dir in resolved_file.parents:
                resolved_file.unlink()
        except OSError:
            pass
    db.delete(item)
    db.commit()
    return {"message": "Đã xóa lịch sử báo cáo."}
@router.get("/export-options")
def get_export_options(
    quarter: int,
    year: int,
    db: Session = Depends(get_db),
):
    if not (1 <= quarter <= 4):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quý không hợp lệ: phải nằm trong khoảng từ 1 đến 4"
        )
    vessels = _query_period_vessels(db, quarter, year)
    counts: dict[str, int] = {}
    for vessel in vessels:
        code = _normalize_province_code(vessel.province_code)
        counts[code] = counts.get(code, 0) + 1
    start, end = _quarter_date_range(quarter, year)
    return {
        "quarter": quarter,
        "year": year,
        "period_start": start.strftime("%d/%m/%Y"),
        "period_end": (end - timedelta(days=1)).strftime("%d/%m/%Y"),
        "total": len(vessels),
        "provinces": [
            {**province, "count": counts.get(province["code"], 0)}
            for province in COASTAL_PROVINCES
        ],
    }
@router.post("/generate-from-db")
async def generate_report_from_db(
    quarter: int = Form(...),
    year: int = Form(...),
    provinces: str = Form(...),
    file_types: str = Form("registry,summary"),
    created_by: str = Form("Nguyen Thi Binh"),
    db: Session = Depends(get_db),
):
    if not (1 <= quarter <= 4):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quý không hợp lệ: phải nằm trong khoảng từ 1 đến 4"
        )
    selected_provinces = {_normalize_province_code(code) for code in _split_csv(provinces)}
    selected_file_types = [file_type for file_type in _split_csv(file_types) if file_type in FILE_TYPE_NAMES]
    if not selected_provinces:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vui lòng chọn ít nhất một tỉnh để xuất báo cáo."
        )
    if not selected_file_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vui lòng chọn ít nhất một định dạng đầu ra."
        )
    selected_vessels = [
        vessel for vessel in _query_period_vessels(db, quarter, year)
        if _normalize_province_code(vessel.province_code) in selected_provinces
    ]
    if not selected_vessels:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không có bản ghi phù hợp với kỳ và tỉnh đã chọn."
        )
    reports_dir = Path("saved_reports")
    reports_dir.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    zip_filename = f"report_q{quarter}_{year}_{timestamp}.zip"
    zip_filepath = reports_dir / zip_filename
    with zipfile.ZipFile(zip_filepath, "w", zipfile.ZIP_DEFLATED) as zip_file:
        if "registry" in selected_file_types:
            registry_excel = generate_vessel_excel(selected_vessels)
            zip_file.writestr("bang_ke_tong_hop.xlsx", registry_excel.getvalue())
        if "summary" in selected_file_types:
            summary_excel = generate_quarterly_summary_excel(selected_vessels, quarter, year)
            zip_file.writestr("bao_cao_quy_theo_tinh.xlsx", summary_excel.getvalue())
    province_names = [_province_name(code) for code in sorted(selected_provinces)]
    history_item = ReportHistoryORM(
        quarter=quarter,
        year=year,
        file_count=len(selected_file_types),
        record_count=len(selected_vessels),
        provinces=", ".join(province_names),
        file_path=str(zip_filepath.resolve()),
        file_types=",".join(selected_file_types),
        created_by=created_by.strip() or "Nguyen Thi Binh",
        status="success",
    )
    db.add(history_item)
    db.commit()
    db.refresh(history_item)
    return FileResponse(
        path=str(zip_filepath.resolve()),
        media_type="application/zip",
        filename=zip_filename,
    )
@router.post("/upload-batch")
async def upload_vessel_documents(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """
    API tiếp nhận nhiều file giấy chứng nhận (.docx) từ trình duyệt,
    thực hiện gọi bộ xử lý đa luồng và phản hồi kết quả về Frontend.
    """
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Không có file nào được chọn để tải lên."
        )
        
    saved_temp_paths = []
    try:
        for file in files:
            if not file.filename.endswith('.docx'):
                continue
            with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as tmp:
                content = await file.read()
                tmp.write(content)
                saved_temp_paths.append((Path(tmp.name), file.filename))
        
        if not saved_temp_paths:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Không tìm thấy file Word định dạng .docx hợp lệ."
            )
        
        from app.services.batch_processor import run_batch_processor_api
        processing_results = run_batch_processor_api(file_paths_with_names=saved_temp_paths, db=db, max_threads=4)
        success_count = sum(1 for item in processing_results if item['status'] == 'Thành công')
        
        return {
            "message": f"Xử lý hoàn tất {len(processing_results)} file tài liệu.",
            "total": len(processing_results),
            "success": success_count,
            "failed": len(processing_results) - success_count,
            "data": processing_results
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Lỗi máy chủ: {str(e)}"
        )
    finally:
        for item in saved_temp_paths:
            path = item[0] if isinstance(item, tuple) else item
            if path.exists():
                path.unlink()
@router.post("/generate-report")
async def generate_report(
    files: List[UploadFile] = File(...),
    quarter: int = Form(...),
    year: int = Form(...),
    provinces: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Đồng thời trích xuất danh sách file DOCX, lưu vào Database,
    tỗng hợp sá»‘ liệu theo quý và xuất ra file ZIP chứa 2 tệp báo cáo Excel.
    Lịch sử xuất báo cáo cũng được lưu lại.
    """
    if not (1 <= quarter <= 4):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quý không hợp lệ: phải nằm trong khoảng từ 1 đến 4"
        )
        
    saved_temp_paths = []
    try:
        # 1. Lưu các file upload tạm thá» i
        for file in files:
            if not file.filename.endswith('.docx'):
                continue
            with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as tmp:
                content = await file.read()
                tmp.write(content)
                saved_temp_paths.append((Path(tmp.name), file.filename))
                
        if not saved_temp_paths:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Không có file Word định dạng .docx hợp lệ nào được tải lên."
            )
            
        # 2. Phân tích các file và lưu thông tin vào CSDL
        from app.services.batch_processor import run_batch_processor_api
        results = run_batch_processor_api(file_paths_with_names=saved_temp_paths, db=db, max_threads=4)
        success_count = sum(1 for item in results if item['status'] == 'Thành công')
                
        if success_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tất cả các file tải lên đều trích xuất lỗi."
            )
            
        # 3. Lấy dữ liệu từ database cho quý này (dựa vào inspection_date)
        if quarter == 1:
            months = [1, 2, 3]
        elif quarter == 2:
            months = [4, 5, 6]
        elif quarter == 3:
            months = [7, 8, 9]
        else:
            months = [10, 11, 12]
            
        vessels = db.query(VesselORM).filter(
            extract('year', VesselORM.inspection_date) == year,
            extract('month', VesselORM.inspection_date).in_(months)
        ).all()
        
        # 4. Tạo các tệp Excel trong bộ nhá»›
        registry_excel = generate_vessel_excel(vessels)
        summary_excel = generate_quarterly_summary_excel(vessels, quarter, year)
        
        # 5. Đóng gói ZIP
        reports_dir = Path("saved_reports")
        reports_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        zip_filename = f"report_q{quarter}_{year}_{timestamp}.zip"
        zip_filepath = reports_dir / zip_filename
        
        with zipfile.ZipFile(zip_filepath, "w", zipfile.ZIP_DEFLATED) as zip_file:
            zip_file.writestr("tong_hop_ghi_so.xlsx", registry_excel.getvalue())
            zip_file.writestr("bao_cao_thong_ke.xlsx", summary_excel.getvalue())
            
        # 6. Lưu thông tin vào lịch sử
        history_item = ReportHistoryORM(
            quarter=quarter,
            year=year,
            file_count=2,
            record_count=len(vessels),
            provinces=provinces,
            file_path=str(zip_filepath.resolve()),
            file_types="registry,summary",
            created_by="Nguyen Thi Binh",
            status="success"
        )
        db.add(history_item)
        db.commit()
        db.refresh(history_item)
        
        # 7. Trả về tệp ZIP tải về cho người dùng
        return FileResponse(
            path=str(zip_filepath.resolve()),
            media_type="application/zip",
            filename=zip_filename
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi tạo báo cáo: {str(e)}"
        )
    finally:
        for item in saved_temp_paths:
            path = item[0] if isinstance(item, tuple) else item
            if path.exists():
                path.unlink()
