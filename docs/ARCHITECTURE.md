# 🏗️ Architecture - Kiến trúc hệ thống

## Tổng quan

Hệ thống theo kiến trúc **3-tier (Client-Server-Database)**:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
│                     Vercel (Production)                      │
│                                                              │
│  Components:                                                 │
│  - FileUpload (Drag & drop DOCX)                            │
│  - ReportConfig (Chọn quý, năm, tỉnh)                       │
│  - ProcessingPanel (Loading, success, error states)         │
│  - HistoryPage (Lịch sử báo cáo)                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                    API (HTTP/REST)
                         │
┌────────────────────────▼────────────────────────────────────┐
│                 Backend (FastAPI + Python)                  │
│                 Render.com (Production)                     │
│                                                              │
│  Routers:                                                    │
│  - POST /api/generate-report                                │
│  - GET /api/reports/history                                 │
│  - GET /api/health                                          │
│                                                              │
│  Services:                                                   │
│  - docx_parser.py: Parse DOCX → VesselData                  │
│  - data_processor.py: Xử lý & tổng hợp                      │
│  - excel_generator.py: Tạo file .xlsx                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                   PostgreSQL
                         │
┌────────────────────────▼────────────────────────────────────┐
│              Database (PostgreSQL + Neon.tech)              │
│                                                              │
│  Tables:                                                     │
│  - vessels (lưu thông tin tàu)                              │
│  - report_history (lịch sử xuất báo cáo)                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1️⃣ Upload & Parse

```
User Browser
    ↓
    └─→ [FileUpload Component] 
         ↓ (FormData: files + config)
         └─→ [API: POST /api/generate-report]
              ↓
              └─→ [Backend: FastAPI]
                   ↓ (Multipart form-data)
                   └─→ [Services: docx_parser.py]
                        ↓ (python-docx)
                        └─→ Parse DOCX → VesselData
                             ↓
                             └─→ Validate data
```

### 2️⃣ Process & Aggregate

```
VesselData (list)
    ↓
    └─→ [Services: data_processor.py]
         ↓
         ├─→ classify_length_group(lmax)
         ├─→ extract_province(registration_number)
         └─→ aggregate_vessels(by province, by length, by material)
              ↓
              └─→ Aggregated Report Data (dict)
```

### 3️⃣ Generate & Download

```
Aggregated Data
    ↓
    └─→ [Services: excel_generator.py]
         ↓ (openpyxl)
         ├─→ Generate Summary Sheet (TỔNG_HỢP_GHI_SỔ)
         ├─→ Generate Quarterly Report (BÁO_CÁO_QUÝ)
         └─→ Create ZIP (2 files)
              ↓
              └─→ [API Response: Blob]
                   ↓
                   └─→ [Frontend: Download ZIP]
```

### 4️⃣ Save & History

```
Report Generated
    ↓
    └─→ [Database: report_history]
         ├─→ created_at (timestamp)
         ├─→ quarter, year
         ├─→ file_count
         ├─→ provinces
         ├─→ file_path (S3 hoặc local)
         └─→ status (success/error)
```

---

## Component Structure

### Frontend: React Components

```
App.jsx
├── FileUpload.jsx
│   └── Drag & drop, file validation
├── ReportConfig.jsx
│   └── Form (quarter, year, provinces)
├── ProcessingPanel.jsx
│   ├── Loading state
│   ├── Success state (download buttons)
│   └── Error state
└── HistoryPage.jsx
    ├── Table (created_at, quarter, year, action)
    └── Pagination
```

### Backend: Python Services

```
app/
├── main.py (FastAPI app)
├── routers/
│   └── report.py (API endpoints)
├── services/
│   ├── docx_parser.py (Parse DOCX)
│   ├── data_processor.py (Process data)
│   └── excel_generator.py (Create Excel)
├── models/
│   └── vessel.py (Pydantic + SQLAlchemy)
├── database.py (SQLAlchemy config)
└── utils/
    └── constants.py (Province, material, etc.)
```

---

## Database Schema

### Bảng: vessels

```sql
CREATE TABLE vessels (
    id SERIAL PRIMARY KEY,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    owner_name VARCHAR(255),
    address VARCHAR(255),
    province_code VARCHAR(10),
    province_name VARCHAR(100),
    lmax FLOAT,
    power_kw FLOAT,
    material VARCHAR(20),
    inspection_type VARCHAR(50),
    length_group VARCHAR(20),
    valid_until VARCHAR(10),
    issued_date VARCHAR(10),
    fishing_gear VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_province ON vessels(province_code);
CREATE INDEX idx_length_group ON vessels(length_group);
```

### Bảng: report_history

```sql
CREATE TABLE report_history (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT NOW(),
    quarter INT,
    year INT,
    file_count INT,
    provinces VARCHAR(500),
    file_path VARCHAR(500),
    status VARCHAR(20),
    error_message TEXT
);

CREATE INDEX idx_created_at ON report_history(created_at);
```

---

## Error Handling

### Frontend

- **Network Error**: Show message + Retry button
- **File Error**: Show which files failed + Details
- **Server Error**: Show error message from API

### Backend

- **Parse Error**: Log + Return 400 with error details
- **Database Error**: Log + Return 500
- **Partial Success**: Return 207 + Status for each file

---

## Performance Considerations

1. **Async Processing**
   - Parse files in parallel (asyncio / ThreadPoolExecutor)
   - Not blocking the main thread

2. **Caching**
   - Cache province mappings
   - Cache Excel styles

3. **Database**
   - Index on province_code, length_group
   - Connection pooling (SQLAlchemy)

4. **Frontend**
   - Code splitting (React.lazy)
   - Image optimization

---

## Security

- ✅ **CORS**: Only allow frontend origin
- ✅ **Input Validation**: Validate file format, size
- ✅ **SQL Injection**: Use SQLAlchemy ORM (parameterized queries)
- ✅ **File Upload**: Store in secure temp directory, validate MIME type
- ✅ **Environment Variables**: DATABASE_URL, SECRET_KEY never hardcoded

---

## Deployment Architecture

### Development (Local)

```
Frontend: http://localhost:5173
Backend:  http://localhost:8000
Database: localhost:5432 (local PostgreSQL)
```

### Production (Cloud)

```
Frontend: https://app-name.vercel.app (Vercel)
Backend:  https://api-name.onrender.com (Render)
Database: postgresql://neon.tech (Neon.tech)
```

---

**Next**: See [API.md](API.md) for endpoint specifications.
