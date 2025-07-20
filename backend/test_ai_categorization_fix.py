#!/usr/bin/env python3

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ai import classify_entry

def test_startup_categorization():
    """Test that startup content gets categorized as 'Startups' not 'Entrepreneurship'"""
    
    # Mock the entry data (what we'd get from scraping)
    entry = {
        "url": "https://x.com/agazdecki/status/1591439614438699009",
        "platform": "Twitter/X Post",
        "type": "post",
        "title": "Before you build a startup write down… 1. The customer 2. Their problems 3. Current solutions 4. Your solution 5. Why now 6. Why you",
        "description": "Twitter: @agazdecki",
        "transcript": "",
        "metadata": {"view_count": 1234, "like_count": 567, "comment_count": 89},
        "user_notes": "Important startup advice",
        "thumbnail": "https://pbs.twimg.com/media/...",
        "channel": "@agazdecki"
    }
    
    # Mock existing categories (including "Startups")
    categories = [
        {"id": "cat1", "name": "Startups"},
        {"id": "cat2", "name": "Entrepreneurship"},
        {"id": "cat3", "name": "Technology"},
        {"id": "cat4", "name": "Business"}
    ]
    
    print("🧪 Testing AI categorization fix...")
    print(f"   Entry title: {entry['title']}")
    print(f"   Available categories: {[cat['name'] for cat in categories]}")
    print()
    
    # Call the AI classification
    result = classify_entry(entry, categories)
    
    print("📊 Results:")
    print(f"   Category: {result.get('category', {})}")
    print(f"   Title: {result.get('title', 'N/A')}")
    print(f"   Tags: {result.get('tags', [])}")
    print()
    
    # Check if it chose "Startups" (the correct choice)
    category_name = result.get('category', {}).get('name', '')
    if category_name == 'Startups':
        print("✅ SUCCESS: AI correctly chose 'Startups' category!")
        return True
    else:
        print(f"❌ FAILED: AI chose '{category_name}' instead of 'Startups'")
        return False

if __name__ == "__main__":
    success = test_startup_categorization()
    sys.exit(0 if success else 1) 