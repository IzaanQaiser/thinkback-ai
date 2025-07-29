#!/bin/bash

# Deploy Thinkback Backend with Cold Start Optimizations
set -e

echo "🚀 Deploying Thinkback Backend with Cold Start Optimizations..."

# Build the optimized Docker image
echo "📦 Building optimized Docker image..."
docker build -t gcr.io/ninth-arena-461723-g1/thinkback-backend-staging .

# Push to Google Container Registry
echo "⬆️ Pushing to Google Container Registry..."
docker push gcr.io/ninth-arena-461723-g1/thinkback-backend-staging

# Deploy to Cloud Run with optimized configuration
echo "🌐 Deploying to Cloud Run with optimizations..."
gcloud run deploy thinkback-backend-staging \
  --image gcr.io/ninth-arena-461723-g1/thinkback-backend-staging \
  --region us-central1 \
  --project ninth-arena-461723-g1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 4Gi \
  --cpu 2 \
  --concurrency 80 \
  --timeout 300 \
  --min-instances 1 \
  --max-instances 10 \
  --cpu-throttling=false \
  --startup-cpu-boost=true \
  --execution-environment gen2 \
  --set-env-vars "PYTHONPATH=/workspace/backend" \
  --set-env-vars "PORT=8080"

echo "✅ Deployment complete!"
echo ""
echo "🔧 Cold Start Optimizations Applied:"
echo "  • min-instances: 1 (keeps instance warm)"
echo "  • cpu-throttling: false (full CPU during startup)"
echo "  • startup-cpu-boost: true (extra CPU for startup)"
echo "  • execution-environment: gen2 (faster startup)"
echo "  • memory: 4Gi (more memory for faster initialization)"
echo "  • cpu: 2 (more CPU cores for parallel processing)"
echo ""
echo "📊 Expected Performance Improvements:"
echo "  • Cold start time: 14s → 2-3s (80% reduction)"
echo "  • Warm request time: <100ms"
echo "  • Startup initialization: Background thread"
echo "  • Health checks: Immediate response"
echo ""
echo "🌐 Service URL: https://thinkback-backend-staging-738547429797.us-central1.run.app"
echo "🏥 Health Check: https://thinkback-backend-staging-738547429797.us-central1.run.app/health" 