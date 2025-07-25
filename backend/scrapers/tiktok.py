import re
import requests
import json
from urllib.parse import urlparse, parse_qs
from .base import BaseScraper


def extract_video_id(url: str) -> str:
    """Extract TikTok video ID from various URL formats."""
    # Handle tiktok.com URLs
    if "tiktok.com/" in url:
        # Extract the video ID from the path
        path = urlparse(url).path
        # Look for video ID pattern in the path (both /video/ and /photo/)
        video_pattern = r"/(video|photo)/(\d+)"
        match = re.search(video_pattern, path)
        if match:
            return match.group(2)  # The ID is the second group
    
    return ""


def extract_username_from_url(url: str) -> str:
    """Extract TikTok username from URL."""
    if "tiktok.com/@" in url:
        # Extract username after @ symbol
        username_pattern = r"@([^/]+)"
        match = re.search(username_pattern, url)
        if match:
            return match.group(1)
    return ""


def get_tiktok_oembed_data(url: str) -> dict:
    """
    Get TikTok data using their oEmbed API.
    This provides thumbnail URLs and better metadata.
    """
    try:
        oembed_url = f"https://www.tiktok.com/oembed?url={url}"
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json",
        }
        
        response = requests.get(oembed_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ oEmbed API successful")
            return {
                "title": data.get("title"),
                "author_name": data.get("author_name"),
                "author_unique_id": data.get("author_unique_id"),
                "thumbnail_url": data.get("thumbnail_url"),
                "thumbnail_width": data.get("thumbnail_width"),
                "thumbnail_height": data.get("thumbnail_height"),
                "method": "oembed_api"
            }
        else:
            print(f"   ❌ oEmbed API failed with status {response.status_code}")
            return {"error": f"oEmbed API failed with status {response.status_code}"}
            
    except Exception as e:
        print(f"   ❌ oEmbed API error: {str(e)}")
        return {"error": f"oEmbed API error: {str(e)}"}


def get_tiktok_metadata(video_id: str) -> dict:
    """
    Get TikTok video metadata using web scraping approach.
    This is a lightweight method that doesn't require authentication.
    """
    try:
        # Try to get basic info from TikTok's web page
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
        }
        
        # Try to access the TikTok video page
        video_url = f"https://www.tiktok.com/video/{video_id}"
        response = requests.get(video_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            # Look for JSON data in the page
            content = response.text
            
            # Try to extract JSON data from the page
            json_pattern = r'<script id="SIGI_STATE" type="application/json">(.*?)</script>'
            match = re.search(json_pattern, content, re.DOTALL)
            
            if match:
                try:
                    json_data = json.loads(match.group(1))
                    # Navigate through the JSON structure to find video data
                    # This is a simplified approach - the actual structure may vary
                    return {"raw_data": json_data, "method": "web_scraping"}
                except json.JSONDecodeError:
                    pass
            
            # Fallback: extract basic info from HTML
            title_match = re.search(r'<title>(.*?)</title>', content)
            title = title_match.group(1) if title_match else f"TikTok Video {video_id}"
            
            return {
                "title": title,
                "method": "html_parsing"
            }
        
        return {"error": f"Failed to fetch video page: {response.status_code}"}
        
    except requests.exceptions.RequestException as e:
        return {"error": f"Request failed: {str(e)}"}


def generate_better_title(username: str, video_id: str, content_type: str = "video") -> str:
    """
    Generate a better title for TikTok content when we can't get the actual caption.
    """
    content_type_text = "Photo" if content_type == "photo" else "Video"
    if username:
        return f"TikTok {content_type_text} by @{username}"
    else:
        return f"TikTok {content_type_text} {video_id}"


def get_tiktok_thumbnail_url(video_id: str, username: str) -> str:
    """
    Generate a TikTok thumbnail URL.
    Note: TikTok doesn't provide public thumbnail URLs without authentication,
    so we'll return a placeholder or try to construct one.
    """
    # TikTok doesn't provide public thumbnail URLs, so we'll return None
    # This is the correct behavior - the frontend will handle missing thumbnails
    return None


class TikTokScraper(BaseScraper):
    def scrape(self, url: str) -> dict:
        """
        TikTok content scraping using oEmbed API and web scraping.
        Free, fast, and compatible with Cloud Run.
        """
        print(f"🎵 Starting TikTok scraping for: {url}")
        
        # Extract video ID and username
        video_id = extract_video_id(url)
        username = extract_username_from_url(url)
        
        if not video_id:
            print(f"❌ Could not extract video ID from URL: {url}")
            return {"error": "Could not extract video ID from URL"}
        
        # Determine content type based on URL
        content_type = "photo" if "/photo/" in url else "video"
        
        print(f"🎬 Content ID: {video_id}")
        print(f"👤 Username: {username}")
        print(f"📸 Content Type: {content_type}")
        
        # Initialize result structure
        result = {
            "url": url,
            "title": None,
            "description": None,
            "type": content_type,
            "metadata": {},
            "transcript": None,
            "thumbnail": None,
            "channel": username  # Add channel field for frontend display
        }
        
        # Try to get metadata from oEmbed API first (best method)
        print("🔄 Attempting oEmbed API for metadata...")
        oembed_data = get_tiktok_oembed_data(url)
        
        if "error" not in oembed_data:
            print(f"   ✅ oEmbed API successful")
            
            # Use oEmbed data for better results
            result["title"] = oembed_data.get("title") or generate_better_title(username, video_id, content_type)
            result["thumbnail"] = oembed_data.get("thumbnail_url")
            result["channel"] = oembed_data.get("author_name") or username
            
            print(f"   📝 Title: {result['title']}")
            print(f"   🖼️ Thumbnail: {'Available' if result['thumbnail'] else 'Not available'}")
            print(f"   👤 Channel: {result['channel']}")
            
            # Add metadata
            result["metadata"] = {
                "video_id": video_id,
                "username": username,
                "uploader": oembed_data.get("author_name") or username,
                "author_unique_id": oembed_data.get("author_unique_id"),
                "upload_date": None,  # Not available without authentication
                "view_count": None,   # Not available without authentication
                "like_count": None,   # Not available without authentication
                "comment_count": None, # Not available without authentication
                "webpage_url": url,
                "thumbnail": oembed_data.get("thumbnail_url"),
                "thumbnail_width": oembed_data.get("thumbnail_width"),
                "thumbnail_height": oembed_data.get("thumbnail_height"),
                "scraper": "oembed_api",
                "method": oembed_data.get("method", "oembed_api")
            }
            
            # Generate a basic description
            content_type_text = "photo" if content_type == "photo" else "video"
            if result["channel"]:
                result["description"] = f"TikTok {content_type_text} by {result['channel']}"
            else:
                result["description"] = f"TikTok {content_type_text} {video_id}"
            
        else:
            print(f"   ❌ oEmbed API failed: {oembed_data['error']}")
            
            # Fallback to web scraping
            print("🔄 Falling back to web scraping...")
            web_data = get_tiktok_metadata(video_id)
            
            if "error" not in web_data:
                print(f"   ✅ Web scraping successful")
                
                # Use our better title generation instead of the generic HTML title
                result["title"] = generate_better_title(username, video_id, content_type)
                print(f"   📝 Title: {result['title']}")
                
                # Add metadata
                result["metadata"] = {
                    "video_id": video_id,
                    "username": username,
                    "uploader": username,
                    "upload_date": None,  # Not available without authentication
                    "view_count": None,   # Not available without authentication
                    "like_count": None,   # Not available without authentication
                    "comment_count": None, # Not available without authentication
                    "webpage_url": url,
                    "thumbnail": None,    # Not available without authentication
                    "scraper": "web_scraping",
                    "method": web_data.get("method", "unknown")
                }
                
                # Generate a basic thumbnail URL (this won't work but provides structure)
                # TikTok doesn't provide public thumbnail URLs without authentication
                result["thumbnail"] = get_tiktok_thumbnail_url(video_id, username)
                
                # Generate a basic description
                content_type_text = "photo" if content_type == "photo" else "video"
                if username:
                    result["description"] = f"TikTok {content_type_text} by @{username}"
                else:
                    result["description"] = f"TikTok {content_type_text} {video_id}"
                
            else:
                print(f"   ❌ Web scraping failed: {web_data['error']}")
                
                # Final fallback to URL parsing
                print("🔄 Falling back to URL parsing...")
                
                # Create better title and description
                result["title"] = generate_better_title(username, video_id, content_type)
                content_type_text = "photo" if content_type == "photo" else "video"
                if username:
                    result["description"] = f"TikTok {content_type_text} by @{username}"
                else:
                    result["description"] = f"TikTok {content_type_text} {video_id}"
                
                # Add metadata
                result["metadata"] = {
                    "video_id": video_id,
                    "username": username,
                    "uploader": username,
                    "upload_date": None,
                    "view_count": None,
                    "like_count": None,
                    "comment_count": None,
                    "webpage_url": url,
                    "thumbnail": None,
                    "scraper": "url_parsing",
                    "method": "url_parsing"
                }
                
                # Generate thumbnail URL
                result["thumbnail"] = get_tiktok_thumbnail_url(video_id, username)
        
        print(f"   ✅ TikTok scraping completed successfully")
        print(f"   🎯 Final result:")
        print(f"      Title: {result.get('title', 'N/A')}")
        print(f"      Username: {username or 'N/A'}")
        print(f"      Type: {result.get('type', 'N/A')}")
        print(f"      Content ID: {video_id}")
        print(f"      Channel: {result.get('channel', 'N/A')}")
        print(f"      Thumbnail: {'Available' if result.get('thumbnail') else 'Not available'}")
        
        return result
