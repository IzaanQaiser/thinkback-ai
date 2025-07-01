#!/usr/bin/env python3
"""
Test script for the complete Instagram pipeline with the new hybrid scraper.
Tests platform detection, scraping, and AI enrichment.
"""

import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scraper_factory import get_scraper


def detect_platform(url: str) -> str:
    """Platform detection logic from router.py"""
    url = url.lower()
    if "youtube.com/shorts/" in url or "youtu.be/" in url and "?feature=share" in url:
        return "YouTube Shorts"
    if "youtube.com/watch?v=" in url or "youtu.be/" in url:
        return "YouTube Video"
    if "instagram.com/reels/" in url:
        return "Instagram Reel"
    if "instagram.com/p/" in url:
        return "Instagram Post"
    if "linkedin.com/feed/update/" in url or "linkedin.com/posts/" in url:
        return "LinkedIn Post"
    if "linkedin.com/jobs/view/" in url:
        return "LinkedIn Job"
    if "reddit.com/r/" in url and "/comments/" in url:
        return "Reddit Post"
    if "tiktok.com/" in url:
        return "TikTok Video"
    if "twitter.com/" in url or "x.com/" in url:
        return "Twitter/X Post"
    return "Unknown"


def test_complete_pipeline():
    """Test the complete Instagram pipeline."""

    # Test URLs
    test_urls = [
        "https://www.instagram.com/p/C8QZQZQZQZQ/",  # Example post
        "https://www.instagram.com/reels/C8QZQZQZQZQ/",  # Example reel
    ]

    print("🧪 Testing Complete Instagram Pipeline")
    print("=" * 60)

    for i, url in enumerate(test_urls, 1):
        print(f"\n{i}. Testing URL: {url}")
        print("-" * 40)

        try:
            # 1. Platform Detection
            print(f"🔍 Step 1: Platform Detection")
            platform = detect_platform(url)
            print(f"   Detected platform: {platform}")

            # 2. Scraper Factory
            print(f"🔧 Step 2: Scraper Factory")
            scraper = get_scraper(platform)
            print(f"   Scraper: {scraper.__class__.__name__ if scraper else 'None'}")

            if not scraper:
                print(f"   ❌ No scraper found for platform: {platform}")
                continue

            # 3. Content Scraping
            print(f"📥 Step 3: Content Scraping")
            scraped_data = scraper.scrape(url)

            print(f"   ✅ Scraping completed")
            print(f"   📊 Scraped data summary:")
            print(f"     Title: {scraped_data.get('title', 'N/A')}")
            print(f"     Type: {scraped_data.get('type', 'N/A')}")
            print(
                f"     Owner: @{scraped_data.get('posting_account', {}).get('username', 'N/A')}"
            )
            print(
                f"     Caption length: {len(scraped_data.get('description', ''))} chars"
            )
            print(f"     Hashtags: {scraped_data.get('hashtags', [])}")
            print(f"     Mentions: {scraped_data.get('mentions', [])}")
            print(f"     Is carousel: {scraped_data.get('is_carousel', False)}")
            print(f"     Carousel count: {scraped_data.get('carousel_count', 0)}")
            print(f"     Media items: {len(scraped_data.get('media_content', []))}")
            print(f"     Thumbnail: {scraped_data.get('thumbnail', 'N/A')}")
            print(
                f"     Scraper used: {scraped_data.get('metadata', {}).get('scraper', 'unknown')}"
            )

            # 4. AI Enrichment (simulate with mock data)
            print(f"🤖 Step 4: AI Enrichment (simulated)")

            # Create entry for AI processing
            entry = {
                "url": url,
                "platform": platform,
                "type": scraped_data.get("type", "post"),
                "title": scraped_data.get("title", ""),
                "description": scraped_data.get("description", ""),
                "transcript": scraped_data.get("transcript"),
                "metadata": scraped_data.get("metadata", {}),
                "user_notes": "",
            }

            # Mock categories for testing
            mock_categories = [
                {"id": "1", "name": "For You"},
                {"id": "2", "name": "All"},
                {"id": "3", "name": "Favorites"},
                {"id": "4", "name": "Technology"},
                {"id": "5", "name": "Food"},
                {"id": "6", "name": "Travel"},
            ]

            print(f"   Entry prepared for AI enrichment")
            print(
                f"   Mock categories available: {[cat['name'] for cat in mock_categories]}"
            )

            # Note: We're not actually calling the AI here to avoid API costs
            # In real usage, this would call: ai_result = classify_entry(entry, mock_categories)
            print(f"   ✅ AI enrichment simulation completed")

            print(f"🎯 Pipeline test completed successfully!")

        except Exception as e:
            print(f"❌ Error in pipeline: {e}")
            import traceback

            traceback.print_exc()

    print(f"\n🎯 All pipeline tests completed!")


if __name__ == "__main__":
    test_complete_pipeline()
