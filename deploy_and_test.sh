#!/bin/bash

# ThinkBack AI Deployment and Test Script
# This script deploys the application and tests the Twitter scraper

set -e  # Exit on any error

echo "🚀 Starting ThinkBack AI deployment and test..."

# Check if we're in the right directory
if [ ! -f "Dockerfile" ]; then
    echo "❌ Error: Dockerfile not found. Please run this script from the project root."
    exit 1
fi

# Set environment variables
PROJECT_ID="ninth-arena-461723-g1"
SERVICE_NAME="thinkback-backend-staging"
REGION="us-central1"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "📋 Deployment Configuration:"
echo "   Project ID: $PROJECT_ID"
echo "   Service Name: $SERVICE_NAME"
echo "   Region: $REGION"
echo "   Image: $IMAGE_NAME"

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -t $IMAGE_NAME .

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed!"
    exit 1
fi

echo "✅ Docker image built successfully"

# Test the browser installation locally
echo "🧪 Testing browser installation locally..."
docker run --rm $IMAGE_NAME python backend/test_browser_installation.py

if [ $? -ne 0 ]; then
    echo "❌ Browser installation test failed!"
    exit 1
fi

echo "✅ Browser installation test passed"

# Push the image to Google Container Registry
echo "📤 Pushing image to Google Container Registry..."
docker push $IMAGE_NAME

if [ $? -ne 0 ]; then
    echo "❌ Docker push failed!"
    exit 1
fi

echo "✅ Image pushed successfully"

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --project $PROJECT_ID \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 2 \
    --timeout 300 \
    --concurrency 80 \
    --max-instances 10

if [ $? -ne 0 ]; then
    echo "❌ Cloud Run deployment failed!"
    exit 1
fi

echo "✅ Deployment completed successfully!"

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID --format="value(status.url)")

echo "🌐 Service URL: $SERVICE_URL"

# Wait for deployment to be ready
echo "⏳ Waiting for deployment to be ready..."
sleep 30

# Test the deployment
echo "🧪 Testing deployment..."
curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/health" || echo "000"

# Test the Twitter scraper with a real tweet
echo "🧪 Testing Twitter scraper..."
TEST_URL="https://x.com/agazdecki/status/1591439614438699009"

# Make a test request to the enrich-entry endpoint
echo "📡 Testing Twitter scraper with real tweet..."
curl -X POST "$SERVICE_URL/enrich-entry" \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"$TEST_URL\", \"user_notes\": \"\"}" \
    -w "\nHTTP Status: %{http_code}\n" \
    --max-time 60

echo ""
echo "🎉 Deployment and test completed!"
echo ""
echo "📝 Next steps:"
echo "   1. Check the logs for any errors:"
echo "      gcloud logs read --project=$PROJECT_ID --service=$SERVICE_NAME --limit=50"
echo ""
echo "   2. Test with the web interface:"
echo "      Try saving the tweet: $TEST_URL"
echo ""
echo "   3. Monitor for any remaining issues" 