import os
<<<<<<< Updated upstream
=======
from datetime import date
>>>>>>> Stashed changes

os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")

from fastapi.testclient import TestClient  # noqa: E402

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models.vessel import ReportHistoryORM, VesselORM  # noqa: E402
from app.services.docx_parser import VesselData  # noqa: E402
from app.services.batch_processor import save_vessel_data  # noqa: E402


def test_save_vessel_data_inserts_and_updates_by_registration_number():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        db.query(VesselORM).filter(
            VesselORM.registration_number == "QN-90523-TS"
        ).delete()
        db.commit()

        parsed_data = {
            "so_dang_ky": "QN-90523-TS",
            "ma_tinh": "QN",
            "lmax": 21.5,
            "hinh_thuc_kiem_tra": "Định kỳ",
            "ho_ten": "Nguyen Van A",
            "dia_chi": "Quang Ninh",
            "may_chinh": 450.0,
            "vat_lieu": "Gỗ",
            "han_dk": "25/05/2027",
            "nghe": "Luoi keo",
            "ngay_cap": "25/05/2026",
<<<<<<< Updated upstream
        }

        save_vessel_data(db, parsed_data)
        db.commit()
=======
            "file_name": "test.docx"
        }

        save_vessel_data(db, parsed_data)
>>>>>>> Stashed changes

        vessel = (
            db.query(VesselORM)
            .filter(VesselORM.registration_number == "QN-90523-TS")
            .one()
        )
        assert vessel.owner_name == "Nguyen Van A"
        assert vessel.length_group == "20-24m"

        parsed_data["ho_ten"] = "Tran Van B"
        save_vessel_data(db, parsed_data)
<<<<<<< Updated upstream
        db.commit()
=======
>>>>>>> Stashed changes

        vessels = (
            db.query(VesselORM)
            .filter(VesselORM.registration_number == "QN-90523-TS")
            .all()
        )
        assert len(vessels) == 1
        assert vessels[0].owner_name == "Tran Van B"
    finally:
        db.query(VesselORM).filter(
            VesselORM.registration_number == "QN-90523-TS"
        ).delete()
        db.commit()
        db.close()


def test_upload_batch_creates_report_history(monkeypatch):
    Base.metadata.create_all(bind=engine)

    def fake_parse_vessel_docx(_file_path):
        return VesselData(
            so_dang_ky="QN-90524-TS",
            ma_tinh="QN",
            lmax=18.5,
            hinh_thuc_kiem_tra="Hàng năm",
            cap_tau="Hạn chế II",
            ho_ten="Hoang Van C",
            dia_chi="Quang Ninh",
            may_chinh=250.0,
            vat_lieu="Gỗ",
            han_dk="25/05/2027",
            nghe="Luoi re",
            ngay_cap="25/05/2026",
        )

    monkeypatch.setattr(
        "app.services.batch_processor.parse_vessel_docx",
        fake_parse_vessel_docx,
    )

    db = SessionLocal()
    try:
        db.query(ReportHistoryORM).delete()
        db.query(VesselORM).filter(
            VesselORM.registration_number == "QN-90524-TS"
        ).delete()
        db.commit()
    finally:
        db.close()

    client = TestClient(app)
    response = client.post(
        "/api/reports/upload-batch",
        files={
            "files": (
                "sample.docx",
                b"mock-docx-content",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
    )

    assert response.status_code == 200

    db = SessionLocal()
    try:
<<<<<<< Updated upstream
        history = db.query(ReportHistoryORM).one()
        assert history.file_count == 1
        assert history.provinces == "QN"
        assert history.status == "success"
        assert history.file_path is None
    finally:
        db.query(ReportHistoryORM).delete()
=======
        vessel = db.query(VesselORM).filter(
            VesselORM.registration_number == "QN-90524-TS"
        ).one()
        assert vessel.owner_name == "Hoang Van C"
        assert vessel.lmax == 18.5
    finally:
>>>>>>> Stashed changes
        db.query(VesselORM).filter(
            VesselORM.registration_number == "QN-90524-TS"
        ).delete()
        db.commit()
        db.close()
