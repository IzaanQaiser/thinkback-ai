#!/usr/bin/env python3
"""
Comprehensive scraper test script
Tests all scrapers to ensure they're working after the cold start optimizations
"""

import requests
import json
import time
from typing import Dict, Any

# Test URLs for different platforms
TEST_URLS = {
    "youtube": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "instagram": "https://www.instagram.com/p/C8QZQZQZQZQ/",
    "twitter": "https://twitter.com/elonmusk/status/1234567890123456789",
    "linkedin": "https://www.linkedin.com/posts/activity-1234567890123456789",
    "reddit": "https://www.reddit.com/r/Python/comments/1234567/test_post/",
    "tiktok": "https://www.tiktok.com/@user/video/1234567890123456789"
}

# API endpoint
API_BASE = "https://thinkback-backend-staging-738547429797.us-central1.run.app"

def test_health_endpoint() -> bool:
    """Test the health endpoint"""
    print("🏥 Testing health endpoint...")
    try:
        response = requests.get(f"{API_BASE}/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_scrape_endpoint(url: str, platform: str) -> Dict[str, Any]:
    """Test the scrape endpoint for a specific URL"""
    print(f"\n🔍 Testing {platform} scraper with URL: {url}")
    
    try:
        response = requests.post(
            f"{API_BASE}/api/scrape",
            json={"url": url},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {platform} scraper succeeded")
            print(f"   Title: {data.get('title', 'None')}")
            print(f"   Description length: {len(data.get('description', ''))} chars")
            print(f"   Platform: {data.get('platform', 'None')}")
            print(f"   Thumbnail: {'Yes' if data.get('thumbnail') else 'No'}")
            return {"success": True, "data": data}
        else:
            print(f"❌ {platform} scraper failed: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error: {error_data}")
            except:
                print(f"   Error: {response.text}")
            return {"success": False, "error": response.text}
            
    except Exception as e:
        print(f"❌ {platform} scraper error: {e}")
        return {"success": False, "error": str(e)}

def test_entries_endpoint() -> bool:
    """Test the entries endpoint"""
    print("\n📝 Testing entries endpoint...")
    try:
        response = requests.get(f"{API_BASE}/api/entries", timeout=10)
        if response.status_code == 401:  # Expected without auth
            print("✅ Entries endpoint working (requires auth)")
            return True
        else:
            print(f"❌ Unexpected response: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Entries endpoint error: {e}")
        return False

def test_categories_endpoint() -> bool:
    """Test the categories endpoint"""
    print("\n📂 Testing categories endpoint...")
    try:
        response = requests.get(f"{API_BASE}/api/categories", timeout=10)
        if response.status_code == 401:  # Expected without auth
            print("✅ Categories endpoint working (requires auth)")
            return True
        else:
            print(f"❌ Unexpected response: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Categories endpoint error: {e}")
        return False

def main():
    """Run comprehensive scraper tests"""
    print("🚀 Starting comprehensive scraper tests...")
    print("=" * 60)
    
    # Test health endpoint first
    if not test_health_endpoint():
        print("❌ Health check failed, stopping tests")
        return
    
    # Test basic endpoints
    test_entries_endpoint()
    test_categories_endpoint()
    
    # Test scrapers
    results = {}
    for platform, url in TEST_URLS.items():
        results[platform] = test_scrape_endpoint(url, platform)
        time.sleep(2)  # Rate limiting
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 60)
    
    successful_scrapers = 0
    total_scrapers = len(results)
    
    for platform, result in results.items():
        status = "✅ PASS" if result["success"] else "❌ FAIL"
        print(f"{platform.upper():12} {status}")
        if result["success"]:
            successful_scrapers += 1
        else:
            print(f"            Error: {result.get('error', 'Unknown error')}")
    
    print(f"\nOverall: {successful_scrapers}/{total_scrapers} scrapers working")
    
    if successful_scrapers == total_scrapers:
        print("🎉 All scrapers are working correctly!")
    else:
        print("⚠️ Some scrapers need attention")
        print("\n🔧 Troubleshooting tips:")
        print("1. Check Playwright browser installation")
        print("2. Verify scraper configurations")
        print("3. Check for rate limiting")
        print("4. Review scraper logs")

if __name__ == "__main__":
    main() 