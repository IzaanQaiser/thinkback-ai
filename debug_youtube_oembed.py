#!/usr/bin/env python3
"""
Debug script to investigate why oEmbed fails for specific YouTube videos
"""

import sys
import os
import requests
import json
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.scrapers.youtube import YouTubeScraper, extract_video_id

def test_oembed_directly(video_id):
    """Test oEmbed API directly with detailed debugging"""
    print(f"🔍 Testing oEmbed API directly for video ID: {video_id}")
    print("=" * 60)
    
    # Test different oEmbed URL formats
    test_urls = [
        f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json",
        f"https://www.youtube.com/oembed?url=https://youtu.be/{video_id}&format=json",
        f"https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v={video_id}",
    ]
    
    headers_variants = [
        {},
        {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'},
        {'User-Agent': 'ThinkBack-AI/1.0'},
        {'Accept': 'application/json'},
        {'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    ]
    
    for i, oembed_url in enumerate(test_urls):
        print(f"\n📡 Test {i+1}: {oembed_url}")
        
        for j, headers in enumerate(headers_variants):
            print(f"   Headers variant {j+1}: {headers}")
            try:
                response = requests.get(oembed_url, headers=headers, timeout=10)
                print(f"   Status: {response.status_code}")
                print(f"   Response headers: {dict(response.headers)}")
                
                if response.status_code == 200:
                    try:
                        data = response.json()
                        print(f"   ✅ SUCCESS! Title: {data.get('title', 'No title')}")
                        return True
                    except:
                        print(f"   ❌ Invalid JSON response")
                elif response.status_code == 401:
                    print(f"   ❌ 401 Unauthorized")
                elif response.status_code == 403:
                    print(f"   ❌ 403 Forbidden")
                elif response.status_code == 404:
                    print(f"   ❌ 404 Not Found")
                else:
                    print(f"   ❌ Error {response.status_code}")
                
                print(f"   Response content: {response.text[:200]}...")
                
            except Exception as e:
                print(f"   ❌ Exception: {str(e)}")
        
        print()
    
    return False

def test_video_accessibility(video_id):
    """Test if the video is actually accessible"""
    print(f"\n🌐 Testing video accessibility for: {video_id}")
    print("=" * 60)
    
    # Test different YouTube URLs
    test_urls = [
        f"https://www.youtube.com/watch?v={video_id}",
        f"https://youtu.be/{video_id}",
        f"https://www.youtube.com/embed/{video_id}",
    ]
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    for url in test_urls:
        print(f"\n📡 Testing: {url}")
        try:
            response = requests.get(url, headers=headers, timeout=10)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                content = response.text
                if '"isLiveContent":false' in content or '"isLiveContent":true' in content:
                    print("   ✅ Video page loads successfully")
                    
                    # Check for various indicators
                    if '"playabilityStatus":{"status":"OK"' in content:
                        print("   ✅ Playability status: OK")
                    elif '"playabilityStatus":{"status":"UNPLAYABLE"' in content:
                        print("   ❌ Playability status: UNPLAYABLE")
                        if '"reason":"' in content:
                            reason_start = content.find('"reason":"') + 10
                            reason_end = content.find('"', reason_start)
                            reason = content[reason_start:reason_end]
                            print(f"   Reason: {reason}")
                    
                    if '"isPrivate":true' in content:
                        print("   ❌ Video is marked as private")
                    elif '"isPrivate":false' in content:
                        print("   ✅ Video is public")
                    
                    if '"isUnlisted":true' in content:
                        print("   ⚠️ Video is unlisted")
                    elif '"isUnlisted":false' in content:
                        print("   ✅ Video is listed")
                        
                    # Check for age restrictions
                    if '"isContentRatingRequired":true' in content:
                        print("   ⚠️ Age verification required")
                    
                    # Check for embeddability
                    if '"isEmbeddable":false' in content:
                        print("   ❌ Video is not embeddable")
                    elif '"isEmbeddable":true' in content:
                        print("   ✅ Video is embeddable")
                else:
                    print("   ❌ Does not appear to be a valid video page")
            else:
                print(f"   ❌ HTTP Error: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Exception: {str(e)}")

def test_our_scraper(url):
    """Test our current scraper implementation"""
    print(f"\n🔧 Testing our current scraper with: {url}")
    print("=" * 60)
    
    scraper = YouTubeScraper()
    result = scraper.scrape(url)
    
    print("\n📊 SCRAPER RESULT:")
    print(json.dumps(result, indent=2))
    
    return result

if __name__ == "__main__":
    # The specific URL from the user
    test_url = "https://youtu.be/uQn3oi0SMbo?si=bOfl4fr1hNzJqOWq"
    video_id = extract_video_id(test_url)
    
    print("🚀 YouTube oEmbed Debug Investigation")
    print(f"🎯 Target URL: {test_url}")
    print(f"📹 Video ID: {video_id}")
    print()
    
    # Test 1: Check video accessibility
    test_video_accessibility(video_id)
    
    # Test 2: Test oEmbed API directly with various approaches
    oembed_success = test_oembed_directly(video_id)
    
    # Test 3: Test our scraper
    scraper_result = test_our_scraper(test_url)
    
    print("\n" + "=" * 80)
    print("📋 INVESTIGATION SUMMARY:")
    print(f"   oEmbed API working: {'✅ YES' if oembed_success else '❌ NO'}")
    print(f"   Our scraper working: {'✅ YES' if 'error' not in scraper_result else '❌ NO'}")
    print(f"   Fallback triggered: {'✅ YES' if scraper_result.get('metadata', {}).get('fallback_method') else '❌ NO'}")