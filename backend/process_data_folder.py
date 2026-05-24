"""
Batch script: Read all .docx files from the data/ folder, parse them,
save to SQLite database, then query and generate Excel reports back
into the data/ folder.

Usage:
    python process_data_folder.py
"""

import os
import sys
from pathlib import Path
from datetime import datetime

# Ensure correct encoding on Windows console
for stream_name in ("stdout", "stderr"):
    stream = getattr(sys, stream_name, None)
    if stream is not None and hasattr(stream, "reconfigure"):
        stream.reconfigure(encoding="utf-8", errors="replace")

# Setup environment
os.environ.setdefault("DATABASE_URL", "sqlite:///./fishing_vessels.db")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.vessel import VesselORM
from app.services.docx_parser import parse_vessel_docx
from app.services.data_processor import classify_length_group, get_province_name, aggregate_vessels
from app.services.excel_generator import generate_vessel_excel, generate_quarterly_summary_excel


def main():
    # ── Configuration ─────────────────────────────────────────────────────
    PROJECT_ROOT = Path(__file__).resolve().parent.parent
    DATA_DIR = PROJECT_ROOT / "data"
    DB_URL = "sqlite:///./fishing_vessels.db"

    print(f"[INFO] Project root: {PROJECT_ROOT}")
    print(f"[INFO] Data directory: {DATA_DIR}")
    print(f"[INFO] Database: {DB_URL}")

    # ── Database setup ────────────────────────────────────────────────────
    engine = create_engine(DB_URL, echo=False)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    # ── Step 1: Parse all DOCX files ──────────────────────────────────────
    docx_files = sorted(DATA_DIR.glob("*.docx"))
    print(f"\n[STEP 1] Found {len(docx_files)} .docx files in data/")

    parsed_count = 0
    error_count = 0
    error_files = []
    vessel_records_for_excel = []

    for filepath in docx_files:
        try:
            parsed = parse_vessel_docx(str(filepath))
            vessel_dict = parsed.model_dump()

            # Compute derived fields
            lmax_val = vessel_dict["lmax"]
            len_group = classify_length_group(lmax_val)
            prov_name = get_province_name(vessel_dict["ma_tinh"])

            vessel_attrs = {
                "owner_name": vessel_dict.get("ho_ten", ""),
                "address": vessel_dict.get("dia_chi", ""),
                "province_code": vessel_dict.get("ma_tinh", ""),
                "province_name": prov_name,
                "lmax": lmax_val,
                "power_kw": vessel_dict.get("may_chinh", 0.0),
                "material": vessel_dict.get("vat_lieu", ""),
                "inspection_type": vessel_dict.get("hinh_thuc_kiem_tra", ""),
                "length_group": len_group,
                "valid_until": vessel_dict.get("han_dk", ""),
                "issued_date": vessel_dict.get("ngay_cap", ""),
                "fishing_gear": vessel_dict.get("nghe", ""),
            }

            # Upsert into DB
            existing = db.query(VesselORM).filter(
                VesselORM.registration_number == vessel_dict["so_dang_ky"]
            ).first()

            if existing:
                for k, v in vessel_attrs.items():
                    setattr(existing, k, v)
            else:
                new_vessel = VesselORM(
                    registration_number=vessel_dict["so_dang_ky"],
                    **vessel_attrs
                )
                db.add(new_vessel)

            db.commit()
            parsed_count += 1

            # Collect for Excel generation
            vessel_records_for_excel.append({
                "registration_no": vessel_dict["so_dang_ky"],
                "owner": vessel_dict.get("ho_ten", ""),
                "address": vessel_dict.get("dia_chi", ""),
                "province_code": vessel_dict.get("ma_tinh", ""),
                "lmax": lmax_val,
                "engine_power": vessel_dict.get("may_chinh", 0.0),
                "material": vessel_dict.get("vat_lieu", ""),
                "inspection_type": vessel_dict.get("hinh_thuc_kiem_tra", ""),
                "length_group": len_group,
                "valid_until": vessel_dict.get("han_dk", ""),
                "issued_date": vessel_dict.get("ngay_cap", ""),
                "fishing_gear": vessel_dict.get("nghe", ""),
                "ma_tinh": vessel_dict.get("ma_tinh", ""),
                "hinh_thuc_kiem_tra": vessel_dict.get("hinh_thuc_kiem_tra", ""),
                "vat_lieu": vessel_dict.get("vat_lieu", ""),
            })

        except Exception as e:
            error_count += 1
            error_files.append((filepath.name, str(e)))

    print(f"   Parsed & saved: {parsed_count}")
    print(f"   Errors: {error_count}")
    if error_files:
        for fname, err in error_files:
            print(f"     - {fname}: {err}")

    # ── Step 2: Query all vessels from database ───────────────────────────
    all_vessels = db.query(VesselORM).all()
    print(f"\n[STEP 2] Total vessels in database: {len(all_vessels)}")

    # Convert DB records to dicts for aggregation
    db_vessel_dicts = []
    excel_vessel_list = []
    for v in all_vessels:
        db_vessel_dicts.append({
            "ma_tinh": v.province_code,
            "lmax": v.lmax,
            "vat_lieu": v.material,
            "hinh_thuc_kiem_tra": v.inspection_type,
        })
        excel_vessel_list.append({
            "registration_no": v.registration_number,
            "owner": v.owner_name,
            "lmax": v.lmax,
            "engine_power": v.power_kw,
        })

    # ── Step 3: Aggregate data ────────────────────────────────────────────
    aggregated = aggregate_vessels(db_vessel_dicts)
    print(f"\n[STEP 3] Aggregated statistics:")
    print(f"   Total: {aggregated['total']}")
    print(f"   By province: {aggregated['by_province']}")
    print(f"   By length group: {aggregated['by_length_group']}")
    print(f"   By material: {aggregated['by_material']}")
    print(f"   By inspection type: {aggregated['by_inspection_type']}")

    # ── Step 4: Generate Excel reports in data/ folder ────────────────────
    print(f"\n[STEP 4] Generating Excel reports in data/ folder...")

    # Report 1: Tổng hợp ghi sổ
    registry_excel = generate_vessel_excel(excel_vessel_list)
    registry_path = DATA_DIR / "tong_hop_ghi_so_generated.xlsx"
    with open(registry_path, "wb") as f:
        f.write(registry_excel.getvalue())
    print(f"   Created: {registry_path.name}")
    
    registry_canonical_path = DATA_DIR / "tong_hop_ghi_so.xlsx"
    with open(registry_canonical_path, "wb") as f:
        f.write(registry_excel.getvalue())
    print(f"   Created: {registry_canonical_path.name}")

    # Report 2: Báo cáo thống kê
    now = datetime.now()
    current_quarter = (now.month - 1) // 3 + 1
    current_year = now.year
    summary_excel = generate_quarterly_summary_excel(aggregated, current_quarter, current_year)
    summary_path = DATA_DIR / "bao_cao_thong_ke_generated.xlsx"
    with open(summary_path, "wb") as f:
        f.write(summary_excel.getvalue())
    print(f"   Created: {summary_path.name}")

    summary_canonical_path = DATA_DIR / "bao_cao_thong_ke.xlsx"
    with open(summary_canonical_path, "wb") as f:
        f.write(summary_excel.getvalue())
    print(f"   Created: {summary_canonical_path.name}")

    # ── Step 5: Verify generated files ────────────────────────────────────
    print(f"\n[STEP 5] Verification:")
    for fpath in [registry_path, registry_canonical_path, summary_path, summary_canonical_path]:
        if fpath.exists():
            size = fpath.stat().st_size
            print(f"   OK {fpath.name} ({size:,} bytes)")
        else:
            print(f"   FAIL {fpath.name} does not exist!")

    # Summary
    print(f"\n{'='*60}")
    print(f"  BATCH PROCESSING COMPLETE")
    print(f"  Files parsed: {parsed_count}/{len(docx_files)}")
    print(f"  DB records: {len(all_vessels)}")
    print(f"  Excel reports in: {DATA_DIR}")
    print(f"{'='*60}")

    db.close()


if __name__ == "__main__":
    main()
