#!/usr/bin/env python3
"""
Test script to verify title selection logic for Twitter/X posts.
This tests that scraped tweet content is prioritized over AI-generated titles.
"""

def is_nonsense_title(title, platform=None):
    """Test version of the is_nonsense_title function."""
    if not title or not title.strip():
        return True
    t = title.strip().lower()
    generic_titles = [
        "untitled",
        "video",
        "instagram reel",
        "tiktok",
        "placeholder",
        "reel",
        "shorts",
        "youtube shorts",
        "watch",
        "no title",
        "",
        None,
    ]
    # Add platform-specific generic titles
    if platform:
        if platform.lower() == "youtube shorts":
            generic_titles += ["shorts", "youtube shorts"]
        if platform.lower() == "instagram reel":
            generic_titles += ["instagram reel", "reel"]
        if platform.lower() == "instagram post":
            generic_titles += ["instagram post", "post", "instagram"]
        if platform.lower() == "tiktok video":
            generic_titles += ["tiktok", "video"]
        # For Twitter/X posts, only consider "post" as generic if it's the entire title
        if platform.lower() == "twitter/x post":
            # Don't add "post" to generic titles for Twitter - actual tweet content is valuable
            pass
    # If title is just a URL
    if t.startswith("http://") or t.startswith("https://"):
        return True
    # If title is too short or matches generic
    if t in generic_titles or len(t) < 3:
        return True
    return False


def test_title_selection():
    """Test the title selection logic for Twitter/X posts."""
    print("🧪 Testing title selection logic for Twitter/X posts...")
    
    # Test cases
    test_cases = [
        {
            "platform": "Twitter/X Post",
            "scraped_title": "Before you build a startup write down… 1. The customer 2. Their problems 3. Current solutions 4. You",
            "ai_title": "Startup Foundation Tips",
            "expected": "scraped"
        },
        {
            "platform": "Twitter/X Post", 
            "scraped_title": "Just posted about AI trends",
            "ai_title": "AI Discussion",
            "expected": "scraped"
        },
        {
            "platform": "Twitter/X Post",
            "scraped_title": "",
            "ai_title": "Tech News",
            "expected": "ai"
        },
        {
            "platform": "Instagram Post",
            "scraped_title": "Beautiful sunset",
            "ai_title": "Nature Photography",
            "expected": "scraped"
        }
    ]
    
    for i, case in enumerate(test_cases, 1):
        print(f"\n🔍 Test case {i}:")
        print(f"   Platform: {case['platform']}")
        print(f"   Scraped title: {case['scraped_title']}")
        print(f"   AI title: {case['ai_title']}")
        
        # Simulate the title selection logic
        platform = case['platform']
        scraped_title = case['scraped_title']
        ai_title = case['ai_title']
        
        final_title = ai_title
        selected_source = "ai"
        
        # For Instagram, use the caption as the title if present
        if platform and platform.lower() in ["instagram post", "instagram reel"]:
            if scraped_title and scraped_title.strip():
                final_title = scraped_title.strip()
                selected_source = "scraped"
                print(f"   📝 Using Instagram caption as title: {final_title}")
            else:
                print(f"   📝 No caption found, using AI-generated title: {final_title}")
        # For Twitter/X posts, prioritize the scraped title (actual tweet content)
        elif platform and platform.lower() in ["twitter/x post"]:
            if scraped_title and scraped_title.strip():
                final_title = scraped_title.strip()
                selected_source = "scraped"
                print(f"   📝 Using Twitter/X scraped title: {final_title}")
            else:
                print(f"   📝 No scraped title found, using AI-generated title: {final_title}")
        elif scraped_title and not is_nonsense_title(scraped_title, platform):
            final_title = scraped_title
            selected_source = "scraped"
            print(f"   📝 Using scraped title: {final_title}")
        else:
            print(f"   📝 Using AI-generated title: {final_title}")
        
        # Check if the result matches expected
        if selected_source == case['expected']:
            print(f"   ✅ PASS: Selected {selected_source} title as expected")
        else:
            print(f"   ❌ FAIL: Expected {case['expected']} but got {selected_source}")
        
        print(f"   📝 Final title: {final_title}")
    
    print("\n🎉 Title selection tests completed!")


if __name__ == "__main__":
    test_title_selection() 