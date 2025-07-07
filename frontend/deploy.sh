#!/bin/bash

# Deploy script for Thinkback.ai Python Backend to Firebase App Hosting

echo "🚀 Deploying Thinkback.ai to Firebase App Hosting..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Please run: firebase login"
    exit 1
fi

# Build the frontend
echo "📦 Building frontend..."
cd frontend
npm run build
cd ..

# Deploy to Firebase App Hosting
echo "🌐 Deploying to Firebase App Hosting..."
firebase deploy --only hosting

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set environment variables in Firebase Console:"
echo "   - OPENAI_API_KEY"
echo "2. Add Firebase service account to infrastructure/credentials/service-account.json"
echo "3. Deploy backend: firebase deploy --only functions"
echo ""
echo "🔗 Your app should be available at: https://your-project-id.web.app"
