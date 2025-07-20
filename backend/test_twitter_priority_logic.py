#!/usr/bin/env python3

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scrapers.twitter import TwitterScraper

def test_twitter_priority_logic():
    """Test that Twitter posts use the correct priority logic for thumbnails"""
    
    # Test URL from the user's example
    test_url = "https://x.com/birdabo404/status/1946610855480881610"
    
    scraper = TwitterScraper()
    
    print(f"🧪 Testing Priority Logic: {test_url}")
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
            
            # Check if it's a media image (should be the only option now)
            if "/media/" in thumbnail:
                print(f"✅ CORRECT: Using media image as thumbnail")
                return True
            else:
                print(f"❓ UNKNOWN: Using non-media image as thumbnail")
                return True
        else:
            print(f"📱 EXPECTED: No thumbnail - will use default X logo")
            return True
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

if __name__ == "__main__":
    test_twitter_priority_logic() 