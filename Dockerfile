# Use the official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

# Set working directory
WORKDIR /workspace

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        curl \
        wget \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire project (including backend folder)
COPY . .

# Add backend to Python path for module imports
ENV PYTHONPATH=/workspace/backend

# Create directory for credentials (if not already present)
RUN mkdir -p /workspace/infrastructure/credentials

# NOTE: youtube-cookies.txt must be present at backend/credentials/youtube-cookies.txt at build time.
# It is recommended to inject this file via CI/CD secrets (see GitHub Actions workflow).

# Expose the port
EXPOSE 8080

# Start the FastAPI app using uvicorn
CMD uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8080}
