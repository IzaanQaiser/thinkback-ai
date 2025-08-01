#!/bin/bash

# Deploy script for Cloudflare Pages with cache purging

echo "🚀 Starting deployment..."

# Build the project
echo "📦 Building project..."
npm run build

# Deploy to Cloudflare Pages
echo "🌐 Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist --project-name=thinkback-ai-testing

# Optional: Purge Cloudflare cache (requires API token)
# Uncomment and configure if you have Cloudflare API access
# echo "🧹 Purging Cloudflare cache..."
# curl -X POST "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/purge_cache" \
#      -H "Authorization: Bearer YOUR_API_TOKEN" \
#      -H "Content-Type: application/json" \
#      --data '{"purge_everything":true}'

echo "✅ Deployment complete!"
echo "💡 If you still see cached content, try:"
echo "   - Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)"
echo "   - Clear browser cache"
echo "   - Wait 1-2 minutes for cache to propagate" 