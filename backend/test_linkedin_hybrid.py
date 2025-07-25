#!/usr/bin/env python3
"""
Test the new hybrid LinkedIn scraper.
Tests both requests and Selenium fallback approaches.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scrapers.linkedin import LinkedInScraper
import time


def test_linkedin_hybrid_scraper():
    """Test the hybrid LinkedIn scraper with various URLs."""
    
    # Test URLs - different types of LinkedIn posts
    test_urls = [
        # Original test URL
        "https://www.linkedin.com/posts/kevin-wang-558a6a329_kevin-on-instagram-someone-give-me-an-internship-activity-7354180489252913153-3sJ6?utm_source=social_share_send&utm_medium=member_desktop_web&rcm=ACoAADQElOMBnfGIRfLNrVt0fZlIlM4S1yRGilI",
        
        # Another test URL (you can add more here)
        "https://www.linkedin.com/posts/uwaterloocoopcee_mycoopexperience-engineering-uwaterloocoop-activity-7354193725566189568",
    ]
    
    scraper = LinkedInScraper()
    
    print("🧪 Testing LinkedIn Hybrid Scraper")
    print("=" * 60)
    
    for i, url in enumerate(test_urls, 1):
        print(f"\n🔍 Test {i}: {url}")
        print("-" * 40)
        
        try:
            # Time the scraping
            start_time = time.time()
            result = scraper.scrape(url)
            end_time = time.time()
            
            print(f"⏱️  Scraping time: {end_time - start_time:.2f} seconds")
            
            if "error" in result:
                print(f"❌ Error: {result['error']}")
                continue
            
            # Check the 3 core requirements
            print(f"📋 Title: {result.get('title', 'N/A')}")
            print(f"👤 Author: {result.get('channel', 'N/A')}")
            print(f"📝 Content Length: {len(result.get('description', ''))} characters")
            print(f"🖼️  Thumbnail: {result.get('thumbnail', 'N/A')}")
            print(f"🔧 Method Used: {result.get('metadata', {}).get('method', 'unknown')}")
            
            # Quality assessment
            has_content = len(result.get('description', '').strip()) > 20
            has_author = result.get('channel') and result.get('channel') != "Unknown Author"
            has_thumbnail = bool(result.get('thumbnail'))
            
            print(f"\n📊 Quality Assessment:")
            print(f"   ✅ Has content: {has_content}")
            print(f"   ✅ Has author: {has_author}")
            print(f"   ✅ Has thumbnail: {has_thumbnail}")
            
            if has_content and has_author:
                print("   🎉 SUCCESS: Got both content and author!")
            elif has_content or has_author:
                print("   ⚠️  PARTIAL: Got some data but not everything")
            else:
                print("   ❌ FAILURE: Got no meaningful data")
                
        except Exception as e:
            print(f"❌ Exception during scraping: {e}")
            import traceback
            traceback.print_exc()


def test_selenium_fallback():
    """Test Selenium fallback specifically."""
    print("\n🤖 Testing Selenium Fallback")
    print("=" * 40)
    
    from scrapers.linkedin import extract_with_selenium
    
    test_url = "https://www.linkedin.com/posts/kevin-wang-558a6a329_kevin-on-instagram-someone-give-me-an-internship-activity-7354180489252913153-3sJ6?utm_source=social_share_send&utm_medium=member_desktop_web&rcm=ACoAADQElOMBnfGIRfLNrVt0fZlIlM4S1yRGilI"
    
    try:
        start_time = time.time()
        result = extract_with_selenium(test_url)
        end_time = time.time()
        
        print(f"⏱️  Selenium time: {end_time - start_time:.2f} seconds")
        
        if "error" in result:
            print(f"❌ Selenium error: {result['error']}")
        else:
            print(f"✅ Selenium success!")
            print(f"   📋 Title: {result.get('title', 'N/A')}")
            print(f"   👤 Author: {result.get('channel', 'N/A')}")
            print(f"   📝 Content: {result.get('description', 'N/A')[:100]}...")
            print(f"   🖼️  Thumbnail: {result.get('thumbnail', 'N/A')}")
            
    except Exception as e:
        print(f"❌ Selenium test exception: {e}")
        import traceback
        traceback.print_exc()


def test_requests_only():
    """Test requests approach only."""
    print("\n🌐 Testing Requests-Only Approach")
    print("=" * 40)
    
    from scrapers.linkedin import create_session, extract_author_name_requests, extract_post_content_requests, extract_media_urls_requests, get_best_thumbnail
    from bs4 import BeautifulSoup
    import requests
    
    test_url = "https://www.linkedin.com/posts/kevin-wang-558a6a329_kevin-on-instagram-someone-give-me-an-internship-activity-7354180489252913153-3sJ6?utm_source=social_share_send&utm_medium=member_desktop_web&rcm=ACoAADQElOMBnfGIRfLNrVt0fZlIlM4S1yRGilI"
    
    try:
        session = create_session()
        response = session.get(test_url, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        author_name = extract_author_name_requests(soup)
        post_content = extract_post_content_requests(soup)
        media_urls = extract_media_urls_requests(soup)
        thumbnail = get_best_thumbnail(media_urls, test_url)
        
        print(f"✅ Requests approach results:")
        print(f"   👤 Author: {author_name}")
        print(f"   📝 Content: {post_content[:100]}...")
        print(f"   🖼️  Thumbnail: {thumbnail}")
        print(f"   📸 Media count: {len(media_urls)}")
        
    except Exception as e:
        print(f"❌ Requests test exception: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    print("🚀 Starting LinkedIn Hybrid Scraper Tests")
    print("=" * 60)
    
    # Test the main hybrid scraper
    test_linkedin_hybrid_scraper()
    
    # Test individual components
    test_requests_only()
    test_selenium_fallback()
    
    print("\n🏁 All tests completed!") 