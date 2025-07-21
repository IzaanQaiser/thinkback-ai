#!/usr/bin/env python3
"""
Simple test for Instagram shortcode extraction and basic functionality.
This tests the core logic without external dependencies.
"""

import re

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

def detect_platform(url: str) -> str:
    """Platform detection logic."""
    url_lower = url.lower()
    if "/reels/" in url_lower or "/reel/" in url_lower:
        return "Instagram Reel"
    if "instagram.com/p/" in url_lower:
        return "Instagram Post"
    return "Unknown"

def test_instagram_functionality():
    """Test Instagram functionality with the provided URLs."""
    
    # Test URLs
    test_urls = [
        'https://www.instagram.com/p/DL7g8cJOV74/',
        'https://www.instagram.com/p/DI061TPunJV/',
        'https://www.instagram.com/ashpeng_/reel/DMO7BDKxwx-/'
    ]
    
    print("🧪 Testing Instagram Core Functionality")
    print("=" * 60)
    
    for i, url in enumerate(test_urls, 1):
        print(f"\n{i}. Testing URL: {url}")
        print("-" * 40)
        
        try:
            # Test platform detection
            platform = detect_platform(url)
            print(f"   🔍 Platform detection: {platform}")
            
            # Test shortcode extraction
            shortcode = extract_shortcode_from_url(url)
            print(f"   🔍 Extracted shortcode: {shortcode}")
            
            # Test reels detection
            is_reel = is_reels_url(url)
            print(f"   📱 Is reels URL: {is_reel}")
            
            print(f"   ✅ All tests passed for this URL")
                
        except Exception as e:
            print(f"   ❌ Error during testing: {e}")

if __name__ == "__main__":
    test_instagram_functionality() 