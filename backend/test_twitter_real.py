#!/usr/bin/env python3
"""
Test script for Twitter/X scraper with real tweet URLs.
"""

import os
import sys
import requests
from dotenv import load_dotenv

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()


def test_real_tweet_scraping():
    """Test scraping with a real tweet URL."""
    print("🧪 Testing Real Tweet Scraping")
    print("=" * 50)

    # Test with a real tweet URL (this is a public tweet from Elon Musk)
    # You can replace this with any public tweet URL
    test_url = "https://twitter.com/elonmusk/status/1745977702278344704"

    print(f"Testing URL: {test_url}")

    # Test via API endpoint
    try:
        response = requests.post(
            "http://localhost:8000/api/scrape", json={"url": test_url}, timeout=30
        )

        if response.status_code == 200:
            result = response.json()
            print("✅ API request successful")
            print(f"Platform: {result.get('platform', 'N/A')}")
            print(f"Success: {result.get('success', 'N/A')}")
            print(f"Title: {result.get('title', 'N/A')}")
            print(f"Description: {result.get('description', 'N/A')}")
            print(f"Type: {result.get('type', 'N/A')}")
            print(f"Thumbnail: {result.get('thumbnail', 'N/A')}")
            print(f"Hashtags: {result.get('hashtags', [])}")
            print(f"Mentions: {result.get('mentions', [])}")
            print(f"Metadata: {result.get('metadata', {})}")

            # Check if scraping was successful
            if (
                result.get("success")
                and result.get("title")
                and result.get("title") != "Twitter/X Post"
            ):
                print("✅ Real tweet scraping successful!")
            else:
                print("⚠️ Scraping may have failed or returned fallback data")
        else:
            print(f"❌ API request failed with status {response.status_code}")
            print(f"Response: {response.text}")

    except Exception as e:
        print(f"❌ API test failed: {e}")


def test_invalid_url():
    """Test handling of invalid URLs."""
    print("\n🧪 Testing Invalid URL Handling")
    print("=" * 50)

    invalid_urls = [
        "https://twitter.com/invalid",
        "https://x.com/invalid",
        "https://google.com",
        "not-a-url",
    ]

    for url in invalid_urls:
        print(f"Testing invalid URL: {url}")

        try:
            response = requests.post(
                "http://localhost:8000/api/scrape", json={"url": url}, timeout=10
            )

            if response.status_code == 200:
                result = response.json()
                print(f"  Platform: {result.get('platform', 'N/A')}")
                print(f"  Success: {result.get('success', 'N/A')}")
                if not result.get("success"):
                    print(f"  Error: {result.get('error', 'N/A')}")
            else:
                print(f"  HTTP Error: {response.status_code}")

        except Exception as e:
            print(f"  Exception: {e}")

        print("-" * 30)


def test_different_twitter_formats():
    """Test different Twitter/X URL formats."""
    print("\n🧪 Testing Different Twitter/X URL Formats")
    print("=" * 50)

    # Use a real tweet ID but test different URL formats
    tweet_id = "1745977702278344704"
    url_formats = [
        f"https://twitter.com/elonmusk/status/{tweet_id}",
        f"https://x.com/elonmusk/status/{tweet_id}",
        f"https://twitter.com/i/status/{tweet_id}",
        f"https://x.com/i/status/{tweet_id}",
        f"https://twitter.com/status/{tweet_id}",
        f"https://x.com/status/{tweet_id}",
    ]

    for url in url_formats:
        print(f"Testing format: {url}")

        try:
            response = requests.post(
                "http://localhost:8000/api/scrape", json={"url": url}, timeout=15
            )

            if response.status_code == 200:
                result = response.json()
                print(f"  Platform: {result.get('platform', 'N/A')}")
                print(f"  Success: {result.get('success', 'N/A')}")
                print(f"  Title: {result.get('title', 'N/A')[:50]}...")
            else:
                print(f"  HTTP Error: {response.status_code}")

        except Exception as e:
            print(f"  Exception: {e}")

        print("-" * 30)


if __name__ == "__main__":
    print("🚀 Real Twitter/X Scraper Test Suite")
    print("=" * 60)

    # Test real tweet scraping
    test_real_tweet_scraping()

    # Test invalid URL handling
    test_invalid_url()

    # Test different URL formats
    test_different_twitter_formats()

    print("\n✅ Real test suite completed!")
