
import json
import uuid
import shutil
import subprocess
import tempfile
import zipfile
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import extract, func
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app.models.vessel import VesselORM, ReportHistoryORM, SystemSettingORM
from app.services.data_processor import get_province_name
from app.services.excel_generator import generate_vessel_excel, generate_quarterly_summary_excel
router = APIRouter(
    prefix="/reports",
    tags=["reports"]
)
EXTRACT_DIR = Path("temp_extracted").resolve()
EXTRACT_DIR.mkdir(exist_ok=True)
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
    date_value = _parse_vessel_date(vessel.issued_date) or _parse_vessel_date(vessel.inspection_date) or vessel.created_at
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
    settings_db = db.query(SystemSettingORM).filter(SystemSettingORM.key == "province_codes").first()
    provinces_list = COASTAL_PROVINCES
    if settings_db and settings_db.value:
        try:
            custom_codes = json.loads(settings_db.value)
            provinces_list = [{"code": k, "name": v} for k, v in custom_codes.items()]
        except Exception:
            pass

    return {
        "quarter": quarter,
        "year": year,
        "period_start": start.strftime("%d/%m/%Y"),
        "period_end": (end - timedelta(days=1)).strftime("%d/%m/%Y"),
        "total": len(vessels),
        "provinces": [
            {**province, "count": counts.get(province["code"], 0)}
            for province in provinces_list
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
    settings_db = db.query(SystemSettingORM).all()
    settings_map = {item.key: item.value for item in settings_db}
    org_name = settings_map.get("org_name", "Cục Đăng kiểm Việt Nam")
    org_address = settings_map.get("org_address", "18 Phạm Hùng, Mỹ Đình 2, Nam Từ Liêm, Hà Nội")
    custom_codes = {}
    if "province_codes" in settings_map:
        try:
            custom_codes = json.loads(settings_map["province_codes"])
        except Exception:
            pass

    with zipfile.ZipFile(zip_filepath, "w", zipfile.ZIP_DEFLATED) as zip_file:
        if "registry" in selected_file_types:
            registry_excel = generate_vessel_excel(selected_vessels, province_codes=custom_codes)
            zip_file.writestr("bang_ke_tong_hop.xlsx", registry_excel.getvalue())
        if "summary" in selected_file_types:
            summary_excel = generate_quarterly_summary_excel(
                selected_vessels, quarter, year, 
                org_name=org_name, org_address=org_address, province_codes=custom_codes
            )
            zip_file.writestr("bao_cao_quy_theo_tinh.xlsx", summary_excel.getvalue())
            
    def _local_prov_name(code: str) -> str:
        if custom_codes and code in custom_codes:
            return custom_codes[code]
        return _province_name(code)

    province_names = [_local_prov_name(code) for code in sorted(selected_provinces)]
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

TASKS_DB = {}

@router.get("/tasks/{task_id}")
async def get_task_status(task_id: str):
    """API kiểm tra trạng thái tiến trình xử lý hàng loạt chạy nền."""
    task = TASKS_DB.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Không tìm thấy tác vụ.")
    return task

def process_batch_async(task_id: str, saved_temp_paths: List[tuple], created_subdirs: List[Path]):
    """Tiến trình chạy nền xử lý phân tích và lưu DB."""
    db = SessionLocal()
    try:
        from app.services.batch_processor import run_batch_processor_api
        processing_results = run_batch_processor_api(file_paths_with_names=saved_temp_paths, db=db, max_threads=4)
        success_count = sum(1 for item in processing_results if item['status'] in ('Thành công', 'Trùng lặp'))
        
        # Cleanup subdirectories for extracted temp files
        dirs_to_delete = set(created_subdirs)
        for p, _ in saved_temp_paths:
            if EXTRACT_DIR in p.parents:
                dirs_to_delete.add(p.parent)
        for d in dirs_to_delete:
            try:
                if d.exists():
                    shutil.rmtree(d)
            except OSError:
                pass
                
        TASKS_DB[task_id] = {
            "status": "completed",
            "total": len(processing_results),
            "success": success_count,
            "failed": len(processing_results) - success_count,
            "data": processing_results
        }
    except Exception as e:
        for d in created_subdirs:
            try:
                if d.exists():
                    shutil.rmtree(d)
            except OSError:
                pass
        TASKS_DB[task_id] = {
            "status": "failed",
            "error": str(e)
        }
    finally:
        db.close()
        for item in saved_temp_paths:
            path = item[0] if isinstance(item, tuple) else item
            if EXTRACT_DIR not in path.parents:
                try:
                    if path.exists():
                        path.unlink()
                except OSError:
                    pass

def extract_single_archive(archive_file_path: Path, filename: str) -> tuple[List[tuple], List[Path]]:
    """
    Giải nén file ZIP hoặc RAR sang thư mục tạm thời dưới EXTRACT_DIR.
    Trả về:
      - Danh sách các tuple (đường dẫn docx giải nén: Path, tên file gốc: str)
      - Danh sách các thư mục tạm đã tạo để dọn dẹp sau
    """
    filename_lower = filename.lower()
    temp_sub_dir = Path(tempfile.mkdtemp(dir=EXTRACT_DIR))
    extracted = []
    created_dirs = [temp_sub_dir]
    
    try:
        if filename_lower.endswith(".zip"):
            with zipfile.ZipFile(archive_file_path, 'r') as zip_ref:
                for zip_info in zip_ref.infolist():
                    if zip_info.filename.lower().endswith(".docx"):
                        orig_filename = zip_info.filename
                        try:
                            decoded_name = orig_filename.encode('cp437').decode('utf-8')
                        except Exception:
                            decoded_name = orig_filename
                            
                        filename_only = Path(decoded_name).name
                        if filename_only and not filename_only.startswith("~$"):
                            target_path = temp_sub_dir / filename_only
                            # Tránh ghi đè nếu trùng tên file trong zip
                            counter = 1
                            name_stem = target_path.stem
                            name_ext = target_path.suffix
                            while target_path.exists():
                                target_path = temp_sub_dir / f"{name_stem}_{counter}{name_ext}"
                                counter += 1
                            with zip_ref.open(zip_info) as source, open(target_path, "wb") as target:
                                shutil.copyfileobj(source, target)
        elif filename_lower.endswith(".rar"):
            success = False
            exe_path = None
            is_seven_zip = True
            
            for local_name in ["7zz", "backend/7zz"]:
                local_path = Path(local_name)
                if local_path.exists():
                    exe_path = str(local_path.resolve())
                    is_seven_zip = True
                    break
            
            if not exe_path:
                for cmd_name in ["7z", "7zz", "7za"]:
                    found = shutil.which(cmd_name)
                    if found:
                        exe_path = found
                        is_seven_zip = True
                        break
            
            if not exe_path:
                found = shutil.which("unrar")
                if found:
                    exe_path = found
                    is_seven_zip = False
            
            if not exe_path:
                if Path(r"C:\Program Files\7-Zip\7z.exe").exists():
                    exe_path = r"C:\Program Files\7-Zip\7z.exe"
                    is_seven_zip = True
                elif Path(r"C:\Program Files\WinRAR\UnRAR.exe").exists():
                    exe_path = r"C:\Program Files\WinRAR\UnRAR.exe"
                    is_seven_zip = False
            
            if exe_path:
                try:
                    if is_seven_zip:
                        cmd = [
                            exe_path,
                            "x",
                            str(archive_file_path),
                            f"-o{temp_sub_dir}",
                            "*.docx",
                            "-r",
                            "-y"
                        ]
                    else:
                        output_dir_str = str(temp_sub_dir)
                        if not (output_dir_str.endswith("/") or output_dir_str.endswith("\\")):
                            output_dir_str += "/"
                        cmd = [
                            exe_path,
                            "x",
                            "-y",
                            str(archive_file_path),
                            "*.docx",
                            output_dir_str
                        ]
                    res = subprocess.run(cmd, capture_output=True, text=True)
                    if res.returncode == 0:
                        success = True
                except Exception:
                    pass
            
            if not success:
                raise HTTPException(
                    status_code=500,
                    detail="Không thể giải nén file .rar trên máy chủ. Đảm bảo có cài đặt WinRAR hoặc 7-Zip."
                )
                
        for docx_file in temp_sub_dir.rglob("*.docx"):
            if not docx_file.name.startswith("~$"):
                extracted.append((docx_file, docx_file.name))
                
        return extracted, created_dirs
    except Exception:
        # Dọn dẹp nếu có lỗi trong quá trình giải nén
        for d in created_dirs:
            if d.exists():
                try:
                    shutil.rmtree(d)
                except OSError:
                    pass
        raise

@router.post("/extract-archive")
async def extract_archive(file: UploadFile = File(...)):
    filename = file.filename
    filename_lower = filename.lower()
    if not (filename_lower.endswith(".zip") or filename_lower.endswith(".rar")):
        raise HTTPException(
            status_code=400,
            detail="Chỉ hỗ trợ giải nén file .zip hoặc .rar"
        )
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=Path(filename).suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        archive_path = Path(tmp.name)
        
    created_subdirs = []
    try:
        extracted, created_subdirs = extract_single_archive(archive_path, filename)
        files_info = []
        for docx_file, name in extracted:
            files_info.append({
                "filename": name,
                "temp_path": str(docx_file.resolve()),
                "size": docx_file.stat().st_size
            })
        return {
            "message": f"Giải nén thành công, tìm thấy {len(files_info)} tệp .docx",
            "files": files_info
        }
    except Exception as e:
        for d in created_subdirs:
            if d.exists():
                try:
                    shutil.rmtree(d)
                except OSError:
                    pass
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi giải nén file: {str(e)}"
        )
    finally:
        if archive_path.exists():
            archive_path.unlink()


@router.post("/upload-batch")
async def upload_vessel_documents(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(default=[]),
    temp_paths: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    API tiếp nhận nhiều file giấy chứng nhận (.docx) từ trình duyệt,
    hoặc nhận các file nén (.zip, .rar) và tự động giải nén trên máy chủ,
    hoặc nhận các đường dẫn file tạm đã giải nén trước đó,
    thực hiện đẩy tiến trình xử lý vào hàng đợi chạy nền.
    """
    saved_temp_paths = []
    created_subdirs = []
    
    try:
        if files:
            for file in files:
                filename = file.filename
                filename_lower = filename.lower()
                
                if filename_lower.endswith('.docx'):
                    with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as tmp:
                        content = await file.read()
                        tmp.write(content)
                        saved_temp_paths.append((Path(tmp.name), filename))
                        
                elif filename_lower.endswith('.zip') or filename_lower.endswith('.rar'):
                    with tempfile.NamedTemporaryFile(delete=False, suffix=Path(filename).suffix) as tmp:
                        content = await file.read()
                        tmp.write(content)
                        archive_path = Path(tmp.name)
                    
                    try:
                        extracted, subdirs = extract_single_archive(archive_path, filename)
                        saved_temp_paths.extend(extracted)
                        created_subdirs.extend(subdirs)
                    finally:
                        if archive_path.exists():
                            archive_path.unlink()
        
        if temp_paths:
            try:
                paths_list = json.loads(temp_paths)
                for path_str in paths_list:
                    p = Path(path_str).resolve()
                    if EXTRACT_DIR in p.parents and p.exists():
                        saved_temp_paths.append((p, p.name))
            except Exception as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Lỗi định dạng temp_paths: {str(e)}"
                )
                
        if not saved_temp_paths:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Không tìm thấy file Word định dạng .docx hợp lệ để xử lý."
            )
        
        task_id = str(uuid.uuid4())
        TASKS_DB[task_id] = {
            "status": "processing",
            "total": len(saved_temp_paths),
            "success": 0,
            "failed": 0,
            "data": []
        }
        
        background_tasks.add_task(
            process_batch_async,
            task_id,
            saved_temp_paths,
            created_subdirs
        )
        
        return {
            "task_id": task_id,
            "status": "processing",
            "message": "Đang xử lý tài liệu trong nền..."
        }
    except Exception as e:
        for d in created_subdirs:
            try:
                if d.exists():
                    shutil.rmtree(d)
            except OSError:
                pass
        for item in saved_temp_paths:
            path = item[0] if isinstance(item, tuple) else item
            if EXTRACT_DIR not in path.parents:
                try:
                    if path.exists():
                        path.unlink()
                except OSError:
                    pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Lỗi chuẩn bị máy chủ: {str(e)}"
        )
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
        success_count = sum(1 for item in results if item['status'] in ('Thành công', 'Trùng lặp'))
                
        if success_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tất cả các file tải lên đều trích xuất lỗi."
            )
            
        # 3. Lấy dữ liệu từ database cho quý này (dựa vào issued_date, fallback sang inspection_date)
        if quarter == 1:
            months = [1, 2, 3]
        elif quarter == 2:
            months = [4, 5, 6]
        elif quarter == 3:
            months = [7, 8, 9]
        else:
            months = [10, 11, 12]
            
        effective_date = func.coalesce(VesselORM.issued_date, VesselORM.inspection_date)
        vessels = db.query(VesselORM).filter(
            extract('year', effective_date) == year,
            extract('month', effective_date).in_(months)
        ).all()
        
        # Fetch settings
        settings_db = db.query(SystemSettingORM).all()
        settings_map = {item.key: item.value for item in settings_db}
        org_name = settings_map.get("org_name", "Cục Đăng kiểm Việt Nam")
        org_address = settings_map.get("org_address", "18 Phạm Hùng, Mỹ Đình 2, Nam Từ Liêm, Hà Nội")
        custom_codes = {}
        if "province_codes" in settings_map:
            try:
                custom_codes = json.loads(settings_map["province_codes"])
            except Exception:
                pass

        # 4. Tạo các tệp Excel trong bộ nhá»›
        registry_excel = generate_vessel_excel(vessels, province_codes=custom_codes)
        summary_excel = generate_quarterly_summary_excel(
            vessels, quarter, year, 
            org_name=org_name, org_address=org_address, province_codes=custom_codes
        )
        
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


# --- SYSTEM SETTINGS CONFIGURATIONS API ---

class ConfigsPayload(BaseModel):
    org_name: Optional[str] = None
    org_address: Optional[str] = None
    org_phone: Optional[str] = None
    org_email: Optional[str] = None
    org_logo: Optional[str] = None
    report_year: Optional[int] = None
    default_provinces: Optional[list[str]] = None
    province_codes: Optional[dict[str, str]] = None


@router.get("/configs")
def get_configs(db: Session = Depends(get_db)):
    settings_db = db.query(SystemSettingORM).all()
    settings_map = {item.key: item.value for item in settings_db}
    
    def parse_json(val, default):
        if not val:
            return default
        try:
            return json.loads(val)
        except Exception:
            return default

    return {
        "org_name": settings_map.get("org_name", "Cục Đăng kiểm Việt Nam"),
        "org_address": settings_map.get("org_address", "18 Phạm Hùng, Mỹ Đình 2, Nam Từ Liêm, Hà Nội"),
        "org_phone": settings_map.get("org_phone", "024 3768 4715"),
        "org_email": settings_map.get("org_email", "contact@vr.org.vn"),
        "org_logo": settings_map.get("org_logo", ""),
        "report_year": int(settings_map.get("report_year", "2026")),
        "default_provinces": parse_json(settings_map.get("default_provinces"), ["Quảng Ninh", "Thanh Hóa", "Hà Tĩnh", "Nghệ An", "Quảng Bình"]),
        "province_codes": parse_json(settings_map.get("province_codes"), {
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
            "QNG": "Quảng Ngãi",
            "QT": "Quảng Trị",
            "TB": "Thái Bình",
            "NĐ": "Nam Định",
        })
    }


@router.post("/configs")
def save_configs(payload: ConfigsPayload, db: Session = Depends(get_db)):
    updates = {}
    if payload.org_name is not None:
        updates["org_name"] = payload.org_name
    if payload.org_address is not None:
        updates["org_address"] = payload.org_address
    if payload.org_phone is not None:
        updates["org_phone"] = payload.org_phone
    if payload.org_email is not None:
        updates["org_email"] = payload.org_email
    if payload.org_logo is not None:
        updates["org_logo"] = payload.org_logo
    if payload.report_year is not None:
        updates["report_year"] = str(payload.report_year)
    if payload.default_provinces is not None:
        updates["default_provinces"] = json.dumps(payload.default_provinces)
    if payload.province_codes is not None:
        updates["province_codes"] = json.dumps(payload.province_codes)
        
    for key, val in updates.items():
        item = db.query(SystemSettingORM).filter(SystemSettingORM.key == key).first()
        if item:
            item.value = val
        else:
            item = SystemSettingORM(key=key, value=val)
            db.add(item)
            
    db.commit()
    return get_configs(db)
