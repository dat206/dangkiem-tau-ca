from fastapi import FastAPI
from app.routers.report import router as report_router

app = FastAPI(
    title="Fishing Vessel Report API"
)

app.include_router(report_router, prefix="/api")

@app.get("/")
def home():
    return {"message": "API Đăng kiểm Tàu cá"}

@app.get("/health")
def health():
    return {"status": "ok"}