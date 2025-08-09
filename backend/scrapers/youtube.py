from .base import BaseScraper
import requests
import json
import re
from urllib.parse import urlparse, parse_qs


def extract_video_id(url: str) -> str:
    """Extract YouTube video ID from various URL formats."""
    # Handle youtu.be URLs
    if "youtu.be/" in url:
        return url.split("youtu.be/")[1].split("?")[0]
    
    # Handle youtube.com URLs
    if "youtube.com/watch" in url:
        parsed = urlparse(url)
        query_params = parse_qs(parsed.query)
        return query_params.get("v", [""])[0]
    
    # Handle youtube.com/shorts URLs
    if "youtube.com/shorts/" in url:
        return url.split("youtube.com/shorts/")[1].split("?")[0]
    
    return ""


def is_shorts_url(url: str) -> bool:
    """Check if the URL is a YouTube Shorts URL."""
    url_lower = url.lower()
    return "youtube.com/shorts/" in url_lower or (
        "youtu.be/" in url_lower and "?feature=share" in url_lower
    )


def get_best_thumbnail_url(video_id: str) -> str:
    """
    Get the best available thumbnail URL for a YouTube video.
    Tries different qualities in order of preference, prioritizing
    formats that are less likely to have letterboxing.
    """
    # Thumbnail qualities in order of preference
    # maxresdefault.jpg is highest quality but may have letterboxing
    # sddefault.jpg is standard definition, often better aspect ratio
    # hqdefault.jpg is high quality, good balance
    thumbnail_qualities = [
        "maxresdefault.jpg",  # Highest quality (1280x720) - may have letterboxing
        "sddefault.jpg",      # Standard definition (640x480) - often better aspect ratio
        "hqdefault.jpg",      # High quality (480x360) - good balance
        "mqdefault.jpg",      # Medium quality (320x180)
        "default.jpg",        # Default quality (120x90)
    ]
    
    for quality in thumbnail_qualities:
        url = f"https://i.ytimg.com/vi/{video_id}/{quality}"
        try:
            response = requests.head(url, timeout=5)
            if response.status_code == 200:
                print(f"   🖼️ Using thumbnail quality: {quality}")
                return url
        except:
            continue
    
    # Fallback to oEmbed thumbnail if all direct URLs fail
    print(f"   🖼️ Falling back to oEmbed thumbnail")
    return f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"


class YouTubeScraper(BaseScraper):
    def _fallback_scrape(self, url: str, video_id: str, result: dict) -> dict:
        """
        Fallback method when oEmbed fails with 401 error.
        Uses direct YouTube page scraping with minimal data extraction.
        """
        print("   🔧 Starting fallback scraping method...")
        
        try:
            # Try to get basic video information from YouTube page
            youtube_url = f"https://www.youtube.com/watch?v={video_id}"
            print(f"   📡 Requesting YouTube page: {youtube_url}")
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            response = requests.get(youtube_url, headers=headers, timeout=15)
            print(f"   📊 YouTube page status: {response.status_code}")
            
            if response.status_code == 200:
                page_content = response.text
                
                # Try to extract title from page content
                title_match = re.search(r'"title":"([^"]+)"', page_content)
                if title_match:
                    # Decode JSON-escaped characters
                    title = title_match.group(1).replace('\\u0026', '&').replace('\\"', '"')
                    result["title"] = title
                    print(f"   📝 Extracted title: {title}")
                else:
                    # Fallback: generate a basic title from video ID
                    result["title"] = f"YouTube Video {video_id}"
                    print(f"   📝 Using fallback title: {result['title']}")
                
                # Try to extract channel name
                channel_match = re.search(r'"author":"([^"]+)"', page_content)
                if not channel_match:
                    channel_match = re.search(r'"ownerChannelName":"([^"]+)"', page_content)
                if channel_match:
                    channel = channel_match.group(1).replace('\\u0026', '&').replace('\\"', '"')
                    result["channel"] = channel
                    print(f"   👤 Extracted channel: {channel}")
                else:
                    result["channel"] = "Unknown Channel"
                    print(f"   👤 Using fallback channel: {result['channel']}")
                
                # Get thumbnail using our existing method
                result["thumbnail"] = get_best_thumbnail_url(video_id)
                print(f"   🖼️ Thumbnail: {result['thumbnail']}")
                
                # Set basic metadata for fallback
                result["metadata"] = {
                    "provider_name": "YouTube",
                    "provider_url": "https://www.youtube.com/",
                    "fallback_method": True,
                    "extracted_from": "page_scraping"
                }
                
                print(f"   ✅ Fallback scraping completed successfully")
                print(f"   🎯 Fallback result:")
                print(f"      Title: {result.get('title', 'N/A')}")
                print(f"      Channel: {result.get('channel', 'N/A')}")
                print(f"      Type: {result.get('type', 'N/A')}")
                print(f"      Thumbnail: {'✅' if result.get('thumbnail') else '❌'}")
                
                return result
            else:
                print(f"   ❌ YouTube page request failed with status {response.status_code}")
                # Return basic result with video ID as title
                result["title"] = f"YouTube Video {video_id}"
                result["channel"] = "Unknown Channel"
                result["thumbnail"] = get_best_thumbnail_url(video_id)
                result["metadata"] = {
                    "provider_name": "YouTube",
                    "provider_url": "https://www.youtube.com/",
                    "fallback_method": True,
                    "extracted_from": "minimal_fallback"
                }
                print(f"   ⚠️ Using minimal fallback data")
                return result
                
        except Exception as e:
            print(f"   ❌ Fallback method failed: {str(e)}")
            # Return minimal result to avoid complete failure
            result["title"] = f"YouTube Video {video_id}"
            result["channel"] = "Unknown Channel"
            result["thumbnail"] = get_best_thumbnail_url(video_id)
            result["metadata"] = {
                "provider_name": "YouTube",
                "provider_url": "https://www.youtube.com/",
                "fallback_method": True,
                "extracted_from": "error_fallback",
                "error": str(e)
            }
            print(f"   ⚠️ Using minimal error fallback data")
            return result

    def scrape(self, url: str) -> dict:
        """
        Simple YouTube content scraping using only oEmbed API.
        No authentication required, no transcript extraction.
        """
        print(f"🔍 Starting YouTube scraping for: {url}")
        
        video_id = extract_video_id(url)
        if not video_id:
            print(f"❌ Could not extract video ID from URL: {url}")
            return {"error": "Could not extract video ID from URL"}
        
        print(f"📹 Video ID: {video_id}")
        
        # Initialize result structure
        result = {
            "url": url,
            "title": None,
            "channel": None,
            "description": None,
            "thumbnail": None,
            "type": "shorts" if is_shorts_url(url) else "video",
            "metadata": {}
        }
        
        # Use oEmbed API to get metadata
        print("🔄 Fetching metadata via oEmbed API...")
        try:
            oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
            print(f"   📡 Requesting: {oembed_url}")
            
            response = requests.get(oembed_url, timeout=10)
            print(f"   📊 Response status: {response.status_code}")
            
            if response.status_code == 200:
                oembed_data = response.json()
                print(f"   ✅ oEmbed data received successfully")
                
                # Extract data from oEmbed response
                result["title"] = oembed_data.get("title")
                result["channel"] = oembed_data.get("author_name")
                
                # Get the best available thumbnail
                result["thumbnail"] = get_best_thumbnail_url(video_id)
                
                # oEmbed doesn't provide description, so we'll leave it as None
                # This is a limitation of the oEmbed API
                
                print(f"   📝 Title: {result['title']}")
                print(f"   👤 Channel: {result['channel']}")
                print(f"   🖼️ Thumbnail: {result['thumbnail']}")
                
                # Add some basic metadata
                result["metadata"] = {
                    "author_url": oembed_data.get("author_url"),
                    "provider_name": oembed_data.get("provider_name"),
                    "provider_url": oembed_data.get("provider_url"),
                    "width": oembed_data.get("width"),
                    "height": oembed_data.get("height"),
                    "html": oembed_data.get("html"),  # Embed HTML
                }
                
                print(f"   ✅ YouTube scraping completed successfully")
                print(f"   🎯 Final result:")
                print(f"      Title: {result.get('title', 'N/A')}")
                print(f"      Channel: {result.get('channel', 'N/A')}")
                print(f"      Type: {result.get('type', 'N/A')}")
                print(f"      Thumbnail: {'✅' if result.get('thumbnail') else '❌'}")
                
                return result
            else:
                print(f"   ❌ oEmbed failed with status {response.status_code}")
                print(f"   📄 Response content: {response.text[:200]}...")
                
                # For 401 errors, try fallback method instead of returning error
                if response.status_code == 401:
                    print("   🔄 oEmbed returned 401 (Unauthorized), attempting fallback method...")
                    return self._fallback_scrape(url, video_id, result)
                else:
                    return {"error": f"oEmbed API failed with status {response.status_code}"}
                
        except requests.exceptions.Timeout:
            print(f"   ❌ oEmbed request timed out, trying fallback...")
            return self._fallback_scrape(url, video_id, result)
        except requests.exceptions.RequestException as e:
            print(f"   ❌ oEmbed request failed: {str(e)}, trying fallback...")
            return self._fallback_scrape(url, video_id, result)
        except json.JSONDecodeError as e:
            print(f"   ❌ Failed to parse oEmbed JSON response: {str(e)}, trying fallback...")
            return self._fallback_scrape(url, video_id, result)
        except Exception as e:
            print(f"   ❌ Unexpected error during oEmbed request: {str(e)}, trying fallback...")
            return self._fallback_scrape(url, video_id, result)
