from fastapi import FastAPI

app = FastAPI(
    title="Đăng kiểm Tàu cá API",
    version="1.0.0"
)

@app.get("/")
def home():
    return {"message": "API Đăng kiểm Tàu cá"}

@app.get("/health")
def health():
    return {"status": "ok"}