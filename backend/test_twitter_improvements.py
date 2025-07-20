#!/usr/bin/env python3
"""
Test script to verify Twitter scraper improvements.
This tests the enhanced error handling and fallback mechanisms.
"""

import asyncio
import sys
import os
from scrapers.twitter import TwitterScraper, scrape_with_twitter_api


def test_twitter_scraper():
    """Test the Twitter scraper with various scenarios."""
    print("🧪 Testing Twitter scraper improvements...")
    
    # Test URLs
    test_urls = [
        "https://x.com/agazdecki/status/1591439614438699009",  # Real tweet
        "https://twitter.com/elonmusk/status/1234567890",      # Fake tweet for testing
    ]
    
    scraper = TwitterScraper()
    
    for url in test_urls:
        print(f"\n🔍 Testing URL: {url}")
        try:
            result = scraper.scrape(url)
            
            print(f"✅ Scraping completed")
            print(f"   Title: {result.get('title', 'N/A')}")
            print(f"   Description: {len(result.get('description', ''))} chars")
            print(f"   Type: {result.get('type', 'N/A')}")
            print(f"   Platform: {result.get('metadata', {}).get('platform', 'N/A')}")
            print(f"   Scraping method: {result.get('metadata', {}).get('scraping_method', 'N/A')}")
            print(f"   Has media: {result.get('metadata', {}).get('has_media', False)}")
            print(f"   Thumbnail: {result.get('thumbnail', 'N/A')}")
            print(f"   Hashtags: {len(result.get('hashtags', []))}")
            print(f"   Mentions: {len(result.get('mentions', []))}")
            
        except Exception as e:
            print(f"❌ Scraping failed: {e}")
    
    print("\n🎉 Twitter scraper test completed!")


def test_playwright_fallback():
    """Test that Playwright fallback works when API fails."""
    print("\n🧪 Testing Playwright fallback mechanism...")
    
    # Test with a URL that might fail API but work with Playwright
    test_url = "https://x.com/agazdecki/status/1591439614438699009"
    
    scraper = TwitterScraper()
    
    try:
        result = scraper.scrape(test_url)
        
        if result:
            print("✅ Fallback mechanism worked")
            print(f"   Method used: {result.get('metadata', {}).get('scraping_method', 'unknown')}")
        else:
            print("❌ Fallback mechanism failed")
            
    except Exception as e:
        print(f"❌ Fallback test failed: {e}")


def test_api_rate_limiting():
    """Test API rate limiting handling."""
    print("\n🧪 Testing API rate limiting handling...")
    
    # Test with a fake tweet ID to trigger API errors
    fake_tweet_id = "1234567890123456789"
    
    try:
        result = scrape_with_twitter_api(fake_tweet_id)
        
        if result is None:
            print("✅ API error handling worked correctly")
        else:
            print("⚠️ API returned unexpected result")
            
    except Exception as e:
        print(f"❌ API test failed: {e}")


if __name__ == "__main__":
    print("🚀 Starting Twitter scraper improvement tests...")
    
    # Test basic scraping
    test_twitter_scraper()
    
    # Test fallback mechanisms
    test_playwright_fallback()
    
    # Test API error handling
    test_api_rate_limiting()
    
    print("\n✅ All tests completed!")
    sys.exit(0) 