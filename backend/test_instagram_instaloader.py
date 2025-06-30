#!/usr/bin/env python3
"""
Test script for the new Instaloader-based Instagram scraper.
Tests with real Instagram posts to verify data extraction.
"""

import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scrapers.instagram import InstagramScraper


def test_instagram_scraper():
    """Test the Instagram scraper with real Instagram posts."""

    # Test URLs - using more recent posts that are more likely to be accessible
    test_urls = [
        "https://www.instagram.com/p/C8QZQZQZQZQ/",  # Example recent post
        "https://www.instagram.com/reels/C8QZQZQZQZQ/",  # Example recent reel
    ]

    scraper = InstagramScraper()

    print("🧪 Testing New Instagram Scraper (Instaloader)")
    print("=" * 60)

    for i, url in enumerate(test_urls, 1):
        print(f"\n{i}. Testing URL: {url}")
        print("-" * 40)

        try:
            result = scraper.scrape(url)

            print(f"✅ Scraping completed!")
            print(f"📊 Results:")
            print(f"   Title: {result.get('title', 'N/A')}")
            print(f"   Type: {result.get('type', 'N/A')}")
            print(
                f"   Owner: @{result.get('posting_account', {}).get('username', 'N/A')}"
            )
            print(f"   Caption length: {len(result.get('description', ''))} chars")
            print(f"   Hashtags: {result.get('hashtags', [])}")
            print(f"   Mentions: {result.get('mentions', [])}")
            print(f"   Is carousel: {result.get('is_carousel', False)}")
            print(f"   Carousel count: {result.get('carousel_count', 0)}")
            print(f"   Media items: {len(result.get('media_content', []))}")
            print(f"   Thumbnail: {result.get('thumbnail', 'N/A')}")

            # Show posting account details
            account = result.get("posting_account", {})
            print(f"   📱 Account details:")
            print(f"     Username: @{account.get('username', 'N/A')}")
            print(f"     Full name: {account.get('full_name', 'N/A')}")
            print(f"     Verified: {account.get('verified', False)}")
            print(f"     Private: {account.get('private', False)}")
            print(f"     Followers: {account.get('followers', 'N/A')}")

            # Show metadata
            metadata = result.get("metadata", {})
            print(f"   📈 Engagement:")
            print(f"     Likes: {metadata.get('like_count', 'N/A')}")
            print(f"     Comments: {metadata.get('comment_count', 'N/A')}")
            print(f"     Views: {metadata.get('view_count', 'N/A')}")
            print(f"     Date: {metadata.get('upload_date', 'N/A')}")

            # Show media content details
            media_content = result.get("media_content", [])
            if media_content:
                print(f"   🖼️ Media content:")
                for j, media in enumerate(media_content):
                    print(f"     {j+1}. Type: {media.get('type', 'N/A')}")
                    print(f"        URL: {media.get('url', 'N/A')}")
                    if media.get("video_url"):
                        print(f"        Video URL: {media.get('video_url', 'N/A')}")
                    print(f"        Dimensions: {media.get('dimensions', 'N/A')}")

        except Exception as e:
            print(f"❌ Error testing {url}: {e}")
            import traceback

            traceback.print_exc()

    print(f"\n🎯 Testing completed!")


if __name__ == "__main__":
    test_instagram_scraper()
