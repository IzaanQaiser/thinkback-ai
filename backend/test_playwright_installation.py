#!/usr/bin/env python3
"""
Test script to verify Playwright installation in the container.
This script should be run during the build process to ensure browsers are properly installed.
"""

import asyncio
import sys
from playwright.async_api import async_playwright


async def test_playwright():
    """Test that Playwright can launch a browser and load a simple page."""
    try:
        print("🔧 Testing Playwright installation...")
        
        async with async_playwright() as p:
            print("✅ Playwright context created successfully")
            
            # Launch browser with container-optimized arguments
            browser = await p.chromium.launch(
                headless=True,
                args=[
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            )
            print("✅ Browser launched successfully")
            
            # Create a new page
            page = await browser.new_page()
            print("✅ Page created successfully")
            
            # Navigate to a simple page
            await page.goto("https://example.com", timeout=10000)
            print("✅ Page loaded successfully")
            
            # Get page title
            title = await page.title()
            print(f"✅ Page title: {title}")
            
            # Close browser
            await browser.close()
            print("✅ Browser closed successfully")
            
            print("🎉 Playwright installation test passed!")
            return True
            
    except Exception as e:
        print(f"❌ Playwright test failed: {e}")
        return False


if __name__ == "__main__":
    success = asyncio.run(test_playwright())
    sys.exit(0 if success else 1) 