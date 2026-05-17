import concurrent.futures
from pathlib import Path
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.services.docx_parser import parse_vessel_docx
from app.models.vessel import Vessel  # Giả định Model chính lưu DB tên là Vessel

def process_single_file_to_dict(file_path: Path) -> Dict[str, Any]:
    """Xử lý đơn lẻ 1 file phục vụ cho kiến trúc chạy đa luồng."""
    try:
        data = parse_vessel_docx(str(file_path))
        result = data.model_dump()
        result['file_name'] = file_path.name
        result['status'] = 'Thành công'
        result['error_msg'] = ''
        return result
    except Exception as e:
        return {
            'so_dang_ky': None, 
            'ma_tinh': None, 
            'lmax': 0.0, 
            'hinh_thuc_kiem_tra': 'Không xác định', 
            'cap_tau': 'Không xác định',
            'file_name': file_path.name,
            'status': 'Lỗi',
            'error_msg': str(e)
        }

def run_batch_processor_api(file_paths: List[Path], db: Session, max_threads: int = 4) -> List[Dict[str, Any]]:
    """
    Hàm xử lý hàng loạt các file docx tải lên từ API Web sử dụng ThreadPoolExecutor.
    Lưu trực tiếp kết quả thành công vào Database chính của hệ thống.
    """
    results = []
    
    # Kích hoạt đa luồng xử lý đồng thời để đạt hiệu năng cao nhất
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_threads) as executor:
        futures = {executor.submit(process_single_file_to_dict, path): path for path in file_paths}
        
        for future in concurrent.futures.as_completed(futures):
            file_data = future.result()
            results.append(file_data)
            
            # Nếu trích xuất thành công, tiến hành lưu hoặc cập nhật vào database hệ thống
            if file_data['status'] == 'Thành công':
                try:
                    # Kiểm tra xem tàu này đã tồn tại trong DB chưa dựa trên Số Đăng Ký
                    existing_vessel = db.query(Vessel).filter(Vessel.so_dang_ky == file_data['so_dang_ky']).first()
                    
                    if existing_vessel:
                        # Cập nhật thông số mới nhất nếu đã tồn tại
                        existing_vessel.lmax = file_data['lmax']
                        existing_vessel.hinh_thuc_kiem_tra = file_data['hinh_thuc_kiem_tra']
                        existing_vessel.cap_tau = file_data['cap_tau']
                    else:
                        # Thêm bản ghi mới hoàn toàn vào bảng
                        new_vessel = Vessel(
                            so_dang_ky=file_data['so_dang_ky'],
                            ma_tinh=file_data['ma_tinh'],
                            lmax=file_data['lmax'],
                            hinh_thuc_kiem_tra=file_data['hinh_thuc_kiem_tra'],
                            cap_tau=file_data['cap_tau']
                        )
                        db.add(new_vessel)
                    
                    db.commit()
                except Exception as db_err:
                    db.rollback()
                    file_data['status'] = 'Lỗi lưu DB'
                    file_data['error_msg'] = f"Lỗi Cơ sở dữ liệu: {str(db_err)}"
                    
    return results