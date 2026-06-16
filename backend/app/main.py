from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, report, vessels
from app.database import engine, Base

# Tạo các bảng trong DB (nếu chưa có)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Hệ thống Đăng kiểm Tàu cá")

# --- CẤU HÌNH CORS ĐỂ FRONTEND GỌI ĐƯỢC API ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://dangkiem-tau-ca-murex.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ----------------------------------------------

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(report.router, prefix="/api/reports", tags=["reports"])
app.include_router(vessels.router, prefix="/api/vessels", tags=["vessels"])

@app.get("/")
def read_root():
    return {"message": "Hệ thống đăng kiểm tàu cá đã sẵn sàng"}