#!/usr/bin/env python3
"""
Test the hybrid LinkedIn scraper with multiple URLs.
Tests timing and success rates for different types of LinkedIn posts.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scrapers.linkedin import LinkedInScraper
import time
import json


def test_multiple_linkedin_urls():
    """Test the hybrid LinkedIn scraper with multiple URLs."""
    
    # Test URLs from the user
    test_urls = [
        {
            "url": "https://www.linkedin.com/posts/tessawhelan_recruiting-hiring-candidateexperience-activity-7354115331570733056-_ca6?utm_source=share&utm_medium=member_desktop&rcm=ACoAAELybZwBaEFvtMCGd8k4fp7lK72M3wzt4II",
            "description": "Tessa Whelan - Recruiting/Hiring Post"
        },
        {
            "url": "https://www.linkedin.com/posts/best-entrepreneurship-advice-on-linkedin_i-love-this-leadership-quote-brilliant-activity-7354087480691736577-Wl9_?utm_source=share&utm_medium=member_desktop&rcm=ACoAAELybZwBaEFvtMCGd8k4fp7lK72M3wzt4II",
            "description": "Best Entrepreneurship Advice - Leadership Quote"
        },
        {
            "url": "https://www.linkedin.com/posts/femalequotient_big-move-from-uber-the-rideshare-app-announced-activity-7354235905483624449-hiRv?utm_source=share&utm_medium=member_desktop&rcm=ACoAAELybZwBaEFvtMCGd8k4fp7lK72M3wzt4II",
            "description": "The Female Quotient - Uber Feature Post"
        },
        {
            "url": "https://www.linkedin.com/posts/cvanvlack_an-age-old-piece-of-advice-is-when-youre-activity-7354119373822812162-xpwU?utm_source=share&utm_medium=member_desktop&rcm=ACoAAELybZwBaEFvtMCGd8k4fp7lK72M3wzt4II",
            "description": "Cvanvlack - Age-old Advice Post"
        }
    ]
    
    scraper = LinkedInScraper()
    
    print("🧪 Testing LinkedIn Hybrid Scraper with Multiple URLs")
    print("=" * 70)
    
    results = []
    
    for i, test_case in enumerate(test_urls, 1):
        url = test_case["url"]
        description = test_case["description"]
        
        print(f"\n🔍 Test {i}: {description}")
        print(f"   URL: {url}")
        print("-" * 50)
        
        try:
            # Time the scraping
            start_time = time.time()
            result = scraper.scrape(url)
            end_time = time.time()
            
            scraping_time = end_time - start_time
            
            print(f"⏱️  Scraping time: {scraping_time:.2f} seconds")
            
            if "error" in result:
                print(f"❌ Error: {result['error']}")
                results.append({
                    "test": i,
                    "description": description,
                    "url": url,
                    "success": False,
                    "time": scraping_time,
                    "error": result["error"]
                })
                continue
            
            # Extract key data
            title = result.get('title', 'N/A')
            author = result.get('channel', 'N/A')
            content_length = len(result.get('description', ''))
            thumbnail = result.get('thumbnail', 'N/A')
            method = result.get('metadata', {}).get('method', 'unknown')
            
            print(f"📋 Title: {title[:100]}...")
            print(f"👤 Author: {author}")
            print(f"📝 Content Length: {content_length} characters")
            print(f"🖼️  Thumbnail: {'✅ Found' if thumbnail else '❌ Not found'}")
            print(f"🔧 Method Used: {method}")
            
            # Quality assessment
            has_content = content_length > 20
            has_author = author != "Unknown Author"
            has_thumbnail = bool(thumbnail)
            
            print(f"\n📊 Quality Assessment:")
            print(f"   ✅ Has content: {has_content} ({content_length} chars)")
            print(f"   ✅ Has author: {has_author} ({author})")
            print(f"   ✅ Has thumbnail: {has_thumbnail}")
            
            if has_content and has_author:
                print("   🎉 SUCCESS: Got both content and author!")
                success_status = "SUCCESS"
            elif has_content or has_author:
                print("   ⚠️  PARTIAL: Got some data but not everything")
                success_status = "PARTIAL"
            else:
                print("   ❌ FAILURE: Got no meaningful data")
                success_status = "FAILURE"
            
            results.append({
                "test": i,
                "description": description,
                "url": url,
                "success": True,
                "time": scraping_time,
                "method": method,
                "title": title,
                "author": author,
                "content_length": content_length,
                "has_thumbnail": has_thumbnail,
                "quality_status": success_status
            })
                
        except Exception as e:
            print(f"❌ Exception during scraping: {e}")
            results.append({
                "test": i,
                "description": description,
                "url": url,
                "success": False,
                "time": 0,
                "error": str(e)
            })
    
    # Summary
    print(f"\n📊 SUMMARY RESULTS")
    print("=" * 70)
    
    successful_tests = [r for r in results if r["success"]]
    failed_tests = [r for r in results if not r["success"]]
    
    print(f"✅ Successful: {len(successful_tests)}/{len(results)}")
    print(f"❌ Failed: {len(failed_tests)}/{len(results)}")
    
    if successful_tests:
        avg_time = sum(r["time"] for r in successful_tests) / len(successful_tests)
        print(f"⏱️  Average time (successful): {avg_time:.2f} seconds")
        
        methods_used = {}
        for r in successful_tests:
            method = r.get("method", "unknown")
            methods_used[method] = methods_used.get(method, 0) + 1
        
        print(f"🔧 Methods used:")
        for method, count in methods_used.items():
            print(f"   - {method}: {count} times")
    
    print(f"\n📋 Detailed Results:")
    for result in results:
        status = "✅" if result["success"] else "❌"
        print(f"   {status} Test {result['test']}: {result['description']}")
        if result["success"]:
            print(f"      Time: {result['time']:.2f}s | Method: {result['method']} | Quality: {result['quality_status']}")
        else:
            print(f"      Error: {result.get('error', 'Unknown error')}")
    
    return results


if __name__ == "__main__":
    print("🚀 Starting LinkedIn Multiple URLs Test")
    print("=" * 70)
    
    results = test_multiple_linkedin_urls()
    
    print(f"\n🏁 Test completed! Processed {len(results)} URLs.") 