#!/bin/bash

# Frontend deployment script to fix JavaScript loading issues

set -e

echo "🚀 Deploying Frontend JavaScript Fix..."

cd frontend

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building frontend..."
npm run build

echo "📋 Checking build output..."
ls -la dist/
ls -la dist/assets/

echo "✅ Build completed successfully!"
echo ""
echo "🔧 Fixes applied:"
echo "   - Updated Vite config for proper asset handling"
echo "   - Fixed _redirects for Cloudflare Pages"
echo "   - Updated _headers for proper content types"
echo "   - Ensured assets are served from /assets/ directory"
echo ""
echo "📤 Deploy to Cloudflare Pages:"
echo "1. Go to your Cloudflare Pages dashboard"
echo "2. Trigger a new deployment"
echo "3. Or push to your connected Git repository"
echo ""
echo "🧪 Test the fix:"
echo "1. Clear browser cache completely"
echo "2. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)"
echo "3. Check browser console for JavaScript errors"
echo ""
echo "🔍 If issues persist:"
echo "1. Check Network tab in DevTools"
echo "2. Verify assets are loading from /assets/ URLs"
echo "3. Check if Cloudflare Pages is serving correct content types" 