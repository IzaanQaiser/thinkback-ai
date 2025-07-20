# Twitter Scraper Root Cause Fix

## The Real Problem

The Twitter scraper was failing because **Playwright browsers were not properly installed in the Docker container**. The error in the logs was:

```
BrowserType.launch: Executable doesn't exist at /root/.cache/ms-playwright/chromium_headless_shell-1179/chrome-linux/headless_shell
```

This means the Docker build was not installing the browsers correctly, causing the scraper to fail and fall back to generic data.

## Root Cause Fix

### 1. Fixed Dockerfile
The Dockerfile now properly installs Playwright browsers:

```dockerfile
# Install Playwright browsers - ENSURING THEY ARE INSTALLED
RUN playwright install chromium
RUN playwright install-deps chromium

# Verify browsers are installed
RUN playwright install --dry-run chromium

# Test browser installation
RUN python backend/test_browser_installation.py
```

### 2. Simplified Playwright Function
Removed the complex fallback logic and focused on making the primary method work:

```python
async def scrape_with_playwright(url: str) -> Optional[Dict]:
    """Scrape tweet using Playwright headless browser."""
    try:
        async with async_playwright() as p:
            # Use chromium with container-optimized arguments
            browser = await p.chromium.launch(
                headless=True,
                args=[
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor'
                ]
            )
```

### 3. Added Browser Installation Test
Created `backend/test_browser_installation.py` to verify browsers are properly installed during build.

## How to Deploy the Fix

### Option 1: Use the Test Script
```bash
chmod +x deploy_and_test.sh
./deploy_and_test.sh
```

This script will:
1. Build the Docker image
2. Test browser installation locally
3. Deploy to Cloud Run
4. Test the Twitter scraper with a real tweet

### Option 2: Manual Deployment
```bash
# Build and test locally
docker build -t gcr.io/ninth-arena-461723-g1/thinkback-backend-staging .
docker run --rm gcr.io/ninth-arena-461723-g1/thinkback-backend-staging python backend/test_browser_installation.py

# Deploy
docker push gcr.io/ninth-arena-461723-g1/thinkback-backend-staging
gcloud run deploy thinkback-backend-staging --image gcr.io/ninth-arena-461723-g1/thinkback-backend-staging --region us-central1 --project ninth-arena-461723-g1
```

## Expected Results

After this fix, the Twitter scraper should:

1. **Actually scrape the tweet content** instead of failing
2. **Get the real tweet text** as the title
3. **Extract media** if present
4. **Show meaningful data** instead of "Twitter/X Post"

## Verification

To verify the fix worked:

1. **Check the logs** after deployment:
   ```bash
   gcloud logs read --project=ninth-arena-461723-g1 --service=thinkback-backend-staging --limit=50
   ```

2. **Test with a real tweet**:
   - Try saving: `https://x.com/agazdecki/status/1591439614438699009`
   - You should see the actual tweet content, not "Twitter/X Post"

3. **Look for these success indicators**:
   - "✅ Browser launched successfully" in logs
   - "✅ Playwright scraping successful" in logs
   - Real tweet text in the saved content

## Key Changes Made

1. **Dockerfile**: Ensured browsers are properly installed
2. **Playwright Function**: Simplified and made more reliable
3. **Test Scripts**: Added verification that browsers work
4. **Deployment Script**: Added testing during deployment

The fix addresses the root cause: **browser installation failure**, not just the symptoms. 