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
                return {"error": f"oEmbed API failed with status {response.status_code}"}
                
        except requests.exceptions.Timeout:
            print(f"   ❌ oEmbed request timed out")
            return {"error": "oEmbed request timed out"}
        except requests.exceptions.RequestException as e:
            print(f"   ❌ oEmbed request failed: {str(e)}")
            return {"error": f"oEmbed request failed: {str(e)}"}
        except json.JSONDecodeError as e:
            print(f"   ❌ Failed to parse oEmbed JSON response: {str(e)}")
            return {"error": f"Invalid JSON response from oEmbed API"}
        except Exception as e:
            print(f"   ❌ Unexpected error during oEmbed request: {str(e)}")
            return {"error": f"Unexpected error: {str(e)}"}
