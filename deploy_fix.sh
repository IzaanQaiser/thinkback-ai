#!/bin/bash

# Quick deployment script for the browser installation fix

set -e

echo "🚀 Deploying browser installation fix..."

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
    --memory 2Gi \
    --cpu 2 \
    --timeout 300

echo "✅ Deployment completed!"
echo ""
echo "🧪 Testing the fix..."
echo "Try saving this tweet: https://x.com/agazdecki/status/1591439614438699009"
echo ""
echo "📊 Check logs:"
echo "gcloud logs read --project=$PROJECT_ID --service=$SERVICE_NAME --limit=50" 