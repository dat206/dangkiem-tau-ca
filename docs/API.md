# 🌐 API Reference

## Base URL

- **Development**: `http://localhost:8000`
- **Production**: `https://api-name.onrender.com`

All endpoints return JSON unless specified otherwise.

---

## 📍 Endpoints

### 1. Generate Report

**POST** `/api/generate-report`

Generate report từ files DOCX.

**Request:**
```
Content-Type: multipart/form-data

Parameters:
- files[] (file): List of DOCX files
- quarter (int): 1-4
- year (int): 2024
- provinces (string): Comma-separated province names
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/generate-report \
  -F "files=@file1.docx" \
  -F "files=@file2.docx" \
  -F "quarter=1" \
  -F "year=2024" \
  -F "provinces=Quảng Ninh,Thanh Hóa"
```

**Response (200 OK):**
```
Content-Type: application/zip
Content-Disposition: attachment; filename="report_q1_2024.zip"

[Binary ZIP file containing 2 Excel files]
```

**Error Responses:**

- **400 Bad Request**
  ```json
  {
    "detail": "Invalid quarter: must be 1-4"
  }
  ```

- **422 Unprocessable Entity**
  ```json
  {
    "detail": [
      {
        "loc": ["body", "quarter"],
        "msg": "value is not a valid integer",
        "type": "type_error.integer"
      }
    ]
  }
  ```

- **500 Internal Server Error**
  ```json
  {
    "detail": "Error parsing DOCX file: page1.docx"
  }
  ```

---

### 2. Get Report History

**GET** `/api/reports/history`

Retrieve report generation history.

**Query Parameters:**
- `skip` (int, optional): Pagination offset. Default: 0
- `limit` (int, optional): Number of records. Default: 10, Max: 100

**Example:**
```bash
curl http://localhost:8000/api/reports/history?skip=0&limit=10
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "created_at": "2024-01-15T10:30:00",
    "quarter": 1,
    "year": 2024,
    "file_count": 5,
    "provinces": "Quảng Ninh,Thanh Hóa"
  },
  {
    "id": 2,
    "created_at": "2024-01-16T14:20:00",
    "quarter": 1,
    "year": 2024,
    "file_count": 3,
    "provinces": "Ninh Bình"
  }
]
```

**Error Responses:**

- **400 Bad Request**
  ```json
  {
    "detail": "limit must be <= 100"
  }
  ```

---

### 3. Health Check

**GET** `/api/health`

Check if backend is running.

**Example:**
```bash
curl http://localhost:8000/api/health
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "message": "Backend is running"
}
```

---

### 4. Extension Lookup By Registration Number

**GET** `/api/extension/vessels/{registrationNumber}`

Tra cứu dữ liệu tàu cho Chrome Extension theo số đăng ký.

**Headers:**
```
Authorization: Bearer <EXTENSION_API_TOKEN>
```

**Example:**
```bash
curl -H "Authorization: Bearer your-token" \
  http://localhost:8000/api/extension/vessels/QN-90599-TS
```

**Response (200 OK):**
```json
{
  "registration_number": "QN-90599-TS",
  "owner_name": "Nguyen Van A",
  "address": "Ha Long, Quang Ninh",
  "phone_number": "",
  "dossier_content": "",
  "province_code": "QN",
  "province_name": "Quang Ninh",
  "lmax": 18.5,
  "power_kw": 45.0,
  "material": "Thep",
  "inspection_type": "Hang nam",
  "length_group": "15-20m",
  "valid_until": "2025-01-15",
  "issued_date": "2024-01-15",
  "fishing_gear": "Luoi re"
}
```

**Error Responses:**

- **401 Unauthorized**
  ```json
  {
    "detail": "Thiếu Bearer token."
  }
  ```

- **403 Forbidden**
  ```json
  {
    "detail": "Bearer token không hợp lệ."
  }
  ```

- **404 Not Found**
  ```json
  {
    "detail": "Không tìm thấy dữ liệu tàu theo số đăng ký."
  }
  ```

---

## 📊 Response Models

### VesselData

```json
{
  "registration_number": "QN-90599-TS",
  "owner_name": "Nguyễn Văn A",
  "address": "Xã Cái Lân, Hạ Long, Quảng Ninh",
  "province_code": "QN",
  "province_name": "Quảng Ninh",
  "lmax": 18.5,
  "power_kw": 45.0,
  "material": "Thép",
  "inspection_type": "Hàng năm",
  "length_group": "15-20m",
  "valid_until": "2025-01-15",
  "issued_date": "2024-01-15",
  "fishing_gear": "Lưới rê"
}
```

### ReportHistoryItem

```json
{
  "id": 1,
  "created_at": "2024-01-15T10:30:00Z",
  "quarter": 1,
  "year": 2024,
  "file_count": 5,
  "provinces": "Quảng Ninh,Thanh Hóa"
}
```

---

## 🔑 Enums

### MaterialEnum
- `Gỗ`
- `Thép`
- `FRP`

### InspectionTypeEnum
- `Hàng năm`
- `Định kỳ`
- `Trên đà`
- `Giám sát`
- `Cải hoán`

### LengthGroupEnum
- `12-15m`
- `15-20m`
- `20-24m`
- `24-30m`
- `≥30m`

---

## 🔒 Authentication

Currently **no authentication** required (for MVP). 

For production, consider:
- API Key
- OAuth2 (JWT)
- API Rate Limiting

---

## 📈 Rate Limiting

Not implemented in MVP. Consider for production:
- 100 requests/minute per IP
- 10 file upload requests/minute

---

## 📝 Logging

All errors are logged to stdout:
```
2024-01-15 10:30:00 - ERROR - Failed to parse DOCX: file1.docx - [error details]
```

---

## 🚀 Swagger/OpenAPI

Auto-generated API docs available at:
- **Development**: `http://localhost:8000/docs`
- **Production**: `https://api-name.onrender.com/docs`

---

## Example: Frontend Usage

```javascript
import { generateReport, downloadBlob } from '@/api/reportApi';

// Generate report
const config = {
  quarter: 1,
  year: 2024,
  provinces: ['Quảng Ninh', 'Thanh Hóa']
};

const files = [docxFile1, docxFile2];

try {
  const zipBlob = await generateReport(files, config);
  downloadBlob(zipBlob, 'report_q1_2024.zip');
} catch (error) {
  console.error('Error:', error.message);
}
```

---

**See also**: [DEPLOYMENT.md](DEPLOYMENT.md) for production setup.
