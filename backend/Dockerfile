FROM python:3.11-slim

# Install system dependencies (including 7-Zip for RAR/ZIP extraction on Linux)
RUN apt-get update && apt-get install -y --no-install-recommends \
    7zip \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install (relative to repo root context on Render)
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend source files (relative to repo root context on Render)
COPY backend/ .

# Expose port
EXPOSE 8000

# Run uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
