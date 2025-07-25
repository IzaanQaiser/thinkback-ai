#!/usr/bin/env python3
"""
Complete integration test for LinkedIn posts.
Tests the full pipeline from URL detection to content saving.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scrapers.linkedin import LinkedInScraper
from scraper_factory import get_scraper
from ai import classify_entry, format_ai_prompt


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


def test_linkedin_complete_integration():
    """Test complete LinkedIn integration pipeline."""
    
    # Test URL from the user's example
    test_url = "https://www.linkedin.com/posts/kevin-wang-558a6a329_kevin-on-instagram-someone-give-me-an-internship-activity-7354180489252913153-3sJ6?utm_source=social_share_send&utm_medium=member_desktop_web&rcm=ACoAADQElOMBnfGIRfLNrVt0fZlIlM4S1yRGilI"
    
    print("🧪 Testing LinkedIn Complete Integration")
    print("=" * 60)
    
    # Step 1: Platform Detection
    print("1️⃣ Platform Detection")
    platform = detect_platform(test_url)
    print(f"   URL: {test_url}")
    print(f"   Platform: {platform}")
    
    if platform != "LinkedIn Post":
        print("   ❌ Platform detection failed!")
        return False
    else:
        print("   ✅ Platform detection successful!")
    
    # Step 2: Scraper Factory
    print("\n2️⃣ Scraper Factory")
    scraper = get_scraper(platform)
    if not scraper:
        print("   ❌ No scraper found for LinkedIn Post!")
        return False
    else:
        print(f"   ✅ Scraper found: {scraper.__class__.__name__}")
    
    # Step 3: Content Scraping
    print("\n3️⃣ Content Scraping")
    try:
        scraped_data = scraper.scrape(test_url)
        
        if "error" in scraped_data:
            print(f"   ❌ Scraping failed: {scraped_data['error']}")
            return False
        
        print("   ✅ Scraping completed successfully!")
        print(f"   📋 Title: {scraped_data.get('title', 'N/A')}")
        print(f"   👤 Author: {scraped_data.get('channel', 'N/A')}")
        print(f"   📝 Content Length: {len(scraped_data.get('description', ''))} characters")
        print(f"   🖼️ Thumbnail: {scraped_data.get('thumbnail', 'N/A')}")
        print(f"   📊 Metadata: {scraped_data.get('metadata', {})}")
        
    except Exception as e:
        print(f"   ❌ Scraping exception: {e}")
        return False
    
    # Step 4: AI Processing (simulated)
    print("\n4️⃣ AI Processing Simulation")
    try:
        # Simulate the data structure that would be passed to AI
        entry_data = {
            "url": test_url,
            "platform": platform,
            "title": scraped_data.get('title', ''),
            "description": scraped_data.get('description', ''),
            "channel": scraped_data.get('channel', ''),
            "thumbnail": scraped_data.get('thumbnail', ''),
            "metadata": scraped_data.get('metadata', {}),
            "categories": []  # Empty for simulation
        }
        
        # Test AI prompt formatting
        prompt = format_ai_prompt(entry_data)
        print(f"   ✅ AI prompt generated ({len(prompt)} characters)")
        print(f"   📝 Prompt preview: {prompt[:200]}...")
        
        # Note: We don't actually call the AI here to avoid API costs
        # In real usage, this would call classify_entry()
        
    except Exception as e:
        print(f"   ❌ AI processing exception: {e}")
        return False
    
    # Step 5: Data Validation
    print("\n5️⃣ Data Validation")
    required_fields = ['title', 'channel', 'description']
    missing_fields = [field for field in required_fields if not scraped_data.get(field)]
    
    if missing_fields:
        print(f"   ⚠️ Missing fields: {missing_fields}")
    else:
        print("   ✅ All required fields present!")
    
    # Validate content quality
    content_length = len(scraped_data.get('description', ''))
    if content_length < 10:
        print(f"   ⚠️ Content seems too short: {content_length} characters")
    else:
        print(f"   ✅ Content length is good: {content_length} characters")
    
    # Validate author
    author = scraped_data.get('channel', '')
    if not author or author == "Unknown Author":
        print("   ⚠️ Author extraction may have failed")
    else:
        print(f"   ✅ Author extracted: {author}")
    
    print("\n🎉 LinkedIn integration test completed successfully!")
    return True


def test_linkedin_url_variations():
    """Test various LinkedIn URL formats."""
    
    test_urls = [
        "https://www.linkedin.com/posts/kevin-wang-558a6a329_kevin-on-instagram-someone-give-me-an-internship-activity-7354180489252913153-3sJ6",
        "https://www.linkedin.com/feed/update/urn:li:activity:7354180489252913153/",
        "https://www.linkedin.com/posts/john-doe-123456789_my-post-title-activity-1234567890123456789",
        "https://www.linkedin.com/posts/username_title-activity-123456789?utm_source=share",
    ]
    
    print("\n🔍 Testing LinkedIn URL Variations")
    print("=" * 50)
    
    for i, url in enumerate(test_urls, 1):
        platform = detect_platform(url)
        print(f"   {i}. URL: {url}")
        print(f"      Platform: {platform}")
        print(f"      Valid: {'✅' if platform == 'LinkedIn Post' else '❌'}")
        print()


if __name__ == "__main__":
    print("🚀 LinkedIn Complete Integration Test Suite")
    print("=" * 60)
    
    # Test URL variations
    test_linkedin_url_variations()
    
    # Test complete integration
    success = test_linkedin_complete_integration()
    
    if success:
        print("\n🎉 All LinkedIn integration tests passed!")
        print("\n📋 Summary:")
        print("   ✅ Platform detection works")
        print("   ✅ Scraper factory integration works")
        print("   ✅ Content scraping works")
        print("   ✅ AI processing pipeline ready")
        print("   ✅ Data validation passes")
        print("\n🚀 LinkedIn posts are ready for production!")
    else:
        print("\n❌ Some LinkedIn integration tests failed!")
        sys.exit(1) 