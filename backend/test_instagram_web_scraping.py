#!/usr/bin/env python3
"""
Test script for Instagram web scraping functionality.
This tests the fallback web scraping method that doesn't require instaloader.
"""

import sys
import os
import re
import requests
from bs4 import BeautifulSoup

def extract_shortcode_from_url(url: str):
    """Extract the shortcode from an Instagram URL."""
    url_lower = url.lower()
    patterns = ['/p/', '/reels/', '/reel/', '/tv/']
    
    for pattern in patterns:
        if pattern in url_lower:
            parts = url_lower.split(pattern)
            if len(parts) > 1:
                shortcode = parts[1].split('/')[0].split('?')[0]
                if shortcode:
                    original_parts = url.split(pattern)
                    if len(original_parts) > 1:
                        original_shortcode = original_parts[1].split('/')[0].split('?')[0]
                        return original_shortcode
                    return shortcode
    return None

def is_reels_url(url: str) -> bool:
    """Check if the URL is an Instagram Reels URL."""
    url_lower = url.lower()
    return "/reels/" in url_lower or "/reel/" in url_lower

def scrape_instagram_web(url: str):
    """Scrape Instagram using web scraping (no instaloader required)."""
    print(f"   🔧 Using web scraping...")
    
    try:
        # Set up headers to mimic a browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        
        print(f"   📥 Fetching Instagram page...")
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract basic information from meta tags
        title = None
        description = None
        thumbnail = None
        
        # Try to get title from meta tags
        og_title = soup.find('meta', property='og:title')
        if og_title:
            title = og_title.get('content', '')
        
        # Try to get description from meta tags
        og_description = soup.find('meta', property='og:description')
        if og_description:
            description = og_description.get('content', '')
        
        # Try to get thumbnail from meta tags
        og_image = soup.find('meta', property='og:image')
        if og_image:
            thumbnail = og_image.get('content', '')
        
        # Extract shortcode for metadata
        shortcode = extract_shortcode_from_url(url)
        content_type = "reel" if is_reels_url(url) else "post"
        
        # Extract hashtags from description if available
        hashtags = []
        if description:
            hashtag_pattern = r'#(\w+)'
            hashtags = re.findall(hashtag_pattern, description)
        
        # Extract mentions from description if available
        mentions = []
        if description:
            mention_pattern = r'@(\w+)'
            mentions = re.findall(mention_pattern, description)
        
        print(f"   ✅ Web scraping completed")
        print(f"   📊 Extracted data:")
        print(f"     Title: {title}")
        print(f"     Description length: {len(description) if description else 0} chars")
        print(f"     Hashtags: {hashtags}")
        print(f"     Mentions: {mentions}")
        
        return {
            "url": url,
            "title": title or f"Instagram {content_type.title()}",
            "description": description or "",
            "type": content_type,
            "metadata": {
                "shortcode": shortcode,
                "webpage_url": url,
                "scraper": "web_scraping",
                "extracted_title": bool(title),
                "extracted_description": bool(description),
                "extracted_thumbnail": bool(thumbnail),
            },
            "transcript": None,
            "thumbnail": thumbnail,
            "hashtags": hashtags,
            "mentions": mentions,
            "is_carousel": False,
            "carousel_count": 0,
            "posting_account": {
                "username": "unknown",
                "full_name": None,
                "profile_pic": None,
                "verified": False,
                "private": False,
                "followers": None,
                "following": None,
            },
            "media_content": [],
        }
        
    except Exception as e:
        print(f"   ❌ Web scraping failed: {e}")
        return None

def test_instagram_scraping():
    """Test Instagram scraping with the provided URLs."""
    
    # Test URLs
    test_urls = [
        'https://www.instagram.com/p/DL7g8cJOV74/',
        'https://www.instagram.com/p/DI061TPunJV/'
    ]
    
    print("🧪 Testing Instagram Web Scraping")
    print("=" * 60)
    
    for i, url in enumerate(test_urls, 1):
        print(f"\n{i}. Testing URL: {url}")
        print("-" * 40)
        
        try:
            # Test shortcode extraction
            shortcode = extract_shortcode_from_url(url)
            print(f"   🔍 Extracted shortcode: {shortcode}")
            
            # Test web scraping
            result = scrape_instagram_web(url)
            
            if result:
                print(f"   ✅ Scraping successful!")
                print(f"   📊 Results:")
                print(f"     Title: {result.get('title', 'N/A')}")
                print(f"     Description: {result.get('description', 'N/A')[:100]}...")
                print(f"     Username: {result.get('posting_account', {}).get('username', 'N/A')}")
                print(f"     Thumbnail: {result.get('thumbnail', 'N/A')}")
                print(f"     Type: {result.get('type', 'N/A')}")
                print(f"     Hashtags: {result.get('hashtags', [])}")
                print(f"     Mentions: {result.get('mentions', [])}")
            else:
                print(f"   ❌ Scraping failed - no result returned")
                
        except Exception as e:
            print(f"   ❌ Error during scraping: {e}")

if __name__ == "__main__":
    test_instagram_scraping() 