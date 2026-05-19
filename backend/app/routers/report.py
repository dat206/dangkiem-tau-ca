import tempfile
from pathlib import Path
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.vessel import ReportHistoryORM
from app.services.batch_processor import run_batch_processor_api

router = APIRouter(
    prefix="/reports",
    tags=["reports"]
)

@router.get("/history")
def get_report_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    quarter: int | None = Query(None, ge=1, le=4),
    year: int | None = Query(None, ge=2000, le=2100),
    db: Session = Depends(get_db),
):
    """Lấy danh sách lịch sử các lượt báo cáo trích xuất dữ liệu."""
    query = db.query(ReportHistoryORM)
    if quarter is not None:
        query = query.filter(ReportHistoryORM.quarter == quarter)
    if year is not None:
        query = query.filter(ReportHistoryORM.year == year)

    total = query.count()
    items = (
        query.order_by(ReportHistoryORM.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

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
            }
            for item in items
        ],
    }


@router.get("/history/{report_id}/download")
def download_report_history(report_id: int, db: Session = Depends(get_db)):
    """Tải file báo cáo đã lưu trong lịch sử."""
    item = db.query(ReportHistoryORM).filter(ReportHistoryORM.id == report_id).first()
    if not item or not item.file_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report file not found")

    file_path = Path(item.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report file not found")

    return FileResponse(path=file_path, filename=file_path.name)

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
            
        processing_results = run_batch_processor_api(file_paths=saved_temp_paths, db=db, max_threads=4)
        success_count = sum(1 for item in processing_results if item.get("ok"))
        
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
