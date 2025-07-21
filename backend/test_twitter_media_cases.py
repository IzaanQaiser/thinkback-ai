#!/usr/bin/env python3

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scrapers.twitter import TwitterScraper

def test_twitter_media_cases():
    """Test that Twitter posts use the correct media handling logic"""
    
    # Test cases with different media types
    test_cases = [
        {
            "name": "Text-only tweet (no media)",
            "url": "https://x.com/agazdecki/status/1591439614438699009",
            "expected": "no_media"
        },
        {
            "name": "Tweet with image",
            "url": "https://x.com/birdabo404/status/1946973582573109393",
            "expected": "image"
        },
        {
            "name": "Tweet with video",
            "url": "https://x.com/thinkback_ai/status/1947039951742210122",
            "expected": "video"
        }
    ]
    
    scraper = TwitterScraper()
    
    print(f"🧪 Testing Media Handling Logic")
    print("=" * 60)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n📋 Test {i}: {test_case['name']}")
        print(f"   URL: {test_case['url']}")
        print(f"   Expected: {test_case['expected']}")
        
        try:
            result = scraper.scrape(test_case['url'])
            
            print(f"   📊 Results:")
            print(f"      Title: {result.get('title', 'N/A')}")
            print(f"      Thumbnail: {result.get('thumbnail', 'N/A')}")
            print(f"      Video Count: {result.get('metadata', {}).get('video_count', 'N/A')}")
            print(f"      Image Count: {result.get('metadata', {}).get('image_count', 'N/A')}")
            
            # Check if the result matches expectations
            thumbnail = result.get('thumbnail')
            if test_case['expected'] == 'no_media':
                if not thumbnail:
                    print(f"   ✅ CORRECT: No media - using default X logo")
                else:
                    print(f"   ❌ INCORRECT: Expected no media but got thumbnail: {thumbnail}")
            elif test_case['expected'] == 'image':
                if thumbnail and '/media/' in thumbnail:
                    print(f"   ✅ CORRECT: Using media image as thumbnail")
                else:
                    print(f"   ❌ INCORRECT: Expected image but got: {thumbnail}")
            elif test_case['expected'] == 'video':
                if thumbnail and ('video.twimg.com' in thumbnail or 'pbs.twimg.com' in thumbnail):
                    print(f"   ✅ CORRECT: Using video thumbnail")
                else:
                    print(f"   ❌ INCORRECT: Expected video thumbnail but got: {thumbnail}")
                    
        except Exception as e:
            print(f"   ❌ ERROR: {e}")
    
    print(f"\n🎯 Testing Complete!")

if __name__ == "__main__":
    test_twitter_media_cases() 