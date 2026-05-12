# 🔧 Troubleshooting Guide

## 🚀 Backend Issues

### 1. Module Not Found Error

**Error:**
```
ModuleNotFoundError: No module named 'app'
```

**Solution:**
```bash
cd backend
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
uvicorn app.main:app --reload
```

### 2. Database Connection Failed

**Error:**
```
sqlalchemy.exc.OperationalError: could not connect to server
```

**Causes & Solutions:**

1. **Wrong connection string format**
   ```bash
   # Correct format:
   postgresql://username:password@host:5432/database_name
   
   # Check .env file
   cat .env
   ```

2. **Database server not running**
   ```bash
   # Check if PostgreSQL is running
   psql --version
   
   # For Neon.tech, check status on dashboard
   ```

3. **Network connectivity issue**
   ```bash
   # Test connection
   telnet host.neon.tech 5432
   ```

### 3. Port Already in Use

**Error:**
```
Address already in use
```

**Solution:**
```bash
# Find and kill process on port 8000
lsof -i :8000
kill -9 <PID>

# Or use different port
uvicorn app.main:app --reload --port 8001
```

### 4. CORS Error from Frontend

**Error:**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solution:**
Update `ALLOWED_ORIGINS` in FastAPI:
```python
# app/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://your-frontend.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 5. File Upload Fails

**Error:**
```
RequestValidationError: 1 validation error for generate_report
files (type=value_error.missing)
```

**Solution:**
```javascript
// Frontend - correct FormData usage
const formData = new FormData();
files.forEach(file => formData.append('files', file));  // NOT 'files[]'
```

### 6. Timeout During Report Generation

**Error:**
```
TimeoutError: Request timed out after 30s
```

**Solution:**
```python
# Increase timeout in FastAPI
# app/routers/report.py
from fastapi import Request

@app.post("/api/generate-report")
async def generate_report(request: Request):
    # Uvicorn timeout is 60s by default
    # For long-running tasks, use background tasks
    pass
```

---

## 🎨 Frontend Issues

### 1. Vite Cannot Find Module

**Error:**
```
[plugin:vite:resolve] Cannot find module '@/api/reportApi'
```

**Solution:**
Configure `vite.config.js`:
```javascript
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### 2. Hot Module Replacement (HMR) Not Working

**Error:**
```
[HMR] connecting...
[HMR] failed to connect
```

**Solution (for Render.com):**
```javascript
// vite.config.js
export default defineConfig({
  server: {
    hmr: {
      host: 'localhost',
      port: 5173,
    },
  },
})
```

### 3. API Request Returns 404

**Error:**
```
GET http://localhost:8000/api/generate-report 404
```

**Check:**
1. Backend is running: `curl http://localhost:8000/api/health`
2. VITE_API_URL is correct: `console.log(import.meta.env.VITE_API_URL)`
3. Endpoint exists: Check `backend/app/routers/report.py`

### 4. Download File Doesn't Work

**Error:**
```
File downloads but is empty or corrupted
```

**Solution:**
```javascript
// Correct blob download
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);  // Important!
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
```

### 5. ESLint Errors

**Error:**
```
✘ [eslint] 1 error in src/App.jsx
```

**Solution:**
```bash
cd frontend
npm run lint -- --fix
```

---

## 🐬 Database Issues

### 1. Tables Not Created

**Error:**
```
sqlalchemy.exc.ProgrammingError: relation "vessels" does not exist
```

**Solution:**
```bash
cd backend
# Run migrations manually
alembic upgrade head

# Or check migration status
alembic current
alembic history
```

### 2. Wrong Data in Database

**Solution:**
```bash
# Reset database (development only!)
alembic downgrade base
alembic upgrade head

# Or manually:
# On Neon.tech console:
DROP TABLE vessels;
DROP TABLE report_history;
# Then run migrations again
```

### 3. Slow Queries

**Solution:**
```sql
-- Add indexes
CREATE INDEX idx_province ON vessels(province_code);
CREATE INDEX idx_length_group ON vessels(length_group);
CREATE INDEX idx_created_at ON report_history(created_at);

-- Check query performance
EXPLAIN ANALYZE SELECT * FROM vessels WHERE province_code = 'QN';
```

---

## 🔐 Security Issues

### 1. Hardcoded Credentials in Code

**Error:**
```
DATABASE_URL=postgresql://root:password@localhost/db
```

**Solution:**
```bash
# Use environment variables
echo "DATABASE_URL=postgresql://..." > .env

# .env should be in .gitignore
echo ".env" >> .gitignore
```

### 2. Secret Key Exposed in Repository

**Solution:**
```bash
# Generate secret key
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Add to environment
export SECRET_KEY="generated_key_here"
```

### 3. HTTPS Not Enabled

**Solution:**
- Vercel: Automatic ✓
- Render: Automatic ✓
- Custom domain: Configure SSL certificate

---

## 📦 Dependency Issues

### 1. Python Package Conflict

**Error:**
```
ERROR: pip's dependency resolver does not currently take into account all the packages
```

**Solution:**
```bash
cd backend
pip install --upgrade pip
pip install -r requirements.txt --upgrade

# Or recreate venv
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Node Package Conflict

**Error:**
```
npm ERR! peer dep missing
```

**Solution:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### 3. Missing Optional Dependency

**Solution:**
```bash
# Install optional dependencies for development
pip install -r requirements.txt
pip install pytest pytest-cov  # for testing
```

---

## 🚢 Deployment Issues

### 1. Build Fails on Render

**Error:**
```
Build failed with exit code 1
```

**Check logs:**
1. Render dashboard → Logs
2. Look for specific error message
3. Common causes:
   - Missing `requirements.txt`
   - Python version mismatch
   - Wrong Dockerfile path

**Solution:**
```bash
# Test build locally
docker build -f backend/Dockerfile -t fishing-vessel .
docker run fishing-vessel
```

### 2. Frontend Build Size Too Large

**Error:**
```
Bundle size exceeds recommended size
```

**Solution:**
```bash
# Check bundle size
cd frontend
npm run build -- --report

# Optimize
npm install --save @vitejs/plugin-compression
# Add to vite.config.js
```

### 3. GitHub Actions CI Fails

**Solution:**
Check `.github/workflows/ci.yml`:
- Correct Python version
- Correct Node version
- All test commands pass locally first

---

## 🆘 Getting Help

1. **Check logs first**
   - Frontend: Browser console (F12)
   - Backend: Terminal output or Render logs
   - Database: Neon.tech console

2. **Search error message**
   - StackOverflow
   - GitHub Issues
   - Official documentation

3. **Create minimal reproducible example**
   - Simplify to smallest code that fails
   - Include full error traceback
   - Share on GitHub Issues

---

## 📋 Health Checks

Run these regularly to catch issues early:

```bash
# Backend health
curl https://api.onrender.com/api/health

# Database connectivity
psql -c "SELECT 1" postgresql://...

# Frontend accessible
curl https://app.vercel.app

# API response time
time curl https://api.onrender.com/api/reports/history
```

---

**Still stuck?** Create an issue on GitHub with:
1. Error message (full traceback)
2. Steps to reproduce
3. Environment (Python version, OS, etc.)
4. Expected vs actual behavior
