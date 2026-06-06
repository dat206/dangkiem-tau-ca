import os
from datetime import date
from pathlib import Path

os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")

from fastapi.testclient import TestClient  # noqa: E402

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models.vessel import ReportHistoryORM, VesselORM  # noqa: E402
from app.services.docx_parser import VesselData  # noqa: E402


def test_upload_batch_creates_vessels(monkeypatch):
    Base.metadata.create_all(bind=engine)

    def fake_parse_vessel_docx(_file_path):
        return VesselData(
            registration_no="QN-90524-TS",
            province_code="QN",
            lmax=18.5,
            inspection_type="Hàng năm",
            vessel_class="Hạn chế II",
            owner_name="Hoang Van C",
            address="Quang Ninh",
            power_kw=250.0,
            material="Gỗ",
            valid_until="2027-05-25",
            fishing_gear="Luoi re",
            issued_date="2026-05-25",
            inspection_date="2026-05-25",
        )

    monkeypatch.setattr(
        "app.services.batch_processor.parse_vessel_docx",
        fake_parse_vessel_docx,
    )

    db = SessionLocal()
    try:
        db.query(ReportHistoryORM).delete()
        db.query(VesselORM).filter(
            VesselORM.registration_no == "QN-90524-TS"
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
        vessel = db.query(VesselORM).filter(
            VesselORM.registration_no == "QN-90524-TS"
        ).one()
        assert vessel.owner_name == "Hoang Van C"
        assert vessel.lmax == 18.5
    finally:
        db.query(VesselORM).filter(
            VesselORM.registration_no == "QN-90524-TS"
        ).delete()
        db.commit()
        db.close()
