from fastapi import FastAPI
from .routers.report import router as report_router

app = FastAPI(
    title="Fishing Vessel Report API"
)

app.include_router(report_router)

@app.get("/")
def home():
    return {"message": "API Đăng kiểm Tàu cá"}

@app.get("/health")
def health():
    return {"status": "ok"}