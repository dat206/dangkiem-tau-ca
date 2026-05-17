import tempfile
from pathlib import Path
from typing import List
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.batch_processor import run_batch_processor_api

router = APIRouter(
    prefix="/api/reports",
    tags=["Reports"]
)

@router.post("/upload-batch")
async def upload_vessel_documents(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """
    API tiếp nhận danh sách nhiều file đăng kiểm (.docx) từ giao diện Web Frontend,
    xử lý trích xuất đa luồng siêu tốc và cập nhật trực tiếp vào Cơ sở dữ liệu.
    """
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không có file nào được tải lên."
        )
        
    saved_temp_paths = []
    
    try:
        # Bước 1: Lưu tạm thời các file tải lên vào thư mục Temp của hệ thống
        for file in files:
            if not file.filename.endswith('.docx'):
                continue  # Bỏ qua nếu có file không phải định dạng Word
                
            with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as tmp:
                content = await file.read()
                tmp.write(content)
                saved_temp_paths.append(Path(tmp.name))
        
        if not saved_temp_paths:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Không tìm thấy file hợp lệ dạng .docx trong danh sách tải lên."
            )
            
        # Bước 2: Gọi bộ xử lý đa luồng (đã tích hợp từ bản làm riêng) để trích xuất và lưu DB
        processing_results = run_batch_processor_api(file_paths=saved_temp_paths, db=db, max_threads=4)
        
        # Tính toán sơ bộ thống kê để phản hồi về Frontend
        success_count = sum(1 for item in processing_results if item['status'] == 'Thành công')
        
        return {
            "message": f"Xử lý hoàn tất {len(processing_results)} file.",
            "total": len(processing_results),
            "success": success_count,
            "failed": len(processing_results) - success_count,
            "data": processing_results
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi hệ thống khi xử lý hàng loạt: {str(e)}"
        )
        
    finally:
        # Bước 3: Dọn dẹp tuyệt đối các file rác tạm thời trên ổ đĩa Server sau khi xử lý xong
        for path in saved_temp_paths:
            if path.exists():
                path.unlink()