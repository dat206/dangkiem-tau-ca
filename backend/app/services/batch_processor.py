import concurrent.futures
from pathlib import Path
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.services.docx_parser import parse_vessel_docx
from app.models.vessel import Vessel

def process_single_file(file_path: Path) -> Dict[str, Any]:
    """Xử lý đơn lẻ từng file để phục vụ cho luồng chạy song song."""
    try:
        data = parse_vessel_docx(str(file_path))
        result = data.model_dump()
        result['file_name'] = file_path.name
        result['status'] = 'Thành công'
        result['error_msg'] = ''
        return result
    except Exception as e:
        return {
            'so_dang_ky': '', 
            'ma_tinh': '', 
            'lmax': 0.0, 
            'hinh_thuc_kiem_tra': 'Không xác định', 
            'cap_tau': 'Không xác định',
            'file_name': file_path.name,
            'status': 'Lỗi',
            'error_msg': str(e)
        }

def run_batch_processor_api(file_paths: List[Path], db: Session, max_threads: int = 4) -> List[Dict[str, Any]]:
    """
    Xử lý hàng loạt các file docx tải lên từ giao diện web sử dụng ThreadPoolExecutor.
    Ánh xạ dữ liệu trích xuất sang các trường tiếng Anh để cập nhật vào Database lớn.
    """
    results = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_threads) as executor:
        futures = {executor.submit(process_single_file, path): path for path in file_paths}
        
        for future in concurrent.futures.as_completed(futures):
            file_data = future.result()
            results.append(file_data)
            
            if file_data['status'] == 'Thành công':
                try:
                    # Kiểm tra xem tàu cá đã tồn tại trong DB chưa dựa trên số đăng ký (registration_number)
                    existing_vessel = db.query(Vessel).filter(
                        Vessel.registration_number == file_data['so_dang_ky']
                    ).first()
                    
                    if existing_vessel:
                        existing_vessel.lmax = file_data['lmax']
                        existing_vessel.inspection_type = file_data['hinh_thuc_kiem_tra']
                        existing_vessel.vessel_class = file_data['cap_tau']
                    else:
                        new_vessel = Vessel(
                            registration_number=file_data['so_dang_ky'],
                            province_code=file_data['ma_tinh'],
                            lmax=file_data['lmax'],
                            inspection_type=file_data['hinh_thuc_kiem_tra'],
                            vessel_class=file_data['cap_tau']
                        )
                        db.add(new_vessel)
                    db.commit()
                except Exception as db_err:
                    db.rollback()
                    file_data['status'] = 'Lỗi lưu DB'
                    file_data['error_msg'] = f"Lỗi Cơ sở dữ liệu: {str(db_err)}"
                    
    return results