#!/usr/bin/env python3
"""
Test script for Twitter/X scraper functionality.
"""

import os
import sys
from dotenv import load_dotenv

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scrapers.twitter import TwitterScraper, extract_tweet_id_from_url

# Load environment variables
load_dotenv()


def test_tweet_id_extraction():
    """Test tweet ID extraction from various URL formats."""
    print("🧪 Testing Tweet ID Extraction")
    print("=" * 50)

    test_urls = [
        "https://twitter.com/elonmusk/status/1234567890123456789",
        "https://x.com/elonmusk/status/1234567890123456789",
        "https://twitter.com/i/status/1234567890123456789",
        "https://x.com/i/status/1234567890123456789",
        "https://twitter.com/status/1234567890123456789",
        "https://x.com/status/1234567890123456789",
        "https://twitter.com/elonmusk/status/1234567890123456789?s=20",
        "https://x.com/elonmusk/status/1234567890123456789?t=abc123",
    ]

    for url in test_urls:
        tweet_id = extract_tweet_id_from_url(url)
        print(f"URL: {url}")
        print(f"Tweet ID: {tweet_id}")
        print(f"Valid: {tweet_id == '1234567890123456789'}")
        print("-" * 30)


def test_twitter_scraper():
    """Test the Twitter scraper with a real tweet URL."""
    print("\n🧪 Testing Twitter Scraper")
    print("=" * 50)

    # Test with a real tweet URL (you can replace this with any public tweet)
    test_url = "https://twitter.com/elonmusk/status/1234567890123456789"

    print(f"Testing URL: {test_url}")

    # Check if Twitter Bearer Token is available
    bearer_token = os.environ.get("TWITTER_BEARER_TOKEN")
    if bearer_token:
        print("✅ Twitter Bearer Token found")
    else:
        print("⚠️ Twitter Bearer Token not found - API fallback will be disabled")

    # Create scraper instance
    scraper = TwitterScraper()

    try:
        # Attempt to scrape
        result = scraper.scrape(test_url)

        print("\n📊 Scraping Results:")
        print(f"Title: {result.get('title', 'N/A')}")
        print(f"Description: {result.get('description', 'N/A')}")
        print(f"Type: {result.get('type', 'N/A')}")
        print(f"Thumbnail: {result.get('thumbnail', 'N/A')}")
        print(f"Hashtags: {result.get('hashtags', [])}")
        print(f"Mentions: {result.get('mentions', [])}")
        print(f"Metadata: {result.get('metadata', {})}")

        # Check if scraping was successful
        if result.get("title") and result.get("title") != "Twitter/X Post":
            print("✅ Scraping appears successful!")
        else:
            print("⚠️ Scraping may have failed or returned fallback data")

    except Exception as e:
        print(f"❌ Scraping failed with error: {e}")


def test_playwright_only():
    """Test Playwright scraping without API fallback."""
    print("\n🧪 Testing Playwright-Only Scraping")
    print("=" * 50)

    import asyncio
    from scrapers.twitter import scrape_with_playwright

    test_url = "https://twitter.com/elonmusk/status/1234567890123456789"

    try:
        result = asyncio.run(scrape_with_playwright(test_url))

        if result:
            print("✅ Playwright scraping successful")
            print(f"Text length: {len(result.get('text', ''))}")
            print(f"Has media: {result.get('has_media', False)}")
            print(f"Author: {result.get('author', 'N/A')}")
            print(f"Scraping method: {result.get('scraping_method', 'N/A')}")
        else:
            print("❌ Playwright scraping failed")

    except Exception as e:
        print(f"❌ Playwright test failed: {e}")


if __name__ == "__main__":
    print("🚀 Twitter/X Scraper Test Suite")
    print("=" * 60)

    # Test tweet ID extraction
    test_tweet_id_extraction()

    # Test Playwright-only scraping
    test_playwright_only()

    # Test full scraper
    test_twitter_scraper()

    print("\n✅ Test suite completed!")
