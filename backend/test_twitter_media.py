#!/usr/bin/env python3
"""
Test script for Twitter/X scraper with a tweet that definitely has media.
"""

import os
import sys
import asyncio
from dotenv import load_dotenv

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scrapers.twitter import TwitterScraper

# Load environment variables
load_dotenv()


def test_media_tweet():
    """Test with a tweet that definitely has media."""
    print("🧪 Testing Media Tweet")
    print("=" * 50)

    # Test with a tweet that should have media (you can replace this with any media tweet)
    test_url = "https://twitter.com/elonmusk/status/1745977702278344704"

    print(f"Testing URL: {test_url}")

    try:
        scraper = TwitterScraper()
        result = scraper.scrape(test_url)

        print("✅ Media tweet scraping completed")
        print(f"Title: {result.get('title', 'N/A')}")
        print(f"Description: {result.get('description', 'N/A')}")
        print(f"Thumbnail: {result.get('thumbnail', 'N/A')}")
        print(f"Has Media: {result.get('metadata', {}).get('has_media', 'N/A')}")
        print(
            f"Scraping method: {result.get('metadata', {}).get('scraping_method', 'N/A')}"
        )

        if result.get("thumbnail"):
            print("✅ Thumbnail successfully extracted!")
        else:
            print("❌ No thumbnail found")

    except Exception as e:
        print(f"❌ Media tweet error: {e}")


def test_image_tweet():
    """Test with a tweet that has an image."""
    print("\n🧪 Testing Image Tweet")
    print("=" * 50)

    # Test with a tweet that should have an image
    test_url = "https://twitter.com/Twitter/status/1745977702278344704"

    print(f"Testing URL: {test_url}")

    try:
        scraper = TwitterScraper()
        result = scraper.scrape(test_url)

        print("✅ Image tweet scraping completed")
        print(f"Title: {result.get('title', 'N/A')}")
        print(f"Description: {result.get('description', 'N/A')}")
        print(f"Thumbnail: {result.get('thumbnail', 'N/A')}")
        print(f"Has Media: {result.get('metadata', {}).get('has_media', 'N/A')}")
        print(
            f"Scraping method: {result.get('metadata', {}).get('scraping_method', 'N/A')}"
        )

        if result.get("thumbnail"):
            print("✅ Image thumbnail successfully extracted!")
        else:
            print("❌ No image thumbnail found")

    except Exception as e:
        print(f"❌ Image tweet error: {e}")


if __name__ == "__main__":
    print("🚀 Media Twitter/X Scraper Test Suite")
    print("=" * 60)

    # Test media tweet
    test_media_tweet()

    # Test image tweet
    test_image_tweet()

    print("\n✅ Media test suite completed!")
