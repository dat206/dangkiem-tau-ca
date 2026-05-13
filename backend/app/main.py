from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.report import router as report_router

app = FastAPI(
    title="Fishing Vessel Report API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(report_router, prefix="/api")

@app.get("/")
def home():
    return {"message": "API Đăng kiểm Tàu cá"}

@app.get("/health")
def health():
    return {"status": "ok"}
