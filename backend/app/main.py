import os

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import get_db
from .models.vessel import VesselORM
from .routers.report import generate_report, router as report_router, verify_extension_token

default_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]
configured_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]

app = FastAPI(
    title="Fishing Vessel Report API",
    description="API Dang kiem Tau ca - He thong tu dong xuat bao cao",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=configured_origins or default_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(report_router, prefix="/api")


@app.post("/api/generate-report")
async def generate_report_direct(
    files: list[UploadFile] = File(...),
    quarter: int = Form(...),
    year: int = Form(...),
    provinces: str = Form(...),
    db: Session = Depends(get_db)
):
    return await generate_report(files=files, quarter=quarter, year=year, provinces=provinces, db=db)


@app.get("/api/extension/vessels/{registration_number}")
def get_extension_vessel_direct(
    registration_number: str,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db)
):
    verify_extension_token(authorization)

    normalized_registration = registration_number.strip().upper()
    vessel = db.query(VesselORM).filter(
        VesselORM.registration_number == normalized_registration
    ).first()

    if not vessel:
        raise HTTPException(status_code=404, detail="Khong tim thay du lieu tau theo so dang ky.")

    return {
        "registration_number": vessel.registration_number,
        "owner_name": vessel.owner_name,
        "address": vessel.address,
        "phone_number": "",
        "dossier_content": "",
        "province_code": vessel.province_code,
        "province_name": vessel.province_name,
        "lmax": vessel.lmax,
        "power_kw": vessel.power_kw,
        "material": vessel.material,
        "inspection_type": vessel.inspection_type,
        "length_group": vessel.length_group,
        "valid_until": vessel.valid_until,
        "issued_date": vessel.issued_date,
        "fishing_gear": vessel.fishing_gear
    }


@app.get("/")
def home():
    return {"message": "API Dang kiem Tau ca"}


@app.get("/health")
def health():
    return {"status": "ok"}
