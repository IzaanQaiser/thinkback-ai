#!/usr/bin/env python3
"""
Test script for LinkedIn scraper functionality.
Tests the LinkedIn scraper with a real LinkedIn post URL.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scrapers.linkedin import LinkedInScraper
from scraper_factory import get_scraper


def detect_platform(url: str) -> str:
    """Detect platform from URL."""
    url = url.lower()
    if (
        "youtube.com/shorts/" in url
        or "youtu.be/" in url
        and "?feature=share" in url
    ):
        return "YouTube Shorts"
    if "youtube.com/watch?v=" in url or "youtu.be/" in url:
        return "YouTube Video"
    if "/reels/" in url or "/reel/" in url:
        return "Instagram Reel"
    if "/p/" in url and "instagram.com" in url:
        return "Instagram Post"
    if "linkedin.com/feed/update/" in url or "linkedin.com/posts/" in url:
        return "LinkedIn Post"
    if "linkedin.com/jobs/view/" in url:
        return "LinkedIn Job"
    if "reddit.com/r/" in url and "/comments/" in url:
        return "Reddit Post"
    if "tiktok.com/" in url:
        return "TikTok Video"
    if "twitter.com/" in url or "x.com/" in url:
        return "Twitter/X Post"
    return "Unknown"


def test_linkedin_scraper():
    """Test LinkedIn scraper with a real LinkedIn post URL."""
    
    # Test URL from the user's example
    test_url = "https://www.linkedin.com/posts/kevin-wang-558a6a329_kevin-on-instagram-someone-give-me-an-internship-activity-7354180489252913153-3sJ6?utm_source=social_share_send&utm_medium=member_desktop_web&rcm=ACoAADQElOMBnfGIRfLNrVt0fZlIlM4S1yRGilI"
    
    print("🧪 Testing LinkedIn Scraper")
    print("=" * 50)
    
    # Test platform detection
    print("1️⃣ Testing Platform Detection")
    platform = detect_platform(test_url)
    print(f"   URL: {test_url}")
    print(f"   Detected Platform: {platform}")
    
    if platform != "LinkedIn Post":
        print("   ❌ Platform detection failed!")
        return False
    else:
        print("   ✅ Platform detection successful!")
    
    # Test scraper factory
    print("\n2️⃣ Testing Scraper Factory")
    scraper = get_scraper(platform)
    if not scraper:
        print("   ❌ No scraper found for LinkedIn Post!")
        return False
    else:
        print(f"   ✅ Scraper found: {scraper.__class__.__name__}")
    
    # Test actual scraping
    print("\n3️⃣ Testing LinkedIn Scraping")
    try:
        result = scraper.scrape(test_url)
        
        if "error" in result:
            print(f"   ❌ Scraping failed: {result['error']}")
            return False
        
        print("   ✅ Scraping completed successfully!")
        print(f"   📋 Title: {result.get('title', 'N/A')}")
        print(f"   👤 Author: {result.get('channel', 'N/A')}")
        print(f"   📝 Content Length: {len(result.get('description', ''))} characters")
        print(f"   🖼️ Thumbnail: {result.get('thumbnail', 'N/A')}")
        print(f"   📊 Metadata: {result.get('metadata', {})}")
        
        # Validate required fields
        required_fields = ['title', 'channel', 'description']
        missing_fields = [field for field in required_fields if not result.get(field)]
        
        if missing_fields:
            print(f"   ⚠️ Missing fields: {missing_fields}")
        else:
            print("   ✅ All required fields present!")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Scraping exception: {e}")
        return False


def test_linkedin_url_patterns():
    """Test various LinkedIn URL patterns."""
    
    test_urls = [
        "https://www.linkedin.com/posts/kevin-wang-558a6a329_kevin-on-instagram-someone-give-me-an-internship-activity-7354180489252913153-3sJ6",
        "https://www.linkedin.com/feed/update/urn:li:activity:7354180489252913153/",
        "https://www.linkedin.com/posts/john-doe-123456789_my-post-title-activity-1234567890123456789",
    ]
    
    print("\n🔍 Testing LinkedIn URL Patterns")
    print("=" * 40)
    
    for url in test_urls:
        platform = detect_platform(url)
        print(f"   URL: {url}")
        print(f"   Platform: {platform}")
        print(f"   Valid: {'✅' if platform == 'LinkedIn Post' else '❌'}")
        print()


if __name__ == "__main__":
    print("🚀 LinkedIn Scraper Test Suite")
    print("=" * 50)
    
    # Test URL patterns
    test_linkedin_url_patterns()
    
    # Test actual scraping
    success = test_linkedin_scraper()
    
    if success:
        print("\n🎉 All LinkedIn tests passed!")
    else:
        print("\n❌ Some LinkedIn tests failed!")
        sys.exit(1) 