
import tempfile
import os
import zipfile
from datetime import datetime
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.vessel import VesselORM, ReportHistoryORM
from app.services.docx_parser import parse_vessel_docx
from app.services.data_processor import classify_length_group, get_province_name
from app.services.excel_generator import generate_vessel_excel, generate_quarterly_summary_excel

router = APIRouter(
    prefix="/reports",
    tags=["reports"]
)

@router.get("/history")
def get_report_history(
    quarter: Optional[int] = None,
    year: Optional[int] = None,
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách lịch sử các lượt báo cáo trích xuất dữ liệu,
    hỗ trợ lọc theo quý, năm và phân trang.
    """
    query = db.query(ReportHistoryORM)
    if quarter is not None:
        query = query.filter(ReportHistoryORM.quarter == quarter)
    if year is not None:
        query = query.filter(ReportHistoryORM.year == year)
    
    total = query.count()
    items = query.order_by(ReportHistoryORM.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "items": [
            {
                "id": item.id,
                "created_at": item.created_at.isoformat() if item.created_at else None,
                "quarter": item.quarter,
                "year": item.year,
                "file_count": item.file_count,
                "provinces": item.provinces,
                "status": item.status,
                "file_path": item.file_path,
                "has_file": bool(item.file_path and Path(item.file_path).exists())
            }
            for item in items
        ]
    }


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
    
    return FileResponse(
        path=item.file_path,
        media_type="application/zip",
        filename=Path(item.file_path).name
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
                saved_temp_paths.append(Path(tmp.name))
        
        if not saved_temp_paths:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Không tìm thấy file Word định dạng .docx hợp lệ."
            )
        
        from app.services.batch_processor import run_batch_processor_api
        processing_results = run_batch_processor_api(file_paths=saved_temp_paths, db=db, max_threads=4)
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
        for path in saved_temp_paths:
            if path.exists():
                path.unlink()
async def generate_report(
    files: List[UploadFile] = File(...),
    quarter: int = Form(...),
    year: int = Form(...),
    provinces: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Đồng thời trích xuất danh sách file DOCX, lưu vào Database,
    tổng hợp số liệu theo quý và xuất ra file ZIP chứa 2 tệp báo cáo Excel.
    Lịch sử xuất báo cáo cũng được lưu lại.
    """
    if not (1 <= quarter <= 4):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quý không hợp lệ: phải nằm trong khoảng từ 1 đến 4"
        )
        
    saved_temp_paths = []
    try:
        # 1. Lưu các file upload tạm thời
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
                detail="Không có file Word định dạng .docx hợp lệ nào được tải lên."
            )
            
        # 2. Phân tích các file và lưu thông tin vào CSDL
        from app.services.batch_processor import run_batch_processor_api
        results = run_batch_processor_api(file_paths=saved_temp_paths, db=db, max_threads=4)
        success_count = sum(1 for item in results if item['status'] == 'Thành công')
                
        if success_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tất cả các file tải lên đều trích xuất lỗi."
            )
            
        # 3. Lấy dữ liệu từ database cho quý này (dựa vào inspection_date)
        from sqlalchemy import extract
        
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
        
        # 4. Tạo các tệp Excel trong bộ nhớ
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
            file_count=success_count,
            provinces=provinces,
            file_path=str(zip_filepath.resolve()),
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
        for path in saved_temp_paths:
            if path.exists():
                path.unlink()
