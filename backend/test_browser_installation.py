#!/usr/bin/env python3
"""
Simple test to verify Playwright browser installation in container.
"""

import asyncio
import sys
import subprocess
import os
from playwright.async_api import async_playwright


async def test_browser_installation():
    """Test that Playwright can launch a browser."""
    try:
        print("🔧 Testing browser installation...")
        
        # Check if playwright command exists
        try:
            result = subprocess.run(["playwright", "--version"], capture_output=True, text=True)
            print(f"✅ Playwright CLI version: {result.stdout.strip()}")
        except Exception as e:
            print(f"❌ Playwright CLI not found: {e}")
            return False
        
        # Check browser installation
        try:
            result = subprocess.run(["playwright", "install", "--dry-run", "chromium"], capture_output=True, text=True)
            if result.returncode == 0:
                print("✅ Chromium browser is installed")
            else:
                print(f"❌ Chromium browser not found: {result.stderr}")
                return False
        except Exception as e:
            print(f"❌ Error checking browser installation: {e}")
            return False
        
        # Test browser launch
        async with async_playwright() as p:
            print("✅ Playwright context created")
            
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
            
            page = await browser.new_page()
            print("✅ Page created successfully")
            
            # Test with a simple HTML page instead of external URL
            html_content = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>Test Page</title>
            </head>
            <body>
                <h1>Browser Test</h1>
                <p>This is a test page for Playwright browser installation.</p>
            </body>
            </html>
            """
            
            # Set content directly instead of navigating to external URL
            await page.set_content(html_content)
            print("✅ Page content set successfully")
            
            # Get page title
            title = await page.title()
            print(f"✅ Page title: {title}")
            
            # Test that we can get text content
            text_content = await page.text_content("body")
            if "Browser Test" in text_content:
                print("✅ Page content verified successfully")
            else:
                print("❌ Page content verification failed")
                return False
            
            # Close browser
            await browser.close()
            print("✅ Browser closed successfully")
            
            print("🎉 Browser installation test passed!")
            return True
            
    except Exception as e:
        print(f"❌ Browser test failed: {e}")
        return False


if __name__ == "__main__":
    print("🔍 Starting browser installation test...")
    success = asyncio.run(test_browser_installation())
    sys.exit(0 if success else 1) 