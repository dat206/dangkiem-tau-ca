import os
from datetime import datetime

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models.vessel import ReportHistoryORM  # noqa: E402


@pytest.fixture(autouse=True)
def clean_report_history():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        db.query(ReportHistoryORM).delete()
        db.commit()
    finally:
        db.close()

    yield

    db = SessionLocal()
    try:
        db.query(ReportHistoryORM).delete()
        db.commit()
    finally:
        db.close()


def add_history_item(**overrides):
    data = {
        "created_at": datetime(2026, 5, 17, 8, 30),
        "quarter": 1,
        "year": 2026,
        "file_count": 3,
        "provinces": "QN,TH",
        "file_path": None,
        "status": "success",
    }
    data.update(overrides)

    db = SessionLocal()
    try:
        item = ReportHistoryORM(**data)
        db.add(item)
        db.commit()
        db.refresh(item)
        return item.id
    finally:
        db.close()


def test_get_report_history_filters_by_quarter_and_year():
    add_history_item(quarter=1, year=2026, file_count=3, provinces="QN")
    add_history_item(quarter=2, year=2026, file_count=4, provinces="TH")

    client = TestClient(app)
    response = client.get("/api/reports/history", params={"quarter": 1, "year": 2026})

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["quarter"] == 1
    assert data["items"][0]["year"] == 2026
    assert data["items"][0]["file_count"] == 3
    assert data["items"][0]["provinces"] == "QN"


def test_download_report_history_returns_saved_file(tmp_path):
    report_file = tmp_path / "report_q1_2026.zip"
    report_file.write_bytes(b"zip-content")
    report_id = add_history_item(file_path=str(report_file), created_at=datetime.utcnow())

    client = TestClient(app)
    response = client.get(f"/api/reports/history/{report_id}/download")

    assert response.status_code == 200
    assert response.content == b"zip-content"
