"""Batch Processor - Xử lý song song nhiều file DOCX và lưu vào DB."""
import concurrent.futures
from pathlib import Path
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.services.docx_parser import parse_vessel_docx
from app.models.vessel import VesselORM
from app.services.data_processor import classify_length_group

def safe_truncate(val: Any, max_len: int) -> Any:
    """Cắt chuỗi về độ dài tối đa cho phép để tránh lỗi DB."""
    if isinstance(val, str):
        return val[:max_len]
    return val

def process_single_file(args: tuple) -> Dict[str, Any]:
    """Xử lý đơn lẻ từng file để phục vụ cho luồng chạy song song."""
    file_path, original_name = args
    if isinstance(file_path, str):
        file_path = Path(file_path)
        
    try:
        data = parse_vessel_docx(str(file_path))
        result = data.model_dump()
        result['file_name'] = original_name
        result['status'] = 'Thành công'
        result['error_msg'] = ''
        return result
    except Exception as e:
        return {
            'registration_no': None,
            'province_code': 'UNK',
            'lmax': 0.0,
            'file_name': original_name,
            'status': 'Lỗi',
            'error_msg': str(e)
        }

def run_batch_processor_api(file_paths_with_names: List[tuple], db: Session, max_threads: int = 4) -> List[Dict[str, Any]]:
    """
    Xử lý hàng loạt các file docx tải lên từ giao diện web sử dụng ThreadPoolExecutor.
    Ánh xạ dữ liệu trích xuất sang các trường tiếng Anh để cập nhật vào Database lớn.
    """
    from typing import Any
    results = []
    
    # 1. Parse all files in parallel
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_threads) as executor:
        futures = {executor.submit(process_single_file, item): item for item in file_paths_with_names}
        for future in concurrent.futures.as_completed(futures):
            results.append(future.result())
            
    # 2. Extract registration numbers to fetch existing vessels in bulk
    reg_nos = [safe_truncate(r['registration_no'], 50) for r in results if r['status'] == 'Thành công' and r['registration_no']]
    
    existing_vessels_map = {}
    if reg_nos:
        try:
            existing_vessels_list = db.query(VesselORM).filter(VesselORM.registration_no.in_(reg_nos)).all()
            # Map by (registration_no, inspection_date)
            existing_vessels_map = {(v.registration_no, v.inspection_date): v for v in existing_vessels_list}
        except Exception as q_err:
            print(f"Error querying existing vessels: {q_err}")

    # 3. Perform memory updates and add to DB session
    for file_data in results:
        if file_data['status'] == 'Thành công':
            try:
                reg_no = file_data.get('registration_no')
                if reg_no:
                    reg_no = safe_truncate(reg_no, 50)
                ins_date = file_data.get('inspection_date')
                
                lmax_val = file_data.get('lmax', 0.0)
                len_group = classify_length_group(lmax_val)
                
                vessel_attrs = {
                    "owner_name": safe_truncate(file_data.get("owner_name", ""), 255),
                    "address": safe_truncate(file_data.get("address", ""), 255),
                    "address_short": safe_truncate(file_data.get("address_short", ""), 60),
                    "province_code": safe_truncate(file_data.get("province_code", ""), 10),
                    "lmax": lmax_val,
                    "power_kw": file_data.get("power_kw", 0.0),
                    "material": safe_truncate(file_data.get("material", "Không xác định"), 20),
                    "inspection_type": safe_truncate(file_data.get("inspection_type", "khong_xac_dinh"), 50),
                    "length_group": safe_truncate(len_group, 20),
                    "vessel_class": safe_truncate(file_data.get("vessel_class", "khong_xac_dinh"), 20),
                    "technical_status": safe_truncate(file_data.get("technical_status", ""), 255),
                    "inspection_date": ins_date,
                    "valid_until": file_data.get("valid_until"),
                    "issued_date": file_data.get("issued_date"),
                    "fishing_gear": safe_truncate(file_data.get("fishing_gear", ""), 255),
                    "source_filename": safe_truncate(file_data.get("file_name") or file_data.get("source_filename", ""), 255),
                    "build_year": safe_truncate(file_data.get("build_year", ""), 50),
                    "build_place": safe_truncate(file_data.get("build_place", ""), 255),
                    "gross_tonnage": file_data.get("gross_tonnage", 0.0),
                    "crew_limit": file_data.get("crew_limit", 0),
                    "bmax": file_data.get("bmax", 0.0),
                    "depth": file_data.get("depth", 0.0),
                    "engine_model": safe_truncate(file_data.get("engine_model", ""), 100),
                    "engine_serial": safe_truncate(file_data.get("engine_serial", ""), 100),
                    "engine_build_info": safe_truncate(file_data.get("engine_build_info", ""), 255),
                    "allowed_area": safe_truncate(file_data.get("allowed_area", ""), 500),
                }
                
                existing_vessel = existing_vessels_map.get((reg_no, ins_date))
                if existing_vessel:
                    for k, v in vessel_attrs.items():
                        setattr(existing_vessel, k, v)
                    file_data['status'] = 'Trùng lặp'
                    file_data['error_msg'] = 'Đã cập nhật dữ liệu mới đè lên bản ghi cũ'
                else:
                    new_vessel = VesselORM(
                        registration_no=reg_no,
                        **vessel_attrs
                    )
                    db.add(new_vessel)
                    existing_vessels_map[(reg_no, ins_date)] = new_vessel # add to map to prevent adding duplicates in the same batch
            except Exception as db_err:
                file_data['status'] = 'Lỗi chuẩn bị DB'
                file_data['error_msg'] = f"Lỗi chuẩn bị dữ liệu: {str(db_err)}"

    # 4. Commit transaction once for the entire batch
    try:
        db.commit()
    except Exception as commit_err:
        db.rollback()
        for file_data in results:
            if file_data['status'] in ['Thành công', 'Trùng lặp']:
                file_data['status'] = 'Lỗi lưu DB'
                file_data['error_msg'] = f"Lỗi commit dữ liệu: {str(commit_err)}"

    return results
