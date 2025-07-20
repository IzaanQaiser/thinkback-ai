#!/usr/bin/env python3
"""
Test script to verify Twitter scraper works with a real tweet.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scrapers.twitter import TwitterScraper


def test_twitter_scraper():
    """Test the Twitter scraper with a real tweet URL."""
    try:
        print("🧪 Testing Twitter scraper...")
        
        # Test URL from the logs
        test_url = "https://x.com/agazdecki/status/1591439614438699009"
        
        scraper = TwitterScraper()
        result = scraper.scrape(test_url)
        
        print(f"✅ Scraping completed")
        print(f"   Title: {result.get('title', 'N/A')}")
        print(f"   Description: {result.get('description', 'N/A')}")
        print(f"   Platform: {result.get('metadata', {}).get('platform', 'N/A')}")
        print(f"   Scraping method: {result.get('metadata', {}).get('scraping_method', 'N/A')}")
        print(f"   Has media: {result.get('metadata', {}).get('has_media', False)}")
        print(f"   Thumbnail: {result.get('thumbnail', 'N/A')}")
        
        # Check if we got meaningful data
        if result.get('title') and result.get('title') != "Twitter/X Post":
            print("✅ Got meaningful title")
        else:
            print("❌ Got generic title")
            
        if result.get('description') and len(result.get('description', '')) > 10:
            print("✅ Got meaningful description")
        else:
            print("❌ Got generic description")
            
        return True
        
    except Exception as e:
        print(f"❌ Twitter scraper test failed: {e}")
        return False


if __name__ == "__main__":
    print("🔍 Starting Twitter scraper test...")
    success = test_twitter_scraper()
    sys.exit(0 if success else 1)
