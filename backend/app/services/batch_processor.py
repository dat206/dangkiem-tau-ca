"""Batch Processor - Xử lý song song nhiều file DOCX và lưu vào DB."""
import concurrent.futures
from pathlib import Path
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from app.services.docx_parser import parse_vessel_docx
from app.models.vessel import VesselORM
from app.services.data_processor import classify_length_group

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
            'registration_no': None,
            'province_code': 'UNK',
            'lmax': 0.0,
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
    
    # Bước 1: Parse song song tất cả file (không truy cập DB trong thread)
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_threads) as executor:
        futures = {executor.submit(process_single_file, path): path for path in file_paths}
        for future in concurrent.futures.as_completed(futures):
            file_data = future.result()
            results.append(file_data)
    
    # Bước 2: Lưu vào DB tuần tự (thread-safe)
    for file_data in results:
        if file_data['status'] != 'Thành công':
            continue
            
        try:
            # Chuẩn hóa dữ liệu (xử lý giá trị None)
            reg_no = file_data.get('registration_no')
            ins_date = file_data.get('inspection_date')
            lmax_val = float(file_data.get('lmax') or 0.0)
            len_group = classify_length_group(lmax_val)
            
            vessel_attrs = {
                "owner_name": file_data.get("owner_name") or "",
                "address": file_data.get("address") or "",
                "address_short": file_data.get("address_short") or "",
                "province_code": file_data.get("province_code") or "UNK",
                "lmax": lmax_val,
                "power_kw": float(file_data.get("power_kw") or 0.0),
                "material": file_data.get("material") or "Không xác định",
                "inspection_type": file_data.get("inspection_type") or "khong_xac_dinh",
                "length_group": len_group,
                "vessel_class": file_data.get("vessel_class") or "khong_xac_dinh",
                "inspection_date": ins_date,
                "valid_until": file_data.get("valid_until"),
                "issued_date": file_data.get("issued_date"),
                "fishing_gear": file_data.get("fishing_gear") or "",
                "source_filename": file_data.get("source_filename") or file_data['file_name'],
            }
        except Exception as py_err:
            file_data['status'] = 'Lỗi dữ liệu'
            file_data['error_msg'] = f"Lỗi xử lý Python: {str(py_err)}"
            continue
        
        try:
            # Upsert: tìm theo registration_no để tránh IntegrityError
            existing_vessel = None
            if reg_no:
                existing_vessel = db.query(VesselORM).filter(
                    VesselORM.registration_no == reg_no
                ).first()
            
            if existing_vessel:
                for k, v in vessel_attrs.items():
                    setattr(existing_vessel, k, v)
            else:
                new_vessel = VesselORM(
                    registration_no=reg_no,
                    **vessel_attrs
                )
                db.add(new_vessel)
            db.commit()
        except Exception as db_err:
            db.rollback()
            file_data['status'] = 'Lỗi lưu DB'
            file_data['error_msg'] = f"Lỗi Cơ sở dữ liệu: {str(db_err)}"
                    
    return results
