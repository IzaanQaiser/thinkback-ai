#!/usr/bin/env python3
"""
Test Instagram scraper on the deployed Google Cloud service.
"""

import requests
import json
import time

def test_instagram_scraping_on_cloud():
    """Test Instagram scraping on the deployed service."""
    
    # Service URL
    service_url = "https://thinkback-backend-staging-738547429797.us-central1.run.app"
    
    # Test URLs
    test_urls = [
        'https://www.instagram.com/p/DL7g8cJOV74/',
        'https://www.instagram.com/p/DI061TPunJV/',
        'https://www.instagram.com/ashpeng_/reel/DMO7BDKxwx-/'
    ]
    
    print("🧪 Testing Instagram Scraper on Google Cloud")
    print("=" * 60)
    print(f"Service URL: {service_url}")
    print()
    
    for i, url in enumerate(test_urls, 1):
        print(f"{i}. Testing URL: {url}")
        print("-" * 40)
        
        try:
            # Test the enrich-entry endpoint
            payload = {
                "url": url,
                "user_notes": ""
            }
            
            print(f"   📤 Sending request to /api/enrich-entry...")
            response = requests.post(
                f"{service_url}/api/enrich-entry",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"   ✅ Request successful!")
                print(f"   📊 Response data:")
                
                # Check if we got scraped data
                scraped_data = result.get("scraped", {})
                if scraped_data:
                    print(f"     Title: {scraped_data.get('title', 'N/A')}")
                    print(f"     Description: {scraped_data.get('description', 'N/A')[:100]}...")
                    print(f"     Username: {scraped_data.get('posting_account', {}).get('username', 'N/A')}")
                    print(f"     Thumbnail: {scraped_data.get('thumbnail', 'N/A')}")
                    print(f"     Type: {scraped_data.get('type', 'N/A')}")
                    print(f"     Hashtags: {scraped_data.get('hashtags', [])}")
                    print(f"     Mentions: {scraped_data.get('mentions', [])}")
                    print(f"     Scraper used: {scraped_data.get('metadata', {}).get('scraper', 'N/A')}")
                else:
                    print(f"     ❌ No scraped data returned")
                
                # Check AI response
                ai_data = result.get("ai", {})
                if ai_data:
                    print(f"     AI Category: {ai_data.get('category', {}).get('name', 'N/A')}")
                    print(f"     AI Title: {ai_data.get('title', 'N/A')}")
                    print(f"     AI Tags: {ai_data.get('tags', [])}")
                
            else:
                print(f"   ❌ Request failed with status {response.status_code}")
                print(f"   Response: {response.text}")
                
        except requests.exceptions.Timeout:
            print(f"   ⏰ Request timed out")
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Request error: {e}")
        except Exception as e:
            print(f"   ❌ Unexpected error: {e}")
        
        print()
        time.sleep(2)  # Small delay between requests

if __name__ == "__main__":
    test_instagram_scraping_on_cloud() 