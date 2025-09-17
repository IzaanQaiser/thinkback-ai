#!/bin/bash

# ThinkBack AI Deployment Script
# This script deploys the application to Google Cloud Run

set -e  # Exit on any error

echo "🚀 Starting ThinkBack AI deployment..."

# Check if we're in the right directory
if [ ! -f "Dockerfile" ]; then
    echo "❌ Error: Dockerfile not found. Please run this script from the deployment directory."
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

# Test the deployment
echo "🧪 Testing deployment..."
curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/health" || echo "000"

echo "🎉 Deployment completed! The service should be available at:"
echo "   $SERVICE_URL"

echo ""
echo "📝 Next steps:"
echo "   1. Test the Twitter/X scraper with a real tweet URL"
echo "   2. Check the logs for any Playwright installation issues"
echo "   3. Verify that the fallback data is more meaningful"
echo ""
echo "🔍 To check logs:"
echo "   gcloud logs read --project=$PROJECT_ID --service=$SERVICE_NAME --limit=50"
