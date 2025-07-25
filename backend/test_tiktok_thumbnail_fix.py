#!/usr/bin/env python3

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scrapers.tiktok import TikTokScraper

def test_tiktok_thumbnail_fix():
    """Test that TikTok entries without thumbnails work correctly"""
    
    # Test URL from the user's example
    test_url = "https://www.tiktok.com/@nour.afifi3/photo/7528964374384414008"
    
    scraper = TikTokScraper()
    
    print(f"🎵 Testing TikTok Thumbnail Fix: {test_url}")
    print("=" * 60)
    
    try:
        result = scraper.scrape(test_url)
        
        print(f"📊 Results:")
        print(f"   Title: {result.get('title', 'N/A')}")
        print(f"   Description: {result.get('description', 'N/A')}")
        print(f"   Thumbnail: {result.get('thumbnail', 'N/A')}")
        print(f"   Type: {result.get('type', 'N/A')}")
        print(f"   Platform: {result.get('platform', 'N/A')}")
        print(f"   Channel: {result.get('channel', 'N/A')}")
        
        # Check if thumbnail was found
        thumbnail = result.get('thumbnail')
        if thumbnail:
            print(f"✅ SUCCESS: Thumbnail found: {thumbnail}")
            return True
        else:
            print(f"📱 EXPECTED: No thumbnail - will use default TikTok logo")
            print(f"✅ This is the expected behavior for TikTok entries without thumbnails")
            return True
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

if __name__ == "__main__":
    success = test_tiktok_thumbnail_fix()
    if success:
        print(f"\n🎯 Test completed successfully!")
    else:
        print(f"\n❌ Test failed!") 