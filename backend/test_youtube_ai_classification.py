#!/usr/bin/env python3
"""
Test script to verify YouTube content gets proper AI classification.
"""

import sys
import os
import requests
import json
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_youtube_ai_classification():
    """Test that YouTube content gets proper AI classification."""
    
    # Test URLs with different content types
    test_cases = [
        {
            "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "description": "Rick Roll - Music video",
            "expected_category": "Music"
        },
        {
            "url": "https://www.youtube.com/watch?v=9bZkp7q19f0", 
            "description": "PSY - GANGNAM STYLE - Music video",
            "expected_category": "Music"
        },
        {
            "url": "https://www.youtube.com/watch?v=btvTfNk9-Uk",
            "description": "Portfolio Tips for Social Media Managers - Business/Education",
            "expected_category": "Business" or "Education"
        }
    ]
    
    print("🧪 Testing YouTube AI Classification")
    print("=" * 50)
    
    for i, test_case in enumerate(test_cases, 1):
        url = test_case["url"]
        description = test_case["description"]
        expected_category = test_case["expected_category"]
        
        print(f"\n🔍 Test {i}: {description}")
        print(f"📺 URL: {url}")
        print("-" * 30)
        
        try:
            # Test the API endpoint
            response = requests.post(
                "http://localhost:8000/api/scrape",
                json={"url": url},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ API Success!")
                print(f"   Title: {data.get('title', 'N/A')}")
                print(f"   Channel: {data.get('channel', 'N/A')}")
                print(f"   Platform: {data.get('platform', 'N/A')}")
                
                # Now test the AI classification by creating a mock entry
                from ai import classify_entry
                
                mock_entry = {
                    "id": f"test-{i}",
                    "url": url,
                    "platform": data.get('platform', 'YouTube Video'),
                    "title": data.get('title', ''),
                    "channel": data.get('channel', ''),
                    "type": data.get('type', 'video'),
                    "thumbnail": data.get('thumbnail', ''),
                    "metadata": data.get('metadata', {}),
                    "categories": [
                        {"id": "1", "name": "Music"},
                        {"id": "2", "name": "Business"},
                        {"id": "3", "name": "Education"},
                        {"id": "4", "name": "Entertainment"},
                        {"id": "5", "name": "Technology"}
                    ]
                }
                
                ai_result = classify_entry(mock_entry, mock_entry["categories"])
                
                print(f"🤖 AI Classification Results:")
                print(f"   Category: {ai_result.get('category', {}).get('name', 'N/A')}")
                print(f"   Title: {ai_result.get('title', 'N/A')}")
                print(f"   Tags: {ai_result.get('tags', [])}")
                print(f"   Summary: {'Present' if ai_result.get('summary') else 'Absent (Expected for YouTube)'}")
                
                # Check if category is not "General"
                category_name = ai_result.get('category', {}).get('name', '')
                if category_name and category_name.lower() != 'general':
                    print(f"   ✅ Category is not 'General': {category_name}")
                else:
                    print(f"   ❌ Category is 'General' or empty")
                    
            else:
                print(f"❌ API Failed: {response.status_code}")
                print(f"   Response: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("⚠️ API server not running - skipping test")
            break
        except Exception as e:
            print(f"❌ Exception: {str(e)}")
    
    print("\n" + "=" * 50)
    print("🎉 AI Classification testing completed!")

if __name__ == "__main__":
    test_youtube_ai_classification() 