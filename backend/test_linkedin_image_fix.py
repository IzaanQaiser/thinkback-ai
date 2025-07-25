#!/usr/bin/env python3
"""
Test the image selection fix for the Female Quotient LinkedIn post.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scrapers.linkedin import LinkedInScraper, extract_media_urls_requests, get_best_thumbnail
from bs4 import BeautifulSoup
import requests
import time


def test_female_quotient_image_fix():
    """Test the image selection fix for the Female Quotient post."""
    
    url = "https://www.linkedin.com/posts/femalequotient_big-move-from-uber-the-rideshare-app-announced-activity-7354235905483624449-hiRv?utm_source=share&utm_medium=member_desktop&rcm=ACoAAELybZwBaEFvtMCGd8k4fp7lK72M3wzt4II"
    
    print("🧪 Testing Image Selection Fix for Female Quotient Post")
    print("=" * 60)
    
    # Test the full scraper
    print("🔍 Testing full scraper...")
    scraper = LinkedInScraper()
    
    start_time = time.time()
    result = scraper.scrape(url)
    end_time = time.time()
    
    print(f"⏱️  Scraping time: {end_time - start_time:.2f} seconds")
    
    if "error" in result:
        print(f"❌ Error: {result['error']}")
        return
    
    print(f"📋 Title: {result.get('title', 'N/A')}")
    print(f"👤 Author: {result.get('channel', 'N/A')}")
    print(f"📝 Content Length: {len(result.get('description', ''))} characters")
    print(f"🖼️  Thumbnail: {result.get('thumbnail', 'N/A')}")
    print(f"🔧 Method Used: {result.get('metadata', {}).get('method', 'unknown')}")
    
    # Test the image extraction specifically
    print(f"\n🔍 Testing image extraction specifically...")
    from scrapers.linkedin import create_session
    
    session = create_session()
    response = session.get(url, timeout=15)
    response.raise_for_status()
    
    soup = BeautifulSoup(response.text, 'html.parser')
    media_urls = extract_media_urls_requests(soup)
    
    print(f"📊 Found {len(media_urls)} media items:")
    for i, media in enumerate(media_urls):
        priority = media.get('priority', 'unknown')
        url_short = media['url'][:80] + "..." if len(media['url']) > 80 else media['url']
        print(f"   {i+1}. Priority: {priority} | URL: {url_short}")
    
    # Test the thumbnail selection
    thumbnail = get_best_thumbnail(media_urls, url)
    print(f"\n🎯 Selected thumbnail: {thumbnail}")
    
    # Check if it's the correct image (should contain 'feedshare' or 'article-cover')
    if 'feedshare' in thumbnail.lower() or 'article-cover' in thumbnail.lower():
        print("✅ SUCCESS: Selected the correct main post image!")
    else:
        print("❌ FAILURE: Still selected the wrong image")
        print("   Expected: feedshare or article-cover image")
        print(f"   Got: {thumbnail}")


if __name__ == "__main__":
    test_female_quotient_image_fix() 