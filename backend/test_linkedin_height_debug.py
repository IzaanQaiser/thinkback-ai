#!/usr/bin/env python3
"""
Debug test to examine actual LinkedIn HTML structure and find images with height attributes.
This will help us understand if the height-based pattern is effective.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scrapers.linkedin import create_session, extract_media_urls_requests
from bs4 import BeautifulSoup
import requests
import time


def debug_linkedin_height_structure():
    """Debug the actual HTML structure of LinkedIn posts for height attributes."""
    
    # Test URL
    test_url = "https://www.linkedin.com/posts/guptanikita16_the-reality-of-job-hunting-ghosting-rejections-activity-7354163514283868160-y9x2/?utm_source=share&utm_medium=member_desktop&rcm=ACoAAELybZwBaEFvtMCGd8k4fp7lK72M3wzt4II"
    
    print("🔍 Debugging LinkedIn HTML Structure for Height Attributes")
    print("=" * 60)
    print(f"🔗 URL: {test_url}")
    print("-" * 60)
    
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
        
        # Look for all img elements with height attributes
        print("\n🔍 Searching for all img elements with height attributes...")
        all_images = soup.find_all('img')
        height_images = []
        
        for img in all_images:
            height = img.get('height')
            width = img.get('width')
            src = img.get('src') or img.get('data-src') or img.get('data-lazy-src') or img.get('data-delayed-url')
            
            if height:
                try:
                    height_px = int(height)
                    width_px = int(width) if width else None
                    
                    height_images.append({
                        'height': height_px,
                        'width': width_px,
                        'src': src,
                        'alt': img.get('alt', ''),
                        'id': img.get('id', ''),
                        'class': img.get('class', [])
                    })
                except (ValueError, TypeError):
                    continue
        
        print(f"📊 Found {len(height_images)} images with height attributes:")
        
        # Sort by height
        height_images.sort(key=lambda x: x['height'], reverse=True)
        
        for i, img in enumerate(height_images, 1):
            print(f"   {i}. Height: {img['height']}px")
            if img['width']:
                print(f"      Width: {img['width']}px")
            print(f"      Src: {img['src'][:100] if img['src'] else 'None'}...")
            print(f"      Alt: {img['alt']}")
            print(f"      ID: {img['id']}")
            print(f"      Class: {img['class']}")
            print()
        
        # Check for images with height > 60px
        large_images = [img for img in height_images if img['height'] > 60]
        print(f"🎯 Found {len(large_images)} images with height > 60px:")
        for img in large_images:
            print(f"   - Height {img['height']}px: {img['src'][:100] if img['src'] else 'None'}...")
        
        # Test our media extraction function
        print(f"\n🧪 Testing our media extraction function...")
        media_urls = extract_media_urls_requests(soup)
        
        print(f"📊 Media extraction found {len(media_urls)} items:")
        for i, media in enumerate(media_urls, 1):
            print(f"   {i}. Type: {media.get('type')}")
            print(f"      URL: {media.get('url', '')[:100]}...")
            print(f"      Priority: {media.get('priority')}")
            print(f"      Height: {media.get('height', 'None')}px")
            print(f"      Width: {media.get('width', 'None')}")
            print(f"      Is Post Media: {media.get('is_post_media', False)}")
            print(f"      Ember ID: {media.get('ember_id', 'None')}")
            print(f"      Is Profile Picture: {media.get('is_profile_picture', False)}")
            print()
        
        # Check if we found any height-based media
        height_media = [m for m in media_urls if m.get('is_post_media')]
        if height_media:
            print(f"✅ SUCCESS: Found {len(height_media)} media items with height > 60px")
            for media in height_media:
                print(f"   - Height {media.get('height')}px: {media.get('url')}")
        else:
            print("❌ No height-based media found by our function")
            
    except Exception as e:
        print(f"❌ Exception during debugging: {e}")
        import traceback
        traceback.print_exc()


def test_height_distribution():
    """Test the distribution of image heights in LinkedIn posts."""
    
    test_url = "https://www.linkedin.com/posts/guptanikita16_the-reality-of-job-hunting-ghosting-rejections-activity-7354163514283868160-y9x2/?utm_source=share&utm_medium=member_desktop&rcm=ACoAAELybZwBaEFvtMCGd8k4fp7lK72M3wzt4II"
    
    print("\n📊 Testing Height Distribution")
    print("=" * 40)
    
    try:
        session = create_session()
        time.sleep(2)
        
        response = session.get(test_url, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        all_images = soup.find_all('img')
        
        height_distribution = {}
        total_with_height = 0
        
        for img in all_images:
            height = img.get('height')
            if height:
                try:
                    height_px = int(height)
                    total_with_height += 1
                    
                    # Group by height ranges
                    if height_px <= 50:
                        range_key = "≤50px"
                    elif height_px <= 100:
                        range_key = "51-100px"
                    elif height_px <= 200:
                        range_key = "101-200px"
                    elif height_px <= 400:
                        range_key = "201-400px"
                    else:
                        range_key = ">400px"
                    
                    height_distribution[range_key] = height_distribution.get(range_key, 0) + 1
                    
                except (ValueError, TypeError):
                    continue
        
        print(f"📊 Height distribution of {total_with_height} images with height attributes:")
        for range_key in sorted(height_distribution.keys(), key=lambda x: int(x.split('-')[0]) if '-' in x else (0 if x == "≤50px" else 1000)):
            count = height_distribution[range_key]
            percentage = (count / total_with_height * 100) if total_with_height > 0 else 0
            print(f"   {range_key}: {count} images ({percentage:.1f}%)")
        
        # Check how many would be considered post media (>60px)
        post_media_candidates = sum(count for range_key, count in height_distribution.items() 
                                  if range_key != "≤50px")
        print(f"\n🎯 Images that would be considered post media (>60px): {post_media_candidates}")
        
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    print("🚀 Starting LinkedIn Height Attribute Debug Tests")
    print("=" * 60)
    
    debug_linkedin_height_structure()
    test_height_distribution()
    
    print("\n🏁 Debug tests completed!") 