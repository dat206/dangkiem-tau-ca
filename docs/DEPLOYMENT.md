# 🚀 Deployment Guide

## Prerequisites

- GitHub repository (public or private)
- Neon.tech account (PostgreSQL database)
- Render.com account
- Vercel account

---

## 1️⃣ Backend Deployment (Render.com)

### Step 1: Create PostgreSQL Database (Neon.tech)

1. Go to [neon.tech](https://neon.tech)
2. Sign up (FREE - no credit card required)
3. Create project
4. Create database
5. Copy connection string:
   ```
   postgresql://user:password@host.neon.tech/database
   ```

### Step 2: Create Render Web Service

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Select your GitHub repository
5. Configure:
   - **Name**: `fishing-vessel-api`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `backend/Dockerfile`
   - **Build Command**: (leave empty - Dockerfile handles it)
   - **Start Command**: (leave empty)

### Step 3: Set Environment Variables

In Render dashboard → Environment tab, add:

```
DATABASE_URL=postgresql://user:password@host.neon.tech/database
ALLOWED_ORIGINS=https://your-frontend.vercel.app,http://localhost:5173
SECRET_KEY=your-secret-key-here
PYTHONUNBUFFERED=1
```

### Step 4: Deploy

1. Click "Create Web Service"
2. Render will automatically build and deploy
3. Wait for deployment (2-5 minutes)
4. Check URL: `https://fishing-vessel-api.onrender.com`

### Step 5: Verify

```bash
curl https://fishing-vessel-api.onrender.com/api/health
# Should return: {"status": "ok", "message": "Backend is running"}
```

---

## 2️⃣ Frontend Deployment (Vercel)

### Step 1: Create Vercel Project

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "Add New..." → "Project"
4. Select your repository

### Step 2: Configure Project

1. **Root Directory**: `frontend`
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`

### Step 3: Set Environment Variables

Add in Vercel dashboard:

```
VITE_API_URL=https://fishing-vessel-api.onrender.com
```

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build (2-3 minutes)
3. Your app is live at: `https://your-project.vercel.app`

### Step 5: Custom Domain (Optional)

1. In Vercel dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS records according to Vercel instructions

---

## 3️⃣ Database Setup

### Run Migrations

Automatically runs on first deployment via `alembic upgrade head` in Docker.

If needed manually:

```bash
# SSH into Render container
cd backend
alembic upgrade head
```

### Check Database

Using Neon.tech console:

1. Go to Neon dashboard
2. Select your database
3. Click "SQL Editor"
4. Run:
   ```sql
   SELECT * FROM vessels;
   SELECT * FROM report_history;
   ```

---

## 4️⃣ Monitoring & Troubleshooting

### Backend Logs (Render)

1. Render dashboard → Select web service
2. "Logs" tab - real-time logs
3. Check for errors

### Common Issues

**Issue: Database connection failed**
```
ERROR: could not connect to server: Connection refused
```

**Solution**: Check DATABASE_URL environment variable matches Neon connection string.

**Issue: CORS error in frontend**
```
Access to XMLHttpRequest from origin 'https://app.vercel.app' 
has been blocked by CORS policy
```

**Solution**: Update `ALLOWED_ORIGINS` in Render environment to include frontend URL.

**Issue: Build fails on Render**
```
ERROR: pip install -r requirements.txt failed
```

**Solution**: Ensure `requirements.txt` is in `backend/` directory and all packages are compatible.

---

## 5️⃣ CI/CD Pipeline (GitHub Actions)

### Auto Deploy on Push

File: `.github/workflows/ci.yml`

```yaml
name: CI/CD

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - 'frontend/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Test Backend
        run: |
          cd backend
          pip install -r requirements.txt
          pytest
      - name: Test Frontend
        run: |
          cd frontend
          npm install
          npm run lint

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy via Render API
        run: |
          curl -X POST https://api.render.com/deploy/srv-xxxxxx \
            -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}"
```

---

## 6️⃣ Backup & Recovery

### Database Backup

Neon.tech automatically backs up data daily.

To export:
```bash
# SSH into backend or local
pg_dump postgresql://user:pass@host/db > backup.sql
```

### Restore

```bash
psql postgresql://user:pass@host/db < backup.sql
```

---

## 7️⃣ Performance Optimization

### Frontend (Vercel)

- Enable Vercel Analytics
- Use Image Optimization
- Enable Edge Caching

### Backend (Render)

- Monitor CPU/Memory usage
- Upgrade to higher tier if needed
- Consider Redis caching for frequently accessed data

### Database (Neon.tech)

- Add indexes on frequently queried columns
- Monitor connection pool
- Archive old report_history records regularly

---

## 8️⃣ Security Checklist

- [ ] Database credentials NOT in code
- [ ] HTTPS enabled (automatic on Vercel/Render)
- [ ] CORS configured correctly
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (SQLAlchemy ORM used)
- [ ] File upload size limits set
- [ ] Secrets stored in environment variables only
- [ ] Consider rate limiting for production

---

## 🔄 Updating Deployment

### Update Backend

```bash
git push origin main
# Render auto-detects and redeploys
```

### Update Database Schema

```bash
# Create migration
cd backend
alembic revision --autogenerate -m "Add new column"

# Commit and push
git add alembic/versions/
git push origin main
# Migration runs automatically on next deploy
```

### Update Frontend

```bash
git push origin main
# Vercel auto-detects and redeploys
```

---

## 📞 Support

- **Render Support**: support@render.com
- **Vercel Support**: support@vercel.com
- **Neon Support**: https://neon.tech/support

---

**Next**: See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues.
