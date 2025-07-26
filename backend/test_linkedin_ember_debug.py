#!/usr/bin/env python3
"""
Debug test to examine actual LinkedIn HTML structure and find ember IDs.
This will help us understand if the ember ID pattern is consistent.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scrapers.linkedin import create_session, extract_media_urls_requests
from bs4 import BeautifulSoup
import requests
import time


def debug_linkedin_html_structure():
    """Debug the actual HTML structure of LinkedIn posts."""
    
    # Test URL
    test_url = "https://www.linkedin.com/posts/guptanikita16_the-reality-of-job-hunting-ghosting-rejections-activity-7354163514283868160-y9x2/?utm_source=share&utm_medium=member_desktop&rcm=ACoAAELybZwBaEFvtMCGd8k4fp7lK72M3wzt4II"
    
    print("🔍 Debugging LinkedIn HTML Structure")
    print("=" * 50)
    print(f"🔗 URL: {test_url}")
    print("-" * 50)
    
    try:
        # Create session and get the page
        session = create_session()
        time.sleep(2)  # Add delay
        
        response = session.get(test_url, timeout=15)
        response.raise_for_status()
        
        print(f"✅ Response status: {response.status_code}")
        print(f"📄 Content length: {len(response.text)} characters")
        
        # Parse HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Look for all img elements with ember IDs
        print("\n🔍 Searching for all img elements with ember IDs...")
        all_images = soup.find_all('img')
        ember_images = []
        
        for img in all_images:
            img_id = img.get('id', '')
            if img_id and 'ember' in img_id:
                src = img.get('src') or img.get('data-src') or img.get('data-lazy-src') or img.get('data-delayed-url')
                ember_images.append({
                    'id': img_id,
                    'src': src,
                    'alt': img.get('alt', ''),
                    'class': img.get('class', [])
                })
        
        print(f"📊 Found {len(ember_images)} images with ember IDs:")
        for img in ember_images:
            print(f"   - ID: {img['id']}")
            print(f"     Src: {img['src'][:100] if img['src'] else 'None'}...")
            print(f"     Alt: {img['alt']}")
            print(f"     Class: {img['class']}")
            print()
        
        # Check for specific ember IDs we're looking for
        target_ember_ids = ['ember35', 'ember41', 'ember42', 'ember43']
        found_target_ids = []
        
        for img in ember_images:
            if img['id'] in target_ember_ids:
                found_target_ids.append(img)
        
        print(f"🎯 Found {len(found_target_ids)} images with our target ember IDs:")
        for img in found_target_ids:
            print(f"   - {img['id']}: {img['src'][:100] if img['src'] else 'None'}...")
        
        # Also check for any ember IDs that might be close to our targets
        print(f"\n🔍 All ember IDs found:")
        all_ember_ids = sorted(list(set(img['id'] for img in ember_images)))
        for ember_id in all_ember_ids:
            print(f"   - {ember_id}")
        
        # Test our media extraction function
        print(f"\n🧪 Testing our media extraction function...")
        media_urls = extract_media_urls_requests(soup)
        
        print(f"📊 Media extraction found {len(media_urls)} items:")
        for i, media in enumerate(media_urls, 1):
            print(f"   {i}. Type: {media.get('type')}")
            print(f"      URL: {media.get('url', '')[:100]}...")
            print(f"      Priority: {media.get('priority')}")
            print(f"      Ember ID: {media.get('ember_id', 'None')}")
            print(f"      Is Profile Picture: {media.get('is_profile_picture', False)}")
            print()
        
        # Check if we found any ember ID media
        ember_media = [m for m in media_urls if m.get('ember_id')]
        if ember_media:
            print(f"✅ SUCCESS: Found {len(ember_media)} media items with ember IDs")
        else:
            print("❌ No ember ID media found by our function")
            
    except Exception as e:
        print(f"❌ Exception during debugging: {e}")
        import traceback
        traceback.print_exc()


def test_multiple_linkedin_urls():
    """Test multiple LinkedIn URLs to see if ember ID patterns are consistent."""
    
    test_urls = [
        "https://www.linkedin.com/posts/guptanikita16_the-reality-of-job-hunting-ghosting-rejections-activity-7354163514283868160-y9x2/?utm_source=share&utm_medium=member_desktop&rcm=ACoAAELybZwBaEFvtMCGd8k4fp7lK72M3wzt4II",
        # Add more URLs here if you have them
    ]
    
    print("\n🧪 Testing Multiple LinkedIn URLs")
    print("=" * 40)
    
    for i, url in enumerate(test_urls, 1):
        print(f"\n🔍 Test {i}: {url}")
        print("-" * 30)
        
        try:
            session = create_session()
            time.sleep(2)
            
            response = session.get(url, timeout=15)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Look for ember IDs
            all_images = soup.find_all('img')
            ember_images = [img for img in all_images if img.get('id', '').startswith('ember')]
            
            print(f"📊 Found {len(ember_images)} images with ember IDs")
            
            # Show unique ember IDs
            ember_ids = sorted(list(set(img.get('id') for img in ember_images)))
            print(f"🔍 Unique ember IDs: {ember_ids}")
            
            # Test our function
            media_urls = extract_media_urls_requests(soup)
            ember_media = [m for m in media_urls if m.get('ember_id')]
            
            if ember_media:
                print(f"✅ Found {len(ember_media)} ember ID media items")
            else:
                print("❌ No ember ID media found")
                
        except Exception as e:
            print(f"❌ Error: {e}")


if __name__ == "__main__":
    print("🚀 Starting LinkedIn Ember ID Debug Tests")
    print("=" * 60)
    
    debug_linkedin_html_structure()
    test_multiple_linkedin_urls()
    
    print("\n🏁 Debug tests completed!") 