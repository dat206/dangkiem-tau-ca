import concurrent.futures
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app.models.vessel import VesselORM
from app.services.docx_parser import parse_vessel_docx


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
            "hinh_thuc_kiem_tra": "Khong xac dinh",
            "cap_tau": "Khong xac dinh",
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
                existing_vessel = (
                    db.query(VesselORM)
                    .filter(VesselORM.registration_number == file_data["so_dang_ky"])
                    .first()
                )

                vessel_values = {
                    "registration_number": file_data["so_dang_ky"],
                    "province_code": file_data["ma_tinh"],
                    "owner_name": file_data.get("ho_ten", ""),
                    "address": file_data.get("dia_chi", ""),
                    "lmax": file_data["lmax"],
                    "power_kw": file_data.get("may_chinh", 0.0),
                    "inspection_type": file_data["hinh_thuc_kiem_tra"],
                    "fishing_gear": file_data.get("nghe", ""),
                    "valid_until": file_data.get("han_dk", ""),
                }

                if existing_vessel:
                    for field, value in vessel_values.items():
                        setattr(existing_vessel, field, value)
                else:
                    db.add(VesselORM(**vessel_values))

                db.commit()
            except Exception as db_err:
                db.rollback()
                file_data["status"] = "db_error"
                file_data["ok"] = False
                file_data["error_msg"] = f"Loi co so du lieu: {db_err}"

    return results
