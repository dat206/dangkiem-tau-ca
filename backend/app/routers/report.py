from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.vessel import ReportHistoryORM

router = APIRouter()


@router.post("/generate-report")
async def generate_report(file: UploadFile = File(...)):
    return {
        "filename": file.filename,
        "content_type": file.content_type
    }


@router.get("/reports/history")
def get_report_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    quarter: int | None = Query(None, ge=1, le=4),
    year: int | None = Query(None, ge=2000, le=2100),
    db: Session = Depends(get_db),
):
    query = db.query(ReportHistoryORM)

    if quarter is not None:
        query = query.filter(ReportHistoryORM.quarter == quarter)
    if year is not None:
        query = query.filter(ReportHistoryORM.year == year)

    total = query.count()
    reports = (
        query.order_by(ReportHistoryORM.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return {
        "items": [
            {
                "id": report.id,
                "created_at": report.created_at,
                "quarter": report.quarter,
                "year": report.year,
                "file_count": report.file_count,
                "provinces": report.provinces,
                "status": report.status,
                "has_file": bool(report.file_path),
            }
            for report in reports
        ],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/reports/history/{report_id}/download")
def download_report_history(report_id: int, db: Session = Depends(get_db)):
    report = db.query(ReportHistoryORM).filter(ReportHistoryORM.id == report_id).first()

    if report is None:
        raise HTTPException(status_code=404, detail="Report history item not found")
    if not report.file_path:
        raise HTTPException(status_code=404, detail="Report file is not available")

    file_path = Path(report.file_path)
    if not file_path.is_absolute():
        file_path = Path.cwd() / file_path

    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="Report file is not available")

    return FileResponse(
        path=file_path,
        filename=file_path.name,
        media_type="application/octet-stream",
    )
