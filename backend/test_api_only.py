#!/usr/bin/env python3
"""
Test script to check Twitter API media extraction.
"""

import os
import sys
import requests
from dotenv import load_dotenv

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scrapers.twitter import scrape_with_twitter_api, extract_tweet_id_from_url

# Load environment variables
load_dotenv()


def test_api_media():
    """Test Twitter API media extraction."""
    print("🧪 Testing Twitter API Media Extraction")
    print("=" * 50)

    # Test with the same tweet
    test_url = "https://x.com/cfc_sant0s/status/1940060631295570195"

    print(f"Testing URL: {test_url}")

    # Extract tweet ID
    tweet_id = extract_tweet_id_from_url(test_url)
    print(f"Tweet ID: {tweet_id}")

    # Check if we have the bearer token
    bearer_token = os.environ.get("TWITTER_BEARER_TOKEN")
    if not bearer_token:
        print("❌ Twitter Bearer Token not found")
        return

    print("✅ Twitter Bearer Token found")

    # Test API directly
    try:
        result = scrape_with_twitter_api(tweet_id)

        if result:
            print("✅ API extraction successful")
            print(f"Text: {result.get('text', 'N/A')}")
            print(f"Has media: {result.get('has_media', 'N/A')}")
            print(f"Media URLs: {result.get('media_urls', [])}")
            print(f"Author ID: {result.get('author_id', 'N/A')}")
            print(f"Created at: {result.get('created_at', 'N/A')}")

            if result.get("media_urls"):
                print("✅ Media URLs found via API!")
            else:
                print("❌ No media URLs found via API")
        else:
            print("❌ API extraction failed")

    except Exception as e:
        print(f"❌ API test error: {e}")


def test_different_tweet():
    """Test with a different tweet that might have media."""
    print("\n🧪 Testing Different Tweet")
    print("=" * 50)

    # Test with a different tweet (you can replace this)
    test_url = "https://twitter.com/elonmusk/status/1745977702278344704"

    print(f"Testing URL: {test_url}")

    tweet_id = extract_tweet_id_from_url(test_url)
    print(f"Tweet ID: {tweet_id}")

    try:
        result = scrape_with_twitter_api(tweet_id)

        if result:
            print("✅ API extraction successful")
            print(f"Text: {result.get('text', 'N/A')[:100]}...")
            print(f"Has media: {result.get('has_media', 'N/A')}")
            print(f"Media URLs: {result.get('media_urls', [])}")

            if result.get("media_urls"):
                print("✅ Media URLs found via API!")
            else:
                print("❌ No media URLs found via API")
        else:
            print("❌ API extraction failed")

    except Exception as e:
        print(f"❌ API test error: {e}")


if __name__ == "__main__":
    print("🚀 Twitter API Media Test Suite")
    print("=" * 60)

    # Test API media extraction
    test_api_media()

    # Test different tweet
    test_different_tweet()

    print("\n✅ API test suite completed!")
