#!/usr/bin/env python3
"""
Test script for the new YouTube scraper that only uses oEmbed API.
This script tests various YouTube URLs to ensure the scraper works correctly.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scrapers.youtube import YouTubeScraper

def test_youtube_scraper():
    """Test the YouTube scraper with various URLs."""
    
    # Test URLs
    test_urls = [
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",  # Rick Roll
        "https://youtu.be/dQw4w9WgXcQ",  # Shortened URL
        "https://www.youtube.com/shorts/dQw4w9WgXcQ",  # Shorts URL
        "https://www.youtube.com/watch?v=9bZkp7q19f0",  # PSY - GANGNAM STYLE
        "https://youtu.be/9bZkp7q19f0",  # Shortened PSY
    ]
    
    scraper = YouTubeScraper()
    
    print("🧪 Testing YouTube Scraper (oEmbed Only)")
    print("=" * 50)
    
    for i, url in enumerate(test_urls, 1):
        print(f"\n🔍 Test {i}: {url}")
        print("-" * 30)
        
        try:
            result = scraper.scrape(url)
            
            if "error" in result:
                print(f"❌ Error: {result['error']}")
            else:
                print(f"✅ Success!")
                print(f"   Title: {result.get('title', 'N/A')}")
                print(f"   Channel: {result.get('channel', 'N/A')}")
                print(f"   Type: {result.get('type', 'N/A')}")
                print(f"   Thumbnail: {'✅' if result.get('thumbnail') else '❌'}")
                print(f"   Description: {'✅' if result.get('description') else '❌'}")
                
                # Check metadata
                metadata = result.get('metadata', {})
                if metadata:
                    print(f"   Metadata keys: {list(metadata.keys())}")
                
        except Exception as e:
            print(f"❌ Exception: {str(e)}")
    
    print("\n" + "=" * 50)
    print("🎉 Testing completed!")

if __name__ == "__main__":
    test_youtube_scraper() 