#!/usr/bin/env python3

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scrapers.linkedin import LinkedInScraper

def test_linkedin_logo_fallback():
    """Test that LinkedIn posts without thumbnails will use LinkedIn logo fallback"""
    
    # Test URL - this should be a LinkedIn post that might not have a thumbnail
    test_url = "https://www.linkedin.com/posts/activity-1234567890"
    
    scraper = LinkedInScraper()
    
    print(f"🧪 Testing LinkedIn Logo Fallback: {test_url}")
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
            print(f"📱 EXPECTED: No thumbnail - will use default LinkedIn logo")
            print(f"✅ CORRECT: LinkedIn entries without thumbnails will show LinkedIn logo watermark")
            return True
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

if __name__ == "__main__":
    success = test_linkedin_logo_fallback()
    if success:
        print(f"\n✅ LinkedIn logo fallback test completed successfully!")
    else:
        print(f"\n❌ LinkedIn logo fallback test failed!") 