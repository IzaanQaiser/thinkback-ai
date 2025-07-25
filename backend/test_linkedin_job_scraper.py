#!/usr/bin/env python3
"""
Test LinkedIn job scraping functionality.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scrapers.linkedin import LinkedInScraper, is_job_url, extract_job_id

def test_job_url_detection():
    """Test job URL detection."""
    print("🧪 Testing job URL detection...")
    
    job_urls = [
        "https://www.linkedin.com/jobs/collections/recommended/?currentJobId=4244908441",
        "https://www.linkedin.com/jobs/view/software-engineer-123456789",
        "https://linkedin.com/jobs/view/data-scientist-987654321",
    ]
    
    non_job_urls = [
        "https://www.linkedin.com/posts/john-doe_activity-123456789",
        "https://www.linkedin.com/feed/update/urn:li:activity:123456789",
        "https://www.linkedin.com/posts/jane-smith-activity-987654321",
    ]
    
    for url in job_urls:
        is_job = is_job_url(url)
        job_id = extract_job_id(url)
        print(f"  ✅ Job URL: {url}")
        print(f"     Is job: {is_job}")
        print(f"     Job ID: {job_id}")
    
    for url in non_job_urls:
        is_job = is_job_url(url)
        print(f"  ❌ Non-job URL: {url}")
        print(f"     Is job: {is_job}")
    
    print("✅ Job URL detection test completed\n")


def test_job_scraping():
    """Test job scraping functionality."""
    print("🧪 Testing job scraping...")
    
    # Test URL from user
    test_url = "https://www.linkedin.com/jobs/collections/recommended/?currentJobId=4244908441"
    
    scraper = LinkedInScraper()
    
    print(f"🔍 Scraping: {test_url}")
    result = scraper.scrape(test_url)
    
    print("📊 Scraping Results:")
    print(f"  Success: {'error' not in result}")
    
    if 'error' in result:
        print(f"  Error: {result['error']}")
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
    
    print("✅ Job scraping test completed\n")


if __name__ == "__main__":
    print("🚀 Starting LinkedIn Job Scraper Tests\n")
    
    test_job_url_detection()
    test_job_scraping()
    
    print("🎉 All tests completed!") 