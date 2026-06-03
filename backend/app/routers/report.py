
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
    {"code": "QN", "name": "Quáº£ng Ninh"},
    {"code": "HP", "name": "Háº£i PhÃ²ng"},
    {"code": "TB", "name": "ThÃ¡i BÃ¬nh"},
    {"code": "ND", "name": "Nam Äá»‹nh"},
    {"code": "TH", "name": "Thanh HÃ³a"},
    {"code": "NA", "name": "Nghá»‡ An"},
    {"code": "HT", "name": "HÃ  TÄ©nh"},
    {"code": "QB", "name": "Quáº£ng BÃ¬nh"},
    {"code": "QT", "name": "Quáº£ng Trá»‹"},
    {"code": "DN", "name": "ÄÃ  Náºµng"},
    {"code": "QNG", "name": "Quáº£ng NgÃ£i"},
    {"code": "BDI", "name": "BÃ¬nh Äá»‹nh"},
    {"code": "KH", "name": "KhÃ¡nh HÃ²a"},
    {"code": "NT", "name": "Ninh Thuáº­n"},
    {"code": "BT", "name": "BÃ¬nh Thuáº­n"},
]

FILE_TYPE_NAMES = {
    "registry": "Báº£ng kÃª tá»•ng há»£p",
    "summary": "BÃ¡o cÃ¡o quÃ½ theo tá»‰nh",
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
    aliases = {"NÄ": "ND", "ÄN": "DN", "BÄ": "BDI", "QNI": "QNG"}
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
    Láº¥y danh sÃ¡ch lá»‹ch sá»­ cÃ¡c lÆ°á»£t bÃ¡o cÃ¡o trÃ­ch xuáº¥t dá»¯ liá»‡u,
    há»— trá»£ lá»c theo quÃ½, nÄƒm vÃ  phÃ¢n trang.
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
    Táº£i tá»‡p ZIP bÃ¡o cÃ¡o Ä‘Ã£ Ä‘Æ°á»£c lÆ°u trong lá»‹ch sá»­ theo ID.
    """
    item = db.query(ReportHistoryORM).filter(ReportHistoryORM.id == report_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="KhÃ´ng tÃ¬m tháº¥y lá»‹ch sá»­ bÃ¡o cÃ¡o nÃ y."
        )
    
    if not item.file_path or not Path(item.file_path).exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File bÃ¡o cÃ¡o khÃ´ng tá»“n táº¡i trÃªn server hoáº·c Ä‘Ã£ bá»‹ xÃ³a."
        )
    

    if item.created_at and datetime.utcnow() > item.created_at + timedelta(days=30):
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="File bÃ¡o cÃ¡o Ä‘Ã£ quÃ¡ háº¡n táº£i láº¡i 30 ngÃ y."
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
            detail="KhÃ´ng tÃ¬m tháº¥y lá»‹ch sá»­ bÃ¡o cÃ¡o nÃ y."
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
    return {"message": "ÄÃ£ xÃ³a lá»‹ch sá»­ bÃ¡o cÃ¡o."}


@router.get("/export-options")
def get_export_options(
    quarter: int,
    year: int,
    db: Session = Depends(get_db),
):
    if not (1 <= quarter <= 4):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="QuÃ½ khÃ´ng há»£p lá»‡: pháº£i náº±m trong khoáº£ng tá»« 1 Ä‘áº¿n 4"
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
            detail="QuÃ½ khÃ´ng há»£p lá»‡: pháº£i náº±m trong khoáº£ng tá»« 1 Ä‘áº¿n 4"
        )

    selected_provinces = {_normalize_province_code(code) for code in _split_csv(provinces)}
    selected_file_types = [file_type for file_type in _split_csv(file_types) if file_type in FILE_TYPE_NAMES]
    if not selected_provinces:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vui lÃ²ng chá»n Ã­t nháº¥t má»™t tá»‰nh Ä‘á»ƒ xuáº¥t bÃ¡o cÃ¡o."
        )
    if not selected_file_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vui lÃ²ng chá»n Ã­t nháº¥t má»™t Ä‘á»‹nh dáº¡ng Ä‘áº§u ra."
        )

    selected_vessels = [
        vessel for vessel in _query_period_vessels(db, quarter, year)
        if _normalize_province_code(vessel.province_code) in selected_provinces
    ]
    if not selected_vessels:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="KhÃ´ng cÃ³ báº£n ghi phÃ¹ há»£p vá»›i ká»³ vÃ  tá»‰nh Ä‘Ã£ chá»n."
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
    API tiáº¿p nháº­n nhiá»u file giáº¥y chá»©ng nháº­n (.docx) tá»« trÃ¬nh duyá»‡t,
    thá»±c hiá»‡n gá»i bá»™ xá»­ lÃ½ Ä‘a luá»“ng vÃ  pháº£n há»“i káº¿t quáº£ vá» Frontend.
    """
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="KhÃ´ng cÃ³ file nÃ o Ä‘Æ°á»£c chá»n Ä‘á»ƒ táº£i lÃªn."
        )
        
    saved_temp_paths = []
    try:
        for file in files:
            if not file.filename.endswith('.docx'):
                continue
            with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as tmp:
                content = await file.read()
                tmp.write(content)
                saved_temp_paths.append(Path(tmp.name))
        
        if not saved_temp_paths:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="KhÃ´ng tÃ¬m tháº¥y file Word Ä‘á»‹nh dáº¡ng .docx há»£p lá»‡."
            )
        
        from app.services.batch_processor import run_batch_processor_api
        processing_results = run_batch_processor_api(file_paths=saved_temp_paths, db=db, max_threads=4)
        success_count = sum(1 for item in processing_results if item['status'] == 'ThÃ nh cÃ´ng')
        
        return {
            "message": f"Xá»­ lÃ½ hoÃ n táº¥t {len(processing_results)} file tÃ i liá»‡u.",
            "total": len(processing_results),
            "success": success_count,
            "failed": len(processing_results) - success_count,
            "data": processing_results
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Lá»—i mÃ¡y chá»§: {str(e)}"
        )
    finally:
        for path in saved_temp_paths:
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
    Äá»“ng thá»i trÃ­ch xuáº¥t danh sÃ¡ch file DOCX, lÆ°u vÃ o Database,
    tá»•ng há»£p sá»‘ liá»‡u theo quÃ½ vÃ  xuáº¥t ra file ZIP chá»©a 2 tá»‡p bÃ¡o cÃ¡o Excel.
    Lá»‹ch sá»­ xuáº¥t bÃ¡o cÃ¡o cÅ©ng Ä‘Æ°á»£c lÆ°u láº¡i.
    """
    if not (1 <= quarter <= 4):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="QuÃ½ khÃ´ng há»£p lá»‡: pháº£i náº±m trong khoáº£ng tá»« 1 Ä‘áº¿n 4"
        )
        
    saved_temp_paths = []
    try:
        # 1. LÆ°u cÃ¡c file upload táº¡m thá»i
        for file in files:
            if not file.filename.endswith('.docx'):
                continue
            with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as tmp:
                content = await file.read()
                tmp.write(content)
                saved_temp_paths.append(Path(tmp.name))
                
        if not saved_temp_paths:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="KhÃ´ng cÃ³ file Word Ä‘á»‹nh dáº¡ng .docx há»£p lá»‡ nÃ o Ä‘Æ°á»£c táº£i lÃªn."
            )
            
        # 2. PhÃ¢n tÃ­ch cÃ¡c file vÃ  lÆ°u thÃ´ng tin vÃ o CSDL
        from app.services.batch_processor import run_batch_processor_api
        results = run_batch_processor_api(file_paths=saved_temp_paths, db=db, max_threads=4)
        success_count = sum(1 for item in results if item['status'] == 'ThÃ nh cÃ´ng')
                
        if success_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Táº¥t cáº£ cÃ¡c file táº£i lÃªn Ä‘á»u trÃ­ch xuáº¥t lá»—i."
            )
            
        # 3. Láº¥y dá»¯ liá»‡u tá»« database cho quÃ½ nÃ y (dá»±a vÃ o inspection_date)
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
        
        # 4. Táº¡o cÃ¡c tá»‡p Excel trong bá»™ nhá»›
        registry_excel = generate_vessel_excel(vessels)
        summary_excel = generate_quarterly_summary_excel(vessels, quarter, year)
        
        # 5. ÄÃ³ng gÃ³i ZIP
        reports_dir = Path("saved_reports")
        reports_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        zip_filename = f"report_q{quarter}_{year}_{timestamp}.zip"
        zip_filepath = reports_dir / zip_filename
        
        with zipfile.ZipFile(zip_filepath, "w", zipfile.ZIP_DEFLATED) as zip_file:
            zip_file.writestr("tong_hop_ghi_so.xlsx", registry_excel.getvalue())
            zip_file.writestr("bao_cao_thong_ke.xlsx", summary_excel.getvalue())
            
        # 6. LÆ°u thÃ´ng tin vÃ o lá»‹ch sá»­
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
        
        # 7. Tráº£ vá» tá»‡p ZIP táº£i vá» cho ngÆ°á»i dÃ¹ng
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
            detail=f"Lá»—i táº¡o bÃ¡o cÃ¡o: {str(e)}"
        )
    finally:
        for path in saved_temp_paths:
            if path.exists():
                path.unlink()
