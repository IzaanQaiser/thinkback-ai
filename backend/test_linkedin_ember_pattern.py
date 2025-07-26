#!/usr/bin/env python3
"""
Test the new ember ID pattern implementation for LinkedIn scraping.
This test specifically validates the pattern where:
- Post media images have IDs: ember41, ember42, ember43
- Profile pictures have ID: ember35
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scrapers.linkedin import LinkedInScraper, extract_media_urls_requests
from bs4 import BeautifulSoup
import time


def test_ember_pattern_implementation():
    """Test the ember ID pattern implementation."""
    
    # Test URL that follows the pattern you mentioned
    test_url = "https://www.linkedin.com/posts/guptanikita16_the-reality-of-job-hunting-ghosting-rejections-activity-7354163514283868160-y9x2/?utm_source=share&utm_medium=member_desktop&rcm=ACoAAELybZwBaEFvtMCGd8k4fp7lK72M3wzt4II"
    
    print("🧪 Testing LinkedIn Ember ID Pattern Implementation")
    print("=" * 60)
    print(f"🔍 Test URL: {test_url}")
    print("-" * 40)
    
    scraper = LinkedInScraper()
    
    try:
        # Time the scraping
        start_time = time.time()
        result = scraper.scrape(test_url)
        end_time = time.time()
        
        print(f"⏱️  Scraping time: {end_time - start_time:.2f} seconds")
        
        if "error" in result:
            print(f"❌ Error: {result['error']}")
            return
        
        # Check the results
        print(f"📋 Title: {result.get('title', 'N/A')}")
        print(f"👤 Author: {result.get('channel', 'N/A')}")
        print(f"📝 Content Length: {len(result.get('description', ''))} characters")
        print(f"🖼️  Thumbnail: {result.get('thumbnail', 'N/A')}")
        print(f"🔧 Method Used: {result.get('metadata', {}).get('method', 'unknown')}")
        
        # Check if we got a thumbnail
        if result.get('thumbnail'):
            print("✅ SUCCESS: Got thumbnail using ember ID pattern!")
        else:
            print("⚠️  No thumbnail found - this might indicate the pattern didn't match")
        
        # Quality assessment
        has_content = len(result.get('description', '').strip()) > 20
        has_author = result.get('channel') and result.get('channel') != "Unknown Author"
        has_thumbnail = bool(result.get('thumbnail'))
        
        print(f"\n📊 Quality Assessment:")
        print(f"   ✅ Has content: {has_content}")
        print(f"   ✅ Has author: {has_author}")
        print(f"   ✅ Has thumbnail: {has_thumbnail}")
        
        if has_content and has_author and has_thumbnail:
            print("   🎉 EXCELLENT: Got content, author, and thumbnail!")
        elif has_content and has_author:
            print("   ✅ GOOD: Got content and author!")
        elif has_content or has_author:
            print("   ⚠️  PARTIAL: Got some data but not everything")
        else:
            print("   ❌ FAILURE: Got no meaningful data")
            
    except Exception as e:
        print(f"❌ Exception during scraping: {e}")
        import traceback
        traceback.print_exc()


def test_media_extraction_function():
    """Test the media extraction function directly with a sample HTML."""
    print("\n🔧 Testing Media Extraction Function Directly")
    print("=" * 50)
    
    # Sample HTML that includes the ember ID patterns
    sample_html = """
    <html>
    <body>
        <!-- Profile picture with ember35 -->
        <img id="ember35" src="https://example.com/profile.jpg" alt="Profile Picture">
        
        <!-- Post media with ember41 -->
        <img id="ember41" src="https://example.com/post-media.jpg" alt="Post Media">
        
        <!-- Another post media with ember42 -->
        <img id="ember42" src="https://example.com/post-media-2.jpg" alt="Post Media 2">
        
        <!-- Regular image without ember ID -->
        <img src="https://example.com/regular.jpg" alt="Regular Image">
    </body>
    </html>
    """
    
    soup = BeautifulSoup(sample_html, 'html.parser')
    
    try:
        media_urls = extract_media_urls_requests(soup)
        
        print(f"📊 Found {len(media_urls)} media items")
        
        for i, media in enumerate(media_urls, 1):
            print(f"   {i}. Type: {media.get('type')}")
            print(f"      URL: {media.get('url')}")
            print(f"      Priority: {media.get('priority')}")
            print(f"      Ember ID: {media.get('ember_id', 'None')}")
            print(f"      Is Profile Picture: {media.get('is_profile_picture', False)}")
            print()
        
        # Check if we found the expected ember ID media
        ember_media = [m for m in media_urls if m.get('ember_id')]
        if ember_media:
            print(f"✅ SUCCESS: Found {len(ember_media)} media items with ember IDs")
            for media in ember_media:
                print(f"   - {media.get('ember_id')}: {media.get('url')}")
        else:
            print("❌ FAILURE: No ember ID media found")
            
    except Exception as e:
        print(f"❌ Exception during media extraction: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    print("🚀 Starting LinkedIn Ember ID Pattern Tests")
    print("=" * 60)
    
    # Test the media extraction function first
    test_media_extraction_function()
    
    # Then test the full scraper
    test_ember_pattern_implementation()
    
    print("\n�� Tests completed!") 