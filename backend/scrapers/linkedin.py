from .base import BaseScraper
import requests
import re
from bs4 import BeautifulSoup
from urllib.parse import urlparse, parse_qs
import json
import time


def extract_post_id(url: str) -> str:
    """Extract LinkedIn post ID from URL."""
    # Handle various LinkedIn post URL formats
    patterns = [
        # Pattern for: linkedin.com/posts/username_title-activity-123456789
        r'linkedin\.com/posts/[^/]+_([^-]+)-activity-([^?]+)',
        # Pattern for: linkedin.com/posts/username_title-activity-123456789?params
        r'linkedin\.com/posts/[^/]+_([^-]+)-activity-([^?]+)\?',
        # Pattern for: linkedin.com/feed/update/urn:li:activity:123456789
        r'linkedin\.com/feed/update/urn:li:activity:([^/?]+)',
        # Pattern for: linkedin.com/posts/username_title-activity-123456789
        r'linkedin\.com/posts/[^/]+-activity-([^?]+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            # For patterns with multiple groups, combine them
            if len(match.groups()) > 1:
                return f"{match.group(1)}-{match.group(2)}"
            return match.group(1)
    
    # Fallback: try to extract from the full URL
    if 'activity-' in url:
        activity_part = url.split('activity-')[1]
        if '?' in activity_part:
            return activity_part.split('?')[0]
        return activity_part
    
    return ""


def clean_text(text: str) -> str:
    """Clean and normalize text content."""
    if not text:
        return ""
    
    # Remove extra whitespace and normalize
    text = re.sub(r'\s+', ' ', text.strip())
    # Remove common LinkedIn prefixes
    text = re.sub(r'^(Kevin|John|Jane|etc\.)\s+on\s+[^:]+:\s*', '', text)
    return text


def extract_author_name(soup: BeautifulSoup) -> str:
    """Extract the author name from LinkedIn post."""
    # Try multiple selectors for author name
    selectors = [
        'h3[class*="post-meta"] span',
        'h3[class*="post-meta"] a',
        'span[class*="post-meta"] a',
        'a[class*="post-meta"]',
        'h3 a[href*="/in/"]',
        'span[class*="author"]',
        'a[class*="author"]',
    ]
    
    for selector in selectors:
        element = soup.select_one(selector)
        if element:
            text = element.get_text(strip=True)
            if text and len(text) > 0:
                return clean_text(text)
    
    # Fallback: look for any link that might be the author
    author_links = soup.find_all('a', href=re.compile(r'/in/'))
    for link in author_links:
        text = link.get_text(strip=True)
        if text and len(text) > 0:
            return clean_text(text)
    
    return "Unknown Author"


def extract_post_content(soup: BeautifulSoup) -> str:
    """Extract the main post content."""
    # Try multiple selectors for post content
    selectors = [
        'div[class*="post-content"] p',
        'div[class*="post-content"] div',
        'p[class*="post-content"]',
        'div[class*="content"] p',
        'div[class*="text"] p',
        'article p',
        'div[class*="post"] p',
    ]
    
    content_parts = []
    
    for selector in selectors:
        elements = soup.select(selector)
        for element in elements:
            text = element.get_text(strip=True)
            if text and len(text) > 10:  # Only include substantial text
                content_parts.append(text)
    
    # If no content found with selectors, try broader approach
    if not content_parts:
        # Look for any paragraph with substantial text
        paragraphs = soup.find_all('p')
        for p in paragraphs:
            text = p.get_text(strip=True)
            if text and len(text) > 20:  # Substantial text
                content_parts.append(text)
    
    return ' '.join(content_parts) if content_parts else ""


def extract_media_urls(soup: BeautifulSoup) -> list:
    """Extract media URLs (images, videos) from the post."""
    media_urls = []
    
    # Look for images
    images = soup.find_all('img')
    for img in images:
        src = img.get('src') or img.get('data-src')
        if src and not src.startswith('data:'):
            # Filter out small icons and avatars
            if not any(skip in src.lower() for skip in ['avatar', 'icon', 'logo', 'profile']):
                media_urls.append({
                    'type': 'image',
                    'url': src,
                    'alt': img.get('alt', '')
                })
    
    # Look for videos
    videos = soup.find_all(['video', 'iframe'])
    for video in videos:
        src = video.get('src') or video.get('data-src')
        if src:
            media_urls.append({
                'type': 'video',
                'url': src,
                'alt': video.get('alt', '')
            })
    
    return media_urls


def get_best_thumbnail(media_urls: list) -> str:
    """Get the best thumbnail from media URLs."""
    if not media_urls:
        return ""
    
    # Prefer images over videos for thumbnails
    images = [m for m in media_urls if m['type'] == 'image']
    if images:
        return images[0]['url']
    
    # Fallback to first media item
    return media_urls[0]['url']


class LinkedInScraper(BaseScraper):
    def scrape(self, url: str) -> dict:
        """
        Scrape LinkedIn post content using web scraping.
        Free, serverless-friendly approach using requests and BeautifulSoup.
        """
        print(f"🔍 Starting LinkedIn scraping for: {url}")
        
        post_id = extract_post_id(url)
        if not post_id:
            print(f"❌ Could not extract post ID from URL: {url}")
            return {"error": "Could not extract post ID from URL"}
        
        print(f"📝 Post ID: {post_id}")
        
        # Initialize result structure
        result = {
            "url": url,
            "title": None,
            "channel": None,  # Will be author name
            "description": None,  # Will be post content
            "thumbnail": None,
            "type": "post",
            "metadata": {
                "post_id": post_id,
                "platform": "LinkedIn"
            }
        }
        
        # Set up headers to mimic a real browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        
        try:
            print("🔄 Fetching LinkedIn post...")
            response = requests.get(url, headers=headers, timeout=15)
            response.raise_for_status()
            
            print(f"   ✅ Response status: {response.status_code}")
            print(f"   📄 Content length: {len(response.text)} characters")
            
            # Parse HTML
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract author name
            author_name = extract_author_name(soup)
            result["channel"] = author_name
            print(f"   👤 Author: {author_name}")
            
            # Extract post content
            post_content = extract_post_content(soup)
            result["description"] = post_content
            print(f"   📝 Content length: {len(post_content)} characters")
            
            # Extract media
            media_urls = extract_media_urls(soup)
            print(f"   🖼️ Found {len(media_urls)} media items")
            
            # Set thumbnail
            thumbnail = get_best_thumbnail(media_urls)
            if thumbnail:
                result["thumbnail"] = thumbnail
                print(f"   🖼️ Thumbnail: {thumbnail}")
            
            # Generate title from content or author
            if post_content:
                # Use first sentence or first 100 characters as title
                title = post_content[:100].strip()
                if len(post_content) > 100:
                    title += "..."
            else:
                title = f"LinkedIn post by {author_name}"
            
            result["title"] = title
            print(f"   📋 Title: {title}")
            
            # Add media metadata
            if media_urls:
                result["metadata"]["media_count"] = len(media_urls)
                result["metadata"]["media_types"] = list(set(m['type'] for m in media_urls))
            
            print(f"   ✅ LinkedIn scraping completed successfully")
            return result
            
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Request failed: {e}")
            return {"error": f"Failed to fetch LinkedIn post: {str(e)}"}
        except Exception as e:
            print(f"   ❌ Scraping failed: {e}")
            return {"error": f"Failed to parse LinkedIn post: {str(e)}"}
