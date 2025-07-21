#!/usr/bin/env python3

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import asyncio
from playwright.async_api import async_playwright

async def debug_video_tweet():
    """Debug video thumbnail extraction for the specific tweet."""
    url = "https://x.com/thinkback_ai/status/1947039951742210122"

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        await page.set_extra_http_headers(
            {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        )

        print(f"🌐 Loading: {url}")
        await page.goto(url, wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(5000)

        print("\n🔍 DEBUGGING VIDEO CONTENT:")
        print("=" * 50)

        # Check for video elements
        video_elements = await page.query_selector_all(
            '[data-testid="videoPlayer"], video, [data-testid="video"]'
        )
        print(f"🎥 Video elements found: {len(video_elements)}")

        for i, video in enumerate(video_elements):
            print(f"\nVideo Element {i+1}:")
            try:
                # Check poster attribute
                poster = await video.get_attribute("poster")
                print(f"  Poster: {poster}")
                
                # Check for images within video
                img = await video.query_selector("img")
                if img:
                    src = await img.get_attribute("src")
                    print(f"  Image src: {src}")
                
                # Check video attributes
                src_attr = await video.get_attribute("src")
                print(f"  Video src: {src_attr}")
                
            except Exception as e:
                print(f"  Error: {e}")

        # Check for video thumbnails in the page
        video_thumbnails = await page.query_selector_all(
            'img[src*="video.twimg.com"], img[src*="pbs.twimg.com"]'
        )
        print(f"\n🎥 Video thumbnails found: {len(video_thumbnails)}")
        
        for i, thumb in enumerate(video_thumbnails):
            try:
                src = await thumb.get_attribute("src")
                alt = await thumb.get_attribute("alt") or ""
                print(f"\nThumbnail {i+1}:")
                print(f"  Src: {src}")
                print(f"  Alt: {alt}")
            except Exception as e:
                print(f"  Error: {e}")

        # Get all images to see what's available
        all_images = await page.query_selector_all("img")
        print(f"\n📸 All images found: {len(all_images)}")
        
        for i, img in enumerate(all_images):
            try:
                src = await img.get_attribute("src")
                alt = await img.get_attribute("alt") or ""
                if src and "twimg.com" in src:
                    print(f"\nImage {i+1}: {src}")
                    print(f"  Alt: {alt}")
            except Exception as e:
                print(f"  Error: {e}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(debug_video_tweet()) 