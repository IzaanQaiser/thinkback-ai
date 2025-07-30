#!/usr/bin/env python3
"""
Comprehensive test script to test all scrapers and identify issues.
"""

import asyncio
import sys
import os
from typing import Dict, Any
import time

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from scrapers.instagram import InstagramScraper
from scrapers.twitter import TwitterScraper
from scrapers.youtube import YouTubeScraper
from scrapers.linkedin import LinkedInScraper
from scrapers.reddit import RedditScraper
from scrapers.tiktok import TikTokScraper


def test_scraper(scraper_name: str, scraper_instance, test_urls: list) -> Dict[str, Any]:
    """Test a specific scraper with multiple URLs."""
    print(f"\n{'='*60}")
    print(f"🧪 Testing {scraper_name} Scraper")
    print(f"{'='*60}")
    
    results = {
        "scraper": scraper_name,
        "total_tests": len(test_urls),
        "successful": 0,
        "failed": 0,
        "results": []
    }
    
    for i, url in enumerate(test_urls, 1):
        print(f"\n📝 Test {i}/{len(test_urls)}: {url}")
        print(f"   🔗 URL: {url}")
        
        try:
            start_time = time.time()
            result = scraper_instance.scrape(url)
            end_time = time.time()
            
            duration = end_time - start_time
            
            # Check if scraping was successful
            if result and result.get("title") and result.get("title") != "None":
                print(f"   ✅ SUCCESS ({duration:.2f}s)")
                print(f"   📄 Title: {result.get('title', 'N/A')}")
                description = result.get('description', 'N/A')
                if description and description != 'N/A':
                    print(f"   📝 Description: {description[:100]}...")
                else:
                    print(f"   📝 Description: {description}")
                print(f"   🏷️ Type: {result.get('type', 'N/A')}")
                
                results["successful"] += 1
                results["results"].append({
                    "url": url,
                    "status": "success",
                    "duration": duration,
                    "title": result.get("title"),
                    "description_length": len(result.get("description", "")) if result.get("description") else 0,
                    "type": result.get("type")
                })
            else:
                print(f"   ❌ FAILED ({duration:.2f}s) - No meaningful data extracted")
                print(f"   📄 Title: {result.get('title', 'N/A')}")
                print(f"   📝 Description: {result.get('description', 'N/A')}")
                
                results["failed"] += 1
                results["results"].append({
                    "url": url,
                    "status": "failed",
                    "duration": duration,
                    "title": result.get("title"),
                    "description_length": len(result.get("description", "")) if result.get("description") else 0,
                    "type": result.get("type"),
                    "error": "No meaningful data extracted"
                })
                
        except Exception as e:
            print(f"   💥 ERROR ({time.time() - start_time:.2f}s): {str(e)}")
            results["failed"] += 1
            results["results"].append({
                "url": url,
                "status": "error",
                "duration": time.time() - start_time,
                "error": str(e)
            })
    
    # Print summary
    print(f"\n📊 {scraper_name} Summary:")
    print(f"   ✅ Successful: {results['successful']}/{results['total_tests']}")
    print(f"   ❌ Failed: {results['failed']}/{results['total_tests']}")
    print(f"   📈 Success Rate: {(results['successful']/results['total_tests']*100):.1f}%")
    
    return results


def main():
    """Main test function."""
    print("🚀 Starting Comprehensive Scraper Test")
    print("=" * 60)
    
    # Test URLs for each platform
    test_urls = {
        "Instagram": [
            "https://www.instagram.com/p/C8QZQZQZQZQ/",  # Example post
            "https://www.instagram.com/reels/C8QZQZQZQZQ/",  # Example reel
        ],
        "Twitter": [
            "https://x.com/agazdecki/status/1591439614438699009",  # Real tweet
            "https://twitter.com/elonmusk/status/1234567890123456789",  # Example tweet
        ],
        "YouTube": [
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ",  # Rick Roll
            "https://youtu.be/dQw4w9WgXcQ",  # Short URL
        ],
        "LinkedIn": [
            "https://www.linkedin.com/posts/activity-1234567890123456789",  # Example post
        ],
        "Reddit": [
            "https://www.reddit.com/r/Python/comments/1234567/example_post/",  # Example post
        ],
        "TikTok": [
            "https://www.tiktok.com/@username/video/1234567890123456789",  # Example video
        ]
    }
    
    # Initialize scrapers
    scrapers = {
        "Instagram": InstagramScraper(),
        "Twitter": TwitterScraper(),
        "YouTube": YouTubeScraper(),
        "LinkedIn": LinkedInScraper(),
        "Reddit": RedditScraper(),
        "TikTok": TikTokScraper(),
    }
    
    all_results = []
    
    # Test each scraper
    for scraper_name, scraper_instance in scrapers.items():
        try:
            result = test_scraper(scraper_name, scraper_instance, test_urls[scraper_name])
            all_results.append(result)
        except Exception as e:
            print(f"💥 Failed to initialize {scraper_name} scraper: {e}")
            all_results.append({
                "scraper": scraper_name,
                "total_tests": 0,
                "successful": 0,
                "failed": 0,
                "error": str(e)
            })
    
    # Print overall summary
    print(f"\n{'='*60}")
    print("📊 OVERALL TEST SUMMARY")
    print(f"{'='*60}")
    
    total_tests = sum(r.get("total_tests", 0) for r in all_results)
    total_successful = sum(r.get("successful", 0) for r in all_results)
    total_failed = sum(r.get("failed", 0) for r in all_results)
    
    print(f"📈 Total Tests: {total_tests}")
    print(f"✅ Total Successful: {total_successful}")
    print(f"❌ Total Failed: {total_failed}")
    print(f"🎯 Overall Success Rate: {(total_successful/total_tests*100):.1f}%" if total_tests > 0 else "🎯 No tests run")
    
    print(f"\n📋 Detailed Results:")
    for result in all_results:
        if "error" in result:
            print(f"   ❌ {result['scraper']}: {result['error']}")
        else:
            success_rate = (result['successful']/result['total_tests']*100) if result['total_tests'] > 0 else 0
            print(f"   {'✅' if success_rate > 50 else '⚠️' if success_rate > 0 else '❌'} {result['scraper']}: {result['successful']}/{result['total_tests']} ({success_rate:.1f}%)")
    
    # Identify broken scrapers
    broken_scrapers = []
    for result in all_results:
        if "error" in result or result.get("successful", 0) == 0:
            broken_scrapers.append(result["scraper"])
    
    if broken_scrapers:
        print(f"\n🚨 BROKEN SCRAPERS:")
        for scraper in broken_scrapers:
            print(f"   ❌ {scraper}")
    else:
        print(f"\n🎉 All scrapers are working!")
    
    return all_results


if __name__ == "__main__":
    main() 