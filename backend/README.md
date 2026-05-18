# Backend Setup

FastAPI backend for the fishing vessel report system.

## Requirements

- Python 3.11 or 3.12
- PostgreSQL connection string from Neon or another PostgreSQL provider

## Local Setup

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Update `DATABASE_URL` in `.env` with your PostgreSQL connection string.

## Run Migrations

```bash
alembic upgrade head
```

## Start Server

```bash
uvicorn app.main:app --reload
```

The API runs at `http://localhost:8000`.

Health check:

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{"status":"ok"}
```
