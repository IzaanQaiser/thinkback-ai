#!/usr/bin/env python3
"""
Test script for the specific LinkedIn post that's having issues.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scrapers.linkedin import LinkedInScraper, extract_author_name, extract_media_urls, get_best_thumbnail
from bs4 import BeautifulSoup
import requests


def test_specific_linkedin_post():
    """Test the specific LinkedIn post that's having issues."""
    
    # The specific URL from the logs
    test_url = "https://www.linkedin.com/posts/uwaterloocoopcee_mycoopexperience-engineering-uwaterloocoop-activity-7354193725566189568-eIZQ?utm_source=social_share_send&utm_medium=member_desktop_web&rcm=ACoAADQElOMBnfGIRfLNrVt0fZlIlM4S1yRGilI"
    
    print("🧪 Testing Specific LinkedIn Post")
    print("=" * 50)
    print(f"URL: {test_url}")
    
    # Set up headers to mimic a real browser
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
    }
    
    try:
        print("🔄 Fetching LinkedIn post...")
        response = requests.get(test_url, headers=headers, timeout=15)
        response.raise_for_status()
        
        print(f"   ✅ Response status: {response.status_code}")
        print(f"   📄 Content length: {len(response.text)} characters")
        
        # Parse HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Test author extraction
        print("\n👤 Testing Author Extraction:")
        author_name = extract_author_name(soup)
        print(f"   Author: {author_name}")
        
        # Test media extraction
        print("\n🖼️ Testing Media Extraction:")
        media_urls = extract_media_urls(soup)
        print(f"   Found {len(media_urls)} media items")
        
        for i, media in enumerate(media_urls):
            print(f"   {i+1}. Type: {media['type']}, Priority: {media.get('priority', 'unknown')}")
            print(f"      URL: {media['url']}")
            print(f"      Alt: {media['alt']}")
        
        # Test thumbnail selection
        print("\n🖼️ Testing Thumbnail Selection:")
        print(f"   🔍 Checking URL pattern: {'uwaterloocoopcee_mycoopexperience-engineering-uwaterloocoop-activity-7354193725566189568' in test_url}")
        thumbnail = get_best_thumbnail(media_urls, test_url)
        print(f"   Selected thumbnail: {thumbnail}")
        
        # Look for the specific image URL mentioned
        target_image = "https://media.licdn.com/dms/image/v2/D4E10AQH30DC9ZNFLkg/image-shrink_800/B4EZg9YKkFGoAg-/0/1753376402351?e=1754067600&v=beta&t=GTBdz-GOgfGvellKAeSGMDoFfxDJsh8sBy88XyrBwQA"
        print(f"\n🎯 Looking for target image: {target_image}")
        
        # Search for this specific image in the HTML
        if target_image in response.text:
            print("   ✅ Target image found in HTML!")
        else:
            print("   ❌ Target image not found in HTML")
            
            # Look for similar patterns
            similar_images = []
            for img in soup.find_all('img'):
                src = img.get('src') or img.get('data-src')
                if src and 'D4E10AQH30DC9ZNFLkg' in src:
                    similar_images.append(src)
            
            if similar_images:
                print(f"   🔍 Found {len(similar_images)} similar images:")
                for img in similar_images:
                    print(f"      {img}")
            else:
                print("   🔍 No similar images found")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False


if __name__ == "__main__":
    test_specific_linkedin_post() 