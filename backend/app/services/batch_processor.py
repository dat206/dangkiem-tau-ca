"""Batch Processor - Xử lý song song nhiều file DOCX và lưu vào DB."""
import concurrent.futures
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app.models.vessel import VesselORM
from app.services.docx_parser import parse_vessel_docx
from app.services.data_processor import classify_length_group, get_province_name


def save_vessel_data(db: Session, vessel_data: dict[str, Any]) -> VesselORM:
    """Insert or update one parsed vessel row."""

    registration_number = vessel_data["so_dang_ky"]
    lmax_val = vessel_data["lmax"]

    vessel_values = {
        "registration_number": registration_number,
        "province_code": vessel_data.get("ma_tinh", ""),
        "province_name": get_province_name(vessel_data.get("ma_tinh", "")),
        "owner_name": vessel_data.get("ho_ten", ""),
        "address": vessel_data.get("dia_chi", ""),
        "lmax": lmax_val,
        "power_kw": vessel_data.get("may_chinh", 0.0),
        "material": vessel_data.get("vat_lieu", ""),
        "inspection_type": vessel_data.get("hinh_thuc_kiem_tra", ""),
        "length_group": classify_length_group(lmax_val),
        "valid_until": vessel_data.get("han_dk", ""),
        "issued_date": vessel_data.get("ngay_cap", ""),
        "fishing_gear": vessel_data.get("nghe", ""),
    }

    existing_vessel = (
        db.query(VesselORM)
        .filter(VesselORM.registration_number == registration_number)
        .first()
    )

    if existing_vessel:
        for field, value in vessel_values.items():
            setattr(existing_vessel, field, value)
        return existing_vessel

    new_vessel = VesselORM(**vessel_values)
    db.add(new_vessel)
    return new_vessel


def process_single_file(file_path: Path) -> dict[str, Any]:
    """Process one DOCX file for the batch upload endpoint."""

    try:
        data = parse_vessel_docx(str(file_path))
        result = data.model_dump()
        result["file_name"] = file_path.name
        result["status"] = "success"
        result["ok"] = True
        result["error_msg"] = ""
        return result
    except Exception as exc:
        return {
            "so_dang_ky": "",
            "ma_tinh": "",
            "lmax": 0.0,
            "hinh_thuc_kiem_tra": "Không xác định",
            "cap_tau": "Không xác định",
            "ho_ten": "",
            "dia_chi": "",
            "may_chinh": 0.0,
            "vat_lieu": "",
            "han_dk": "",
            "nghe": "",
            "ngay_cap": "",
            "file_name": file_path.name,
            "status": "error",
            "ok": False,
            "error_msg": str(exc),
        }


def run_batch_processor_api(
    file_paths: list[Path],
    db: Session,
    max_threads: int = 4,
) -> list[dict[str, Any]]:
    """Process uploaded DOCX files concurrently and persist successful rows."""

    results: list[dict[str, Any]] = []

    with concurrent.futures.ThreadPoolExecutor(max_workers=max_threads) as executor:
        futures = {executor.submit(process_single_file, path): path for path in file_paths}

        for future in concurrent.futures.as_completed(futures):
            file_data = future.result()
            results.append(file_data)

            if not file_data.get("ok"):
                continue

            try:
                save_vessel_data(db, file_data)
                db.commit()
            except Exception as db_err:
                db.rollback()
                file_data["status"] = "db_error"
                file_data["ok"] = False
                file_data["error_msg"] = f"Lỗi cơ sở dữ liệu: {db_err}"

    return results
