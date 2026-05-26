from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers.report import router as report_router
from .routers.auth import router as auth_router

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
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost",
        "http://127.0.0.1",
        "null",  # file:// origin khi mở trực tiếp HTML
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -- Routers ------------------------------------------------------------------
# Tất cả route reports được đăng ký qua report_router với prefix /api/reports
# Ví dụ: POST /api/reports/generate-report, POST /api/reports/upload-batch
app.include_router(report_router, prefix="/api")

# Auth routes: POST /api/auth/register, POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me
app.include_router(auth_router, prefix="/api")

# -- Root endpoints -----------------------------------------------------------
@app.get("/")
def home():
    return {"message": "API Đăng kiểm Tàu cá"}


@app.get("/health")
def health():
    return {"status": "ok"}
