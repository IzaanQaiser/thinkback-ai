#!/usr/bin/env python3

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scrapers.twitter import TwitterScraper

def test_twitter_image_extraction_fix():
    """Test that Twitter posts with images containing 'small' parameter get proper thumbnails"""
    
    # Test URL from the user's example
    test_url = "https://x.com/birdabo404/status/1946610855480881610"
    
    scraper = TwitterScraper()
    
    print(f"🧪 Testing URL: {test_url}")
    print("=" * 60)
    
    try:
        result = scraper.scrape(test_url)
        
        print(f"📊 Results:")
        print(f"   Title: {result.get('title', 'N/A')}")
        print(f"   Description: {result.get('description', 'N/A')}")
        print(f"   Thumbnail: {result.get('thumbnail', 'N/A')}")
        print(f"   Type: {result.get('type', 'N/A')}")
        print(f"   Platform: {result.get('platform', 'N/A')}")
        
        # Check if thumbnail was found
        thumbnail = result.get('thumbnail')
        if thumbnail:
            print(f"✅ SUCCESS: Thumbnail found: {thumbnail}")
            return True
        else:
            print(f"❌ FAILED: No thumbnail found")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

if __name__ == "__main__":
    test_twitter_image_extraction_fix() 