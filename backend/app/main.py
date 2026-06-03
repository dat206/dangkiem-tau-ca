from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers.report import router as report_router
from .routers.vessels import router as vessel_router

app = FastAPI(
    title="Fishing Vessel Report API",
    description="API Đăng kiểm Tàu cá – Hệ thống tự động xuất báo cáo",
    version="1.0.0",
)

# -- CORS middleware ----------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -- Routers ------------------------------------------------------------------
app.include_router(report_router, prefix="/api")
app.include_router(vessel_router, prefix="/api")

# -- Direct API alias for generate-report to match API.md specification -------
from fastapi import UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.routers.report import generate_report

@app.post("/api/generate-report")
async def generate_report_direct(
    files: list[UploadFile] = File(...),
    quarter: int = Form(...),
    year: int = Form(...),
    provinces: str = Form(...),
    db: Session = Depends(get_db)
):
    return await generate_report(files=files, quarter=quarter, year=year, provinces=provinces, db=db)


# -- Root endpoints -----------------------------------------------------------
@app.get("/")
def home():
    return {"message": "API Đăng kiểm Tàu cá"}


@app.get("/health")
def health():
    return {"status": "ok"}
