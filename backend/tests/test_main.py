import os

os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")

from fastapi.testclient import TestClient

from app.main import app


def test_health_endpoint():
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_endpoint_allows_localhost_frontend_origin():
    client = TestClient(app)

    response = client.get("/health", headers={"Origin": "http://localhost:5173"})

    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_extract_archive_zip_vietnamese_characters():
    import io
    import zipfile
    client = TestClient(app)
    
    # Create an in-memory ZIP file
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        # zipfile encodes non-ASCII filenames using cp437 by default
        filename = "Tháng 04.2026.docx"
        zip_file.writestr(filename, b"dummy docx content")
        
    zip_buffer.seek(0)
    
    # Perform the request
    response = client.post(
        "/api/reports/extract-archive",
        files={"file": ("test_archive.zip", zip_buffer, "application/zip")}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "files" in data
    assert len(data["files"]) == 1
    assert data["files"][0]["filename"] == "Tháng 04.2026.docx"

