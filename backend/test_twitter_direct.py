#!/usr/bin/env python3
"""
Direct test script for Twitter/X scraper without API.
"""

import os
import sys
import asyncio
from dotenv import load_dotenv

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scrapers.twitter import (
    TwitterScraper,
    scrape_with_playwright,
    scrape_with_twitter_api,
    extract_tweet_id_from_url,
)

# Load environment variables
load_dotenv()


def test_direct_scraping():
    """Test the scraper directly without API."""
    print("🧪 Testing Direct Twitter Scraper")
    print("=" * 50)

    # Test with the real tweet URL provided by user
    test_url = "https://x.com/cfc_sant0s/status/1940060631295570195"

    print(f"Testing URL: {test_url}")

    # Extract tweet ID
    tweet_id = extract_tweet_id_from_url(test_url)
    print(f"Tweet ID: {tweet_id}")

    # Test Playwright scraping
    print("\n🔄 Testing Playwright scraping...")
    try:
        playwright_result = asyncio.run(scrape_with_playwright(test_url))
        if playwright_result:
            print("✅ Playwright scraping successful")
            print(f"Text length: {len(playwright_result.get('text', ''))}")
            print(f"Has media: {playwright_result.get('has_media', False)}")
            print(f"Author: {playwright_result.get('author', 'N/A')}")
            print(f"Media URLs: {len(playwright_result.get('media_urls', []))}")
            if playwright_result.get("text"):
                print(f"Text preview: {playwright_result.get('text', '')[:200]}...")
        else:
            print("❌ Playwright scraping failed")
    except Exception as e:
        print(f"❌ Playwright error: {e}")

    # Test Twitter API
    print("\n🔄 Testing Twitter API...")
    try:
        api_result = scrape_with_twitter_api(tweet_id)
        if api_result:
            print("✅ Twitter API successful")
            print(f"Text length: {len(api_result.get('text', ''))}")
            print(f"Has media: {api_result.get('has_media', False)}")
            print(f"Author ID: {api_result.get('author_id', 'N/A')}")
            print(f"Created at: {api_result.get('created_at', 'N/A')}")
            print(f"Media URLs: {len(api_result.get('media_urls', []))}")
            if api_result.get("text"):
                print(f"Text preview: {api_result.get('text', '')[:200]}...")
        else:
            print("❌ Twitter API failed")
    except Exception as e:
        print(f"❌ Twitter API error: {e}")

    # Test full scraper
    print("\n🔄 Testing full scraper...")
    try:
        scraper = TwitterScraper()
        result = scraper.scrape(test_url)

        print("✅ Full scraper completed")
        print(f"Title: {result.get('title', 'N/A')}")
        print(f"Description: {result.get('description', 'N/A')}")
        print(f"Type: {result.get('type', 'N/A')}")
        print(f"Thumbnail: {result.get('thumbnail', 'N/A')}")
        print(f"Hashtags: {result.get('hashtags', [])}")
        print(f"Mentions: {result.get('mentions', [])}")
        print(f"Metadata: {result.get('metadata', {})}")

    except Exception as e:
        print(f"❌ Full scraper error: {e}")


def test_playwright_timeout():
    """Test Playwright with shorter timeout."""
    print("\n🧪 Testing Playwright with Shorter Timeout")
    print("=" * 50)

    test_url = "https://x.com/cfc_sant0s/status/1940060631295570195"

    print(f"Testing URL: {test_url}")

    try:
        # Modify the Playwright function to use shorter timeouts
        async def quick_playwright_test():
            from playwright.async_api import async_playwright

            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page()

                await page.set_extra_http_headers(
                    {
                        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                    }
                )

                print("   🌐 Loading tweet page with shorter timeout...")
                await page.goto(test_url, wait_until="domcontentloaded", timeout=10000)

                # Wait less time
                await page.wait_for_timeout(2000)

                # Try to get any text content quickly
                try:
                    element = await page.wait_for_selector(
                        '[data-testid="tweetText"]', timeout=3000
                    )
                    if element:
                        text = await element.inner_text()
                        print(f"   ✅ Found text: {text[:100]}...")
                        await browser.close()
                        return {
                            "text": text,
                            "has_media": False,
                            "media_urls": [],
                            "scraping_method": "playwright_quick",
                        }
                except:
                    pass

                await browser.close()
                return None

        result = asyncio.run(quick_playwright_test())
        if result:
            print("✅ Quick Playwright test successful")
        else:
            print("❌ Quick Playwright test failed")

    except Exception as e:
        print(f"❌ Quick Playwright error: {e}")


if __name__ == "__main__":
    print("🚀 Direct Twitter/X Scraper Test Suite")
    print("=" * 60)

    # Test direct scraping
    test_direct_scraping()

    # Test Playwright with shorter timeout
    test_playwright_timeout()

    print("\n✅ Direct test suite completed!")
