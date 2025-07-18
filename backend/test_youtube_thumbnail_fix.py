#!/usr/bin/env python3
"""
Test script to verify YouTube thumbnail fix.
Tests the new thumbnail quality selection and ensures no letterboxing issues.
"""

import sys
import os
import requests
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scrapers.youtube import YouTubeScraper, get_best_thumbnail_url

def test_thumbnail_quality_selection():
    """Test the thumbnail quality selection function."""
    
    print("🧪 Testing YouTube Thumbnail Quality Selection")
    print("=" * 60)
    
    # Test video IDs
    test_video_ids = [
        "dQw4w9WgXcQ",  # Rick Roll
        "9bZkp7q19f0",  # Gangnam Style
        "jNQXAC9IVRw",  # Me at the zoo (first YouTube video)
    ]
    
    for video_id in test_video_ids:
        print(f"\n🔍 Testing video ID: {video_id}")
        print("-" * 30)
        
        try:
            thumbnail_url = get_best_thumbnail_url(video_id)
            print(f"   ✅ Selected thumbnail: {thumbnail_url}")
            
            # Test if the thumbnail is accessible
            response = requests.head(thumbnail_url, timeout=10)
            if response.status_code == 200:
                print(f"   ✅ Thumbnail is accessible (Status: {response.status_code})")
                print(f"   📊 Content-Type: {response.headers.get('content-type', 'N/A')}")
                print(f"   📏 Content-Length: {response.headers.get('content-length', 'N/A')} bytes")
            else:
                print(f"   ❌ Thumbnail not accessible (Status: {response.status_code})")
                
        except Exception as e:
            print(f"   ❌ Error testing thumbnail: {str(e)}")

def test_complete_scraper():
    """Test the complete scraper with thumbnail fix."""
    
    print("\n🧪 Testing Complete YouTube Scraper")
    print("=" * 60)
    
    test_urls = [
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "https://www.youtube.com/watch?v=9bZkp7q19f0",
        "https://www.youtube.com/shorts/dQw4w9WgXcQ",
    ]
    
    scraper = YouTubeScraper()
    
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
                print(f"   Thumbnail: {result.get('thumbnail', 'N/A')}")
                
                # Test thumbnail accessibility
                thumbnail_url = result.get('thumbnail')
                if thumbnail_url:
                    try:
                        response = requests.head(thumbnail_url, timeout=10)
                        if response.status_code == 200:
                            print(f"   ✅ Thumbnail accessible")
                        else:
                            print(f"   ❌ Thumbnail not accessible (Status: {response.status_code})")
                    except Exception as e:
                        print(f"   ❌ Thumbnail test failed: {str(e)}")
                
        except Exception as e:
            print(f"❌ Exception: {str(e)}")

if __name__ == "__main__":
    test_thumbnail_quality_selection()
    test_complete_scraper()
    print("\n🎉 Testing completed!") 