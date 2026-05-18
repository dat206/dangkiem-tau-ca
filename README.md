# 🐟 Hệ thống tự động xuất báo cáo Đăng kiểm Tàu cá

> Giải pháp quản lý và xuất báo cáo đăng kiểm tàu cá tự động bằng Python + React

## 📋 Giới thiệu

Hệ thống cho phép:
- ✅ Upload nhiều file Giấy CN An toàn KT tàu cá (DOCX)
- ✅ Tự động trích xuất dữ liệu từ các file DOCX
- ✅ Phân loại và tổng hợp theo tỉnh, Lmax, vật liệu
- ✅ Xuất 2 file Excel báo cáo (Bảng kê tổng hợp + Báo cáo quý)
- ✅ Lưu lịch sử các lần xuất báo cáo

---

## 🛠️ Tech Stack

### Frontend
- **React 18** + **Vite 5** - SPA nhanh, hot reload
- **Tailwind CSS** - Styling utility-first
- **Axios** - HTTP client
- **Vercel** - Deployment

### Backend
- **FastAPI** - REST API framework Python
- **python-docx** - Parse file DOCX
- **openpyxl** - Tạo file Excel
- **PostgreSQL** + **Neon.tech** - Database
- **Alembic** - Database migrations
- **SQLAlchemy** - ORM
- **Render.com** - Deployment

---

## 🚀 Quick Start

### Chuẩn bị
- Python 3.11 hoặc 3.12 cho backend
- Node.js 18+
- PostgreSQL 14+ (hoặc Neon.tech account miễn phí)

### Backend Setup (Local)

```bash
cd backend

# Tạo virtual environment
python -m venv venv
source venv/bin/activate  # Trên Windows: venv\Scripts\activate

# Cài dependencies
pip install -r requirements.txt

# Cấu hình database
cp .env.example .env
# Cập nhật DATABASE_URL trong .env bằng connection string Neon/PostgreSQL

# Chạy migrations
alembic upgrade head

# Chạy server
uvicorn app.main:app --reload
```

Server chạy tại: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

### Frontend Setup (Local)

```bash
cd frontend

# Cài dependencies
npm install

# Tạo .env từ file mẫu
cp .env.example .env

# Chạy dev server
npm run dev
```

App chạy tại: `http://localhost:5173`

---

## 📁 Cấu trúc dự án

```
fishing-vessel-report/
├── frontend/                        # React + Vite app
│   ├── src/
│   │   ├── components/              # UI components
│   │   │   ├── FileUpload.jsx
│   │   │   ├── ReportConfig.jsx
│   │   │   └── DownloadPanel.jsx
│   │   ├── api/                     # API client
│   │   │   └── reportApi.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── .env.example
│   └── eslint.config.js
│
├── backend/                         # FastAPI app
│   ├── app/
│   │   ├── main.py                  # Entry point
│   │   ├── routers/
│   │   │   └── report.py            # API routes
│   │   ├── services/                # Business logic
│   │   │   ├── docx_parser.py
│   │   │   ├── data_processor.py
│   │   │   └── excel_generator.py
│   │   ├── models/
│   │   │   └── vessel.py
│   │   ├── database.py
│   │   └── utils/
│   │       └── constants.py
│   ├── tests/                       # Unit tests
│   ├── alembic/                     # DB migrations
│   │   ├── versions/
│   │   └── env.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── Dockerfile
│   └── alembic.ini
│
├── .github/
│   └── workflows/
│       └── ci.yml                   # GitHub Actions CI
│
├── .gitignore
└── README.md
```

---

## 📚 Tài liệu

- [Architecture](docs/ARCHITECTURE.md) - Kiến trúc hệ thống
- [API Reference](docs/API.md) - Mô tả endpoints
- [Deployment Guide](docs/DEPLOYMENT.md) - Hướng dẫn deploy
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Giải quyết vấn đề thường gặp

---

## 🔄 API Endpoints

### Generate Report
```
POST /api/generate-report
Content-Type: multipart/form-data

Body:
  files: [file1.docx, file2.docx, ...]
  quarter: 1-4
  year: 2024
  provinces: ["Quảng Ninh", "Thanh Hóa"]

Response:
  200 OK - file.zip (chứa 2 file Excel)
  400 Bad Request
  500 Internal Server Error
```

### Get Report History
```
GET /api/reports/history?skip=0&limit=10

Response:
  [
    {
      "id": 1,
      "created_at": "2024-01-15T10:30:00",
      "quarter": 1,
      "year": 2024,
      "file_count": 5,
      "provinces": ["Quảng Ninh"]
    }
  ]
```

---

## 🧪 Testing

### Backend
```bash
cd backend
pytest tests/ -v
pytest tests/ --cov=app
```

### Frontend
```bash
cd frontend
npm run lint
npm run test
```

---

## 🚀 Deployment

### Deploy Backend (Render.com)
1. Tạo account Render.com
2. Kết nối GitHub repo
3. Tạo PostgreSQL database (Neon.tech)
4. Cấu hình environment variables:
   ```
   DATABASE_URL=postgresql://...
   ALLOWED_ORIGINS=https://your-frontend.vercel.app
   ```
5. Deploy: `git push` tự động trigger deployment

### Deploy Frontend (Vercel)
1. Tạo account Vercel
2. Import GitHub repo
3. Cấu hình:
   - Root Directory: `frontend/`
   - Build Command: `npm run build`
   - Output Directory: `dist/`
4. Deploy: `git push` tự động trigger deployment

---

## 👥 Team & Phân công

| Vai trò | Số người | GitHub Role |
|---------|----------|------------|
| Tech Lead | 2-3 | Maintainer |
| Developers | 12-13 | Member |

---

## 📋 Scrum Backlog

Tổng **25 issues** trải đều 4 sprint (~2 tuần/sprint):

1. **Sprint 1** - Infrastructure & Setup
2. **Sprint 2** - Core Backend (Parser, Logic, Excel)
3. **Sprint 3** - Frontend & API
4. **Sprint 4** - Testing, Documentation & Deployment

Xem chi tiết: [Kế hoạch dự án](project_plan_fishing_vessel.html)

---

## 📝 License

MIT License - Tự do sử dụng cho dự án cá nhân và thương mại

---

## 💬 Support

Có câu hỏi? Tạo issue trên GitHub hoặc liên hệ team.

**Happy coding!** 🚀
