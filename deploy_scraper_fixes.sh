#!/bin/bash

# Deployment script to test scraper fixes

set -e

echo "🚀 Deploying Scraper Fixes..."

PROJECT_ID="ninth-arena-461723-g1"
SERVICE_NAME="thinkback-backend-staging"
REGION="us-central1"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "📋 Building and deploying..."

# Build the image
docker build -t $IMAGE_NAME .

# Push the image
docker push $IMAGE_NAME

# Deploy to Cloud Run
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --project $PROJECT_ID \
    --allow-unauthenticated \
    --memory 4Gi \
    --cpu 2 \
    --timeout 300 \
    --max-instances 5

echo "✅ Deployment completed!"
echo ""
echo "🔧 Fixes applied:"
echo "   - Playwright: Fixed browser installation and permissions"
echo "   - LinkedIn: Added graceful 404 handling and better fallbacks"
echo "   - Environment: Set PLAYWRIGHT_BROWSERS_PATH correctly"
echo ""
echo "🧪 Test the scrapers:"
echo "1. Instagram: https://www.instagram.com/p/C8QZQZQZQZQ/"
echo "2. Twitter: https://x.com/agazdecki/status/1591439614438699009"
echo "3. YouTube: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
echo "4. LinkedIn: https://www.linkedin.com/posts/activity-1234567890123456789"
echo "5. Reddit: https://www.reddit.com/r/Python/comments/1234567/example_post/"
echo "6. TikTok: https://www.tiktok.com/@username/video/1234567890123456789"
echo ""
echo "📊 Check logs:"
echo "gcloud logs read --project=$PROJECT_ID --service=$SERVICE_NAME --limit=50"
echo ""
echo "🔍 Run local tests:"
echo "python backend/test_all_scrapers.py" 