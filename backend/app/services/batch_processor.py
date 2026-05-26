"""Batch Processor - Xử lý song song nhiều file DOCX và lưu vào DB."""
import concurrent.futures
from pathlib import Path
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_

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
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_threads) as executor:
        futures = {executor.submit(process_single_file, path): path for path in file_paths}
        
        for future in concurrent.futures.as_completed(futures):
            file_data = future.result()
            results.append(file_data)
            
            if file_data['status'] == 'Thành công':
                try:
                    reg_no = file_data.get('registration_no')
                    ins_date = file_data.get('inspection_date')
                    
                    # Upsert logic based on UNIQUE(registration_no, inspection_date)
                    existing_vessel = None
                    if reg_no and ins_date:
                        existing_vessel = db.query(VesselORM).filter(
                            and_(
                                VesselORM.registration_no == reg_no,
                                VesselORM.inspection_date == ins_date
                            )
                        ).first()
                    
                    lmax_val = file_data.get('lmax', 0.0)
                    len_group = classify_length_group(lmax_val)
                    
                    vessel_attrs = {
                        "owner_name": file_data.get("owner_name", ""),
                        "address": file_data.get("address", ""),
                        "address_short": file_data.get("address_short", ""),
                        "province_code": file_data.get("province_code", ""),
                        "lmax": lmax_val,
                        "power_kw": file_data.get("power_kw", 0.0),
                        "material": file_data.get("material", "Không xác định"),
                        "inspection_type": file_data.get("inspection_type", "khong_xac_dinh"),
                        "length_group": len_group,
                        "vessel_class": file_data.get("vessel_class", "khong_xac_dinh"),
                        "inspection_date": ins_date,
                        "valid_until": file_data.get("valid_until"),
                        "issued_date": file_data.get("issued_date"),
                        "fishing_gear": file_data.get("fishing_gear", ""),
                        "source_filename": file_data.get("source_filename", file_data['file_name']),
                    }
                    
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