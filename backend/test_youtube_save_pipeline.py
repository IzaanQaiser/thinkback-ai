#!/usr/bin/env python3
"""
Test script for the complete YouTube saving pipeline.
This script tests the full flow from URL to saved entry.
"""

import sys
import os
import requests
import json
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_youtube_save_pipeline():
    """Test the complete YouTube saving pipeline."""
    
    # Test URL
    test_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    
    print("🧪 Testing Complete YouTube Save Pipeline")
    print("=" * 50)
    print(f"📺 Test URL: {test_url}")
    print("-" * 30)
    
    # Test 1: Direct scraper test
    print("\n🔍 Test 1: Direct Scraper Test")
    try:
        from scrapers.youtube import YouTubeScraper
        scraper = YouTubeScraper()
        scraped_data = scraper.scrape(test_url)
        
        if "error" in scraped_data:
            print(f"❌ Scraper Error: {scraped_data['error']}")
            return
        else:
            print(f"✅ Scraper Success!")
            print(f"   Title: {scraped_data.get('title', 'N/A')}")
            print(f"   Channel: {scraped_data.get('channel', 'N/A')}")
            print(f"   Type: {scraped_data.get('type', 'N/A')}")
            print(f"   Thumbnail: {'✅' if scraped_data.get('thumbnail') else '❌'}")
            
    except Exception as e:
        print(f"❌ Scraper Exception: {str(e)}")
        return
    
    # Test 2: API endpoint test (if server is running)
    print("\n🔍 Test 2: API Endpoint Test")
    try:
        # Test the scrape endpoint
        scrape_response = requests.post(
            "http://localhost:8000/api/scrape",
            json={"url": test_url},
            timeout=30
        )
        
        if scrape_response.status_code == 200:
            scrape_data = scrape_response.json()
            print(f"✅ API Scrape Success!")
            print(f"   Status: {scrape_response.status_code}")
            print(f"   Data keys: {list(scrape_data.keys())}")
            
            # Check if we got the expected data
            if 'title' in scrape_data and scrape_data['title']:
                print(f"   ✅ Title: {scrape_data['title']}")
            else:
                print(f"   ❌ No title found")
                
            if 'channel' in scrape_data and scrape_data['channel']:
                print(f"   ✅ Channel: {scrape_data['channel']}")
            else:
                print(f"   ❌ No channel found")
                
            if 'thumbnail' in scrape_data and scrape_data['thumbnail']:
                print(f"   ✅ Thumbnail: {scrape_data['thumbnail']}")
            else:
                print(f"   ❌ No thumbnail found")
                
        else:
            print(f"❌ API Scrape Failed: {scrape_response.status_code}")
            print(f"   Response: {scrape_response.text}")
            
    except requests.exceptions.ConnectionError:
        print("⚠️ API server not running - skipping API test")
    except Exception as e:
        print(f"❌ API Test Exception: {str(e)}")
    
    # Test 3: YouTube-specific scrape endpoint
    print("\n🔍 Test 3: YouTube-Specific Scrape Endpoint")
    try:
        youtube_response = requests.get(
            f"http://localhost:8000/api/scrape/youtube?url={test_url}",
            timeout=30
        )
        
        if youtube_response.status_code == 200:
            youtube_data = youtube_response.json()
            print(f"✅ YouTube API Success!")
            print(f"   Status: {youtube_response.status_code}")
            print(f"   Data keys: {list(youtube_data.keys())}")
            
            # Check if we got the expected data
            if 'title' in youtube_data and youtube_data['title']:
                print(f"   ✅ Title: {youtube_data['title']}")
            else:
                print(f"   ❌ No title found")
                
            if 'channel' in youtube_data and youtube_data['channel']:
                print(f"   ✅ Channel: {youtube_data['channel']}")
            else:
                print(f"   ❌ No channel found")
                
            if 'thumbnail' in youtube_data and youtube_data['thumbnail']:
                print(f"   ✅ Thumbnail: {youtube_data['thumbnail']}")
            else:
                print(f"   ❌ No thumbnail found")
                
        else:
            print(f"❌ YouTube API Failed: {youtube_response.status_code}")
            print(f"   Response: {youtube_response.text}")
            
    except requests.exceptions.ConnectionError:
        print("⚠️ API server not running - skipping YouTube API test")
    except Exception as e:
        print(f"❌ YouTube API Test Exception: {str(e)}")
    
    print("\n" + "=" * 50)
    print("🎉 Pipeline testing completed!")

if __name__ == "__main__":
    test_youtube_save_pipeline() 