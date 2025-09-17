# Use the official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8080
ENV PYTHONPATH=/workspace/backend

# Set working directory
WORKDIR /workspace

# Install system dependencies including those needed for Playwright
# Optimize by combining RUN commands and cleaning up in the same layer
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        curl \
        wget \
        # Playwright dependencies
        libnss3 \
        libnspr4 \
        libatk-bridge2.0-0 \
        libdrm2 \
        libxkbcommon0 \
        libxcomposite1 \
        libxdamage1 \
        libxfixes3 \
        libxrandr2 \
        libgbm1 \
        libpango-1.0-0 \
        libcairo2 \
        libasound2 \
        libatspi2.0-0 \
        libgtk-3-0 \
        libgdk-pixbuf-xlib-2.0-0 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies with optimizations
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Install Playwright browsers and dependencies as root
RUN playwright install chromium \
    && playwright install-deps chromium

# Verify browsers are installed and executable
RUN playwright install --dry-run chromium \
    && ls -la /root/.cache/ms-playwright/

# Create a non-root user for better security
RUN useradd --create-home --shell /bin/bash app

# Copy the entire project (including backend folder)
COPY --chown=app:app . .

# Create directory for credentials (if not already present)
RUN mkdir -p /workspace/infrastructure/credentials \
    && chown -R app:app /workspace

# Copy Playwright browsers to app user's home directory with proper permissions
RUN mkdir -p /home/app/.cache \
    && cp -r /root/.cache/ms-playwright /home/app/.cache/ \
    && chown -R app:app /home/app/.cache/ms-playwright \
    && chmod -R 755 /home/app/.cache/ms-playwright

# Set environment variable to ensure Playwright uses the correct path
ENV PLAYWRIGHT_BROWSERS_PATH=/home/app/.cache/ms-playwright

# Switch to non-root user
USER app

# Pre-compile Python bytecode for faster startup
RUN python -m compileall /workspace/backend

# Expose the port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8080}/health || exit 1

# Start the FastAPI app using uvicorn with optimizations
CMD uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8080} --workers 1 --loop uvloop --http httptools
