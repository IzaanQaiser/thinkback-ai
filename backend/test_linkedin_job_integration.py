#!/usr/bin/env python3
"""
Test LinkedIn job scraping integration with the API.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scrapers.linkedin import LinkedInScraper
from scraper_factory import get_scraper

def detect_platform(url: str) -> str:
    """Detect platform from URL."""
    url = url.lower()
    if (
        "youtube.com/shorts/" in url
        or "youtu.be/" in url
        and "?feature=share" in url
    ):
        return "YouTube Shorts"
    if "youtube.com/watch?v=" in url or "youtu.be/" in url:
        return "YouTube Video"
    if "/reels/" in url or "/reel/" in url:
        return "Instagram Reel"
    if "/p/" in url and "instagram.com" in url:
        return "Instagram Post"
    if "linkedin.com/feed/update/" in url or "linkedin.com/posts/" in url:
        return "LinkedIn Post"
    if "linkedin.com/jobs/view/" in url or "linkedin.com/jobs/collections/" in url:
        return "LinkedIn Job"
    if "reddit.com/r/" in url and "/comments/" in url:
        return "Reddit Post"
    if "tiktok.com/" in url:
        return "TikTok Video"
    if "twitter.com/" in url or "x.com/" in url:
        return "Twitter/X Post"
    return "Unknown"

def test_job_platform_detection():
    """Test that job URLs are properly detected by the platform detection."""
    print("🧪 Testing job platform detection...")
    
    job_url = "https://www.linkedin.com/jobs/collections/recommended/?currentJobId=4244908441"
    platform = detect_platform(job_url)
    
    print(f"  URL: {job_url}")
    print(f"  Detected Platform: {platform}")
    print(f"  Expected: LinkedIn Job")
    print(f"  ✅ Success: {platform == 'LinkedIn Job'}")
    
    return platform == 'LinkedIn Job'

def test_scraper_factory():
    """Test that the scraper factory returns the correct scraper for jobs."""
    print("🧪 Testing scraper factory...")
    
    platform = "LinkedIn Job"
    scraper = get_scraper(platform)
    
    print(f"  Platform: {platform}")
    print(f"  Scraper Type: {type(scraper).__name__}")
    print(f"  Expected: LinkedInScraper")
    print(f"  ✅ Success: {isinstance(scraper, LinkedInScraper)}")
    
    return isinstance(scraper, LinkedInScraper)

def test_job_scraping_integration():
    """Test the complete job scraping integration."""
    print("🧪 Testing job scraping integration...")
    
    job_url = "https://www.linkedin.com/jobs/collections/recommended/?currentJobId=4244908441"
    
    # Test platform detection
    platform = detect_platform(job_url)
    if platform != "LinkedIn Job":
        print(f"  ❌ Platform detection failed: {platform}")
        return False
    
    # Test scraper factory
    scraper = get_scraper(platform)
    if not isinstance(scraper, LinkedInScraper):
        print(f"  ❌ Scraper factory failed")
        return False
    
    # Test scraping
    result = scraper.scrape(job_url)
    
    print("📊 Integration Test Results:")
    print(f"  Success: {'error' not in result}")
    
    if 'error' in result:
        print(f"  Error: {result['error']}")
        return False
    else:
        print(f"  Title: {result.get('title', 'N/A')}")
        print(f"  Channel: {result.get('channel', 'N/A')}")
        print(f"  Description: {result.get('description', 'N/A')}")
        print(f"  Thumbnail: {result.get('thumbnail', 'N/A')}")
        print(f"  Type: {result.get('type', 'N/A')}")
        
        metadata = result.get('metadata', {})
        print(f"  Company Name: {metadata.get('company_name', 'N/A')}")
        print(f"  Position Title: {metadata.get('position_title', 'N/A')}")
        print(f"  Company Logo: {metadata.get('company_logo', 'N/A')}")
        
        # Check that we got the required data
        has_company = metadata.get('company_name') and metadata.get('company_name') != "Unknown Company"
        has_title = metadata.get('position_title') and metadata.get('position_title') != "Unknown Position"
        has_logo = bool(metadata.get('company_logo'))
        
        print(f"  ✅ Has Company: {has_company}")
        print(f"  ✅ Has Title: {has_title}")
        print(f"  ✅ Has Logo: {has_logo}")
        
        return has_company and has_title

if __name__ == "__main__":
    print("🚀 Starting LinkedIn Job Integration Tests\n")
    
    success = True
    
    success &= test_job_platform_detection()
    print()
    
    success &= test_scraper_factory()
    print()
    
    success &= test_job_scraping_integration()
    print()
    
    if success:
        print("🎉 All integration tests passed!")
    else:
        print("❌ Some integration tests failed.") 