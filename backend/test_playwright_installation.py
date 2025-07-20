#!/usr/bin/env python3
"""
Test script to verify Playwright installation in the container.
This script should be run during the build process to ensure browsers are properly installed.
"""

import asyncio
import sys
import os
import subprocess
from playwright.async_api import async_playwright


def check_playwright_installation():
    """Check if Playwright is properly installed."""
    try:
        import playwright
        print(f"✅ Playwright package version: {playwright.__version__}")
        return True
    except ImportError as e:
        print(f"❌ Playwright package not found: {e}")
        return False


def check_browser_installation():
    """Check if browsers are installed."""
    try:
        # Check if playwright browsers are installed
        result = subprocess.run(
            ["playwright", "install", "--dry-run", "chromium"],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            print("✅ Playwright browsers appear to be installed")
            return True
        else:
            print(f"❌ Playwright browsers not found: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Error checking browser installation: {e}")
        return False


async def test_playwright():
    """Test that Playwright can launch a browser and load a simple page."""
    try:
        print("🔧 Testing Playwright installation...")
        
        # Check package installation
        if not check_playwright_installation():
            return False
            
        # Check browser installation
        if not check_browser_installation():
            print("⚠️ Browser installation check failed, but continuing with test...")
        
        async with async_playwright() as p:
            print("✅ Playwright context created successfully")
            
            # Try to launch browser with container-optimized arguments
            try:
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
                print("✅ Chromium browser launched successfully")
                browser_type = "chromium"
            except Exception as chromium_error:
                print(f"❌ Chromium launch failed: {chromium_error}")
                
                # Try Firefox as fallback
                try:
                    browser = await p.firefox.launch(headless=True)
                    print("✅ Firefox browser launched successfully")
                    browser_type = "firefox"
                except Exception as firefox_error:
                    print(f"❌ Firefox launch also failed: {firefox_error}")
                    return False
            
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
            
            print(f"🎉 Playwright installation test passed with {browser_type}!")
            return True
            
    except Exception as e:
        print(f"❌ Playwright test failed: {e}")
        return False


if __name__ == "__main__":
    print("🔍 Starting Playwright installation test...")
    success = asyncio.run(test_playwright())
    if success:
        print("✅ All Playwright tests passed!")
        sys.exit(0)
    else:
        print("❌ Playwright tests failed!")
        sys.exit(1) 