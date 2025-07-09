#!/usr/bin/env python3
"""
Comprehensive test script for YouTube scraper with multiple URLs.
Tests various YouTube content types and URL formats.
"""

import sys
import os
import requests
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_multiple_youtube_urls():
    """Test the YouTube scraper with various URLs."""
    
    # Test URLs - different types of YouTube content
    test_urls = [
        {
            "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "description": "Rick Roll - Classic video"
        },
        {
            "url": "https://youtu.be/dQw4w9WgXcQ",
            "description": "Rick Roll - Shortened URL"
        },
        {
            "url": "https://www.youtube.com/shorts/dQw4w9WgXcQ",
            "description": "Rick Roll - Shorts format"
        },
        {
            "url": "https://www.youtube.com/watch?v=9bZkp7q19f0",
            "description": "PSY - GANGNAM STYLE"
        },
        {
            "url": "https://www.youtube.com/watch?v=jNQXAC9IVRw",
            "description": "Me at the zoo - First YouTube video"
        },
        {
            "url": "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
            "description": "Luis Fonsi - Despacito"
        }
    ]
    
    print("🧪 Testing YouTube Scraper with Multiple URLs")
    print("=" * 60)
    
    success_count = 0
    total_count = len(test_urls)
    
    for i, test_case in enumerate(test_urls, 1):
        url = test_case["url"]
        description = test_case["description"]
        
        print(f"\n🔍 Test {i}/{total_count}: {description}")
        print(f"📺 URL: {url}")
        print("-" * 40)
        
        try:
            # Test direct scraper
            from scrapers.youtube import YouTubeScraper
            scraper = YouTubeScraper()
            result = scraper.scrape(url)
            
            if "error" in result:
                print(f"❌ Error: {result['error']}")
            else:
                success_count += 1
                print(f"✅ Success!")
                print(f"   Title: {result.get('title', 'N/A')}")
                print(f"   Channel: {result.get('channel', 'N/A')}")
                print(f"   Type: {result.get('type', 'N/A')}")
                print(f"   Thumbnail: {'✅' if result.get('thumbnail') else '❌'}")
                
                # Test API endpoint if server is running
                try:
                    api_response = requests.post(
                        "http://localhost:8000/api/scrape",
                        json={"url": url},
                        timeout=10
                    )
                    
                    if api_response.status_code == 200:
                        api_data = api_response.json()
                        print(f"   API: ✅ (Title: {api_data.get('title', 'N/A')})")
                    else:
                        print(f"   API: ❌ ({api_response.status_code})")
                        
                except requests.exceptions.ConnectionError:
                    print(f"   API: ⚠️ (Server not running)")
                except Exception as e:
                    print(f"   API: ❌ ({str(e)})")
                
        except Exception as e:
            print(f"❌ Exception: {str(e)}")
    
    print(f"\n" + "=" * 60)
    print(f"📊 Results Summary:")
    print(f"   Total tests: {total_count}")
    print(f"   Successful: {success_count}")
    print(f"   Failed: {total_count - success_count}")
    print(f"   Success rate: {(success_count/total_count)*100:.1f}%")
    print(f"🎉 Testing completed!")

if __name__ == "__main__":
    test_multiple_youtube_urls() 