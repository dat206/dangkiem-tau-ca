"""Batch Processor - Xử lý song song nhiều file DOCX và lưu vào DB."""
import concurrent.futures
from pathlib import Path
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.services.docx_parser import parse_vessel_docx
from app.models.vessel import VesselORM
from app.services.data_processor import classify_length_group, get_province_name

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
            'ho_ten': '',
            'dia_chi': '',
            'may_chinh': 0.0,
            'vat_lieu': '',
            'han_dk': '',
            'nghe': '',
            'ngay_cap': '',
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
                    existing_vessel = db.query(VesselORM).filter(
                        VesselORM.registration_number == file_data['so_dang_ky']
                    ).first()
                    
                    lmax_val = file_data['lmax']
                    len_group = classify_length_group(lmax_val)
                    prov_name = get_province_name(file_data['ma_tinh'])
                    
                    vessel_attrs = {
                        "owner_name": file_data.get("ho_ten", ""),
                        "address": file_data.get("dia_chi", ""),
                        "province_code": file_data.get("ma_tinh", ""),
                        "province_name": prov_name,
                        "lmax": lmax_val,
                        "power_kw": file_data.get("may_chinh", 0.0),
                        "material": file_data.get("vat_lieu", ""),
                        "inspection_type": file_data.get("hinh_thuc_kiem_tra", ""),
                        "length_group": len_group,
                        "valid_until": file_data.get("han_dk", ""),
                        "issued_date": file_data.get("ngay_cap", ""),
                        "fishing_gear": file_data.get("nghe", ""),
                    }
                    
                    if existing_vessel:
                        for k, v in vessel_attrs.items():
                            setattr(existing_vessel, k, v)
                    else:
                        new_vessel = VesselORM(
                            registration_number=file_data['so_dang_ky'],
                            **vessel_attrs
                        )
                        db.add(new_vessel)
                    db.commit()
                except Exception as db_err:
                    db.rollback()
                    file_data['status'] = 'Lỗi lưu DB'
                    file_data['error_msg'] = f"Lỗi Cơ sở dữ liệu: {str(db_err)}"
                    
    return results