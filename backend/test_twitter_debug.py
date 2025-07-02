#!/usr/bin/env python3
"""
Debug script to see what images are available on Twitter pages.
"""

import asyncio
from playwright.async_api import async_playwright


async def debug_twitter_page():
    """Debug what's actually on the Twitter page."""
    url = "https://x.com/cfc_sant0s/status/1940060631295570195"

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

        print("\n🔍 DEBUGGING PAGE CONTENT:")
        print("=" * 50)

        # Get all images on the page
        all_images = await page.query_selector_all("img")
        print(f"📸 Total images found: {len(all_images)}")

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
    asyncio.run(debug_twitter_page())
