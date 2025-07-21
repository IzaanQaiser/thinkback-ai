from .base import BaseScraper
import instaloader
import re
from typing import Dict, Any, List, Optional
import urllib.parse
import requests


def is_reels_url(url: str) -> bool:
    """Check if the URL is an Instagram Reels URL."""
    url_lower = url.lower()
    return "/reels/" in url_lower or "/reel/" in url_lower


def is_post_url(url: str) -> bool:
    """Check if the URL is an Instagram post URL."""
    url_lower = url.lower()
    return "instagram.com/p/" in url_lower


def extract_shortcode_from_url(url: str) -> Optional[str]:
    """Extract the shortcode from an Instagram URL."""
    # Handle various Instagram URL formats using string operations
    url_lower = url.lower()
    
    # Check for different patterns
    patterns = [
        '/p/',
        '/reels/',
        '/reel/',
        '/tv/'
    ]
    
    for pattern in patterns:
        if pattern in url_lower:
            # Split by the pattern and get the part after it
            parts = url_lower.split(pattern)
            if len(parts) > 1:
                # Get the shortcode (everything before the next slash or end of string)
                shortcode = parts[1].split('/')[0].split('?')[0]
                if shortcode:
                    # Get the original case from the original URL
                    original_parts = url.split(pattern)
                    if len(original_parts) > 1:
                        original_shortcode = original_parts[1].split('/')[0].split('?')[0]
                        return original_shortcode
                    return shortcode
    
    return None


class InstagramScraper(BaseScraper):
    def __init__(self):
        # Initialize Instaloader with custom session to avoid detection
        self.loader = instaloader.Instaloader(
            download_pictures=False,
            download_videos=False,
            download_video_thumbnails=False,
            download_geotags=False,
            download_comments=False,
            save_metadata=False,
            compress_json=False,
            dirname_pattern=None,
            filename_pattern=None,
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            max_connection_attempts=2,
            request_timeout=15,
            rate_controller=None,
            sleep=True,
            quiet=True,
        )

    def scrape(self, url: str) -> dict:
        print(f"\n📸 INSTAGRAM SCRAPING STARTED (Hybrid: Instaloader + fallback)")
        print(f"   URL: {url}")

        # Try Instaloader first for better data extraction
        result = self._try_instaloader(url)
        if result and result.get("posting_account", {}).get("username") != "unknown":
            print(f"   ✅ Instaloader succeeded - using enhanced data")
            return result

        # Fallback to web scraping if Instaloader fails
        print(f"   🔄 Instaloader failed, trying web scraping...")
        return self._fallback_to_ytdlp(url)  # This now does web scraping

    def _try_instaloader(self, url: str) -> Optional[dict]:
        """Try to scrape using Instaloader for enhanced data extraction."""
        try:
            # Extract shortcode from URL
            shortcode = extract_shortcode_from_url(url)
            if not shortcode:
                print(f"   ❌ Could not extract shortcode from URL: {url}")
                return None

            print(f"   🔍 Extracted shortcode: {shortcode}")

            # Get post using Instaloader
            print(f"   📥 Fetching post data from Instagram (Instaloader)...")
            post = instaloader.Post.from_shortcode(self.loader.context, shortcode)

            print(f"   ✅ Instaloader post fetched successfully")
            print(f"   📊 Post details:")
            print(f"     Owner: @{post.owner_username}")
            print(f"     Caption length: {len(post.caption or '')} chars")

            # Check if it's a carousel by trying to get sidecar nodes
            try:
                sidecar_nodes = list(post.get_sidecar_nodes())
                is_carousel = len(sidecar_nodes) > 1
                carousel_count = len(sidecar_nodes) if is_carousel else 1
                print(f"     Media count: {carousel_count}")
            except:
                is_carousel = False
                carousel_count = 1
                sidecar_nodes = []
                print(f"     Media count: 1 (single post)")

            print(f"     Likes: {post.likes}")
            print(f"     Comments: {post.comments}")
            print(f"     Date: {post.date_local}")
            print(
                f"     Type: {'Carousel' if is_carousel else 'Single' if post.is_video else 'Image'}"
            )

            # Extract posting account information
            posting_account = {
                "username": post.owner_username,
                "full_name": (
                    getattr(post.owner_profile, "full_name", post.owner_username)
                    if hasattr(post, "owner_profile")
                    else post.owner_username
                ),
                "profile_pic": (
                    getattr(post.owner_profile, "profile_pic_url", None)
                    if hasattr(post, "owner_profile")
                    else None
                ),
                "verified": (
                    getattr(post.owner_profile, "verified", False)
                    if hasattr(post, "owner_profile")
                    else False
                ),
                "private": (
                    getattr(post.owner_profile, "is_private", False)
                    if hasattr(post, "owner_profile")
                    else False
                ),
                "followers": (
                    getattr(post.owner_profile, "followers", None)
                    if hasattr(post, "owner_profile")
                    else None
                ),
                "following": (
                    getattr(post.owner_profile, "followees", None)
                    if hasattr(post, "owner_profile")
                    else None
                ),
            }

            # Extract caption and clean it
            caption = post.caption or ""
            if caption:
                caption = re.sub(r"\s+", " ", caption).strip()
                print(f"   📝 Cleaned caption length: {len(caption)} chars")
                print(f"   📝 Caption: {caption}")

            # Extract hashtags and mentions from caption
            hashtags = []
            mentions = []
            if caption:
                hashtag_pattern = r"#\w+"
                hashtags = re.findall(hashtag_pattern, caption)
                mention_pattern = r"@\w+"
                mentions = re.findall(mention_pattern, caption)
                print(f"   🏷️ Extracted hashtags: {hashtags}")
                print(f"   👥 Extracted mentions: {mentions}")

            # Extract all media content (carousel support)
            media_content = []
            if is_carousel and sidecar_nodes:
                # Carousel post - get all images/videos
                for i, node in enumerate(sidecar_nodes):
                    media_item = {
                        "index": i,
                        "type": "video" if node.is_video else "image",
                        "url": node.display_url,
                        "video_url": (
                            getattr(node, "video_url", None) if node.is_video else None
                        ),
                        "thumbnail": getattr(node, "thumbnail_src", node.display_url),
                        "dimensions": {
                            "width": getattr(node, "width", None),
                            "height": getattr(node, "height", None),
                        },
                    }
                    media_content.append(media_item)
                print(f"   🖼️ Extracted {len(media_content)} carousel items")
            else:
                # Single post
                media_item = {
                    "index": 0,
                    "type": "video" if post.is_video else "image",
                    "url": post.url,
                    "video_url": (
                        getattr(post, "video_url", None) if post.is_video else None
                    ),
                    "thumbnail": getattr(post, "thumbnail_src", post.url),
                    "dimensions": {
                        "width": getattr(post, "width", None),
                        "height": getattr(post, "height", None),
                    },
                }
                media_content.append(media_item)
                print(f"   🖼️ Extracted single media item")

            # Get primary thumbnail (first image/video)
            thumbnail = None
            if media_content:
                first_media = media_content[0]
                thumbnail = first_media.get("url") or first_media.get("thumbnail")
                print(f"   🖼️ Primary thumbnail: {thumbnail}")

            # Determine content type
            content_type = "reel" if is_reels_url(url) else "post"
            if is_carousel:
                content_type = "carousel"
            elif post.is_video:
                content_type = "video"
            else:
                content_type = "image"

            print(f"   📱 Content type: {content_type}")

            # Build metadata
            metadata = {
                "uploader": post.owner_username,
                "uploader_full_name": posting_account["full_name"],
                "upload_date": post.date_local.isoformat() if post.date_local else None,
                "like_count": post.likes,
                "comment_count": post.comments,
                "view_count": getattr(post, "video_view_count", None),
                "webpage_url": url,
                "thumbnail": thumbnail,
                "is_carousel": is_carousel,
                "carousel_count": carousel_count,
                "is_video": post.is_video,
                "location": getattr(post, "location", None),
                "sponsored": getattr(post, "sponsored", False),
                "tagged_users": getattr(post, "tagged_users", []),
                "scraper": "instaloader",
            }

            # Build result
            result = {
                "url": url,
                "title": f"Instagram {content_type.title()} by @{post.owner_username}",
                "description": caption,  # Full caption
                "type": content_type,
                "metadata": metadata,
                "transcript": None,  # Instagram doesn't provide transcripts
                "thumbnail": thumbnail,
                "hashtags": hashtags,
                "mentions": mentions,
                "is_carousel": is_carousel,
                "carousel_count": carousel_count,
                "posting_account": posting_account,
                "media_content": media_content,
            }

            print(f"   ✅ Instaloader scraping completed successfully")
            return result

        except Exception as e:
            print(f"   ❌ Instaloader failed: {e}")
            return None

    def _fallback_to_ytdlp(self, url: str) -> dict:
        """Fallback to basic web scraping when Instaloader fails."""
        print(f"   🔧 Using web scraping fallback...")
        
        try:
            import requests
            from bs4 import BeautifulSoup
            import re
            
            # Set up headers to mimic a browser
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            }
            
            print(f"   📥 Fetching Instagram page...")
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract basic information from meta tags
            title = None
            description = None
            thumbnail = None
            
            # Try to get title from meta tags
            og_title = soup.find('meta', property='og:title')
            if og_title:
                title = og_title.get('content', '')
            
            # Try to get description from meta tags
            og_description = soup.find('meta', property='og:description')
            if og_description:
                description = og_description.get('content', '')
            
            # Try to get thumbnail from meta tags
            og_image = soup.find('meta', property='og:image')
            if og_image:
                thumbnail = og_image.get('content', '')
            
            # Extract shortcode for metadata
            shortcode = extract_shortcode_from_url(url)
            content_type = "reel" if is_reels_url(url) else "post"
            
            # Extract hashtags from description if available
            hashtags = []
            if description:
                hashtag_pattern = r'#(\w+)'
                hashtags = re.findall(hashtag_pattern, description)
            
            # Extract mentions from description if available
            mentions = []
            if description:
                mention_pattern = r'@(\w+)'
                mentions = re.findall(mention_pattern, description)
            
            print(f"   ✅ Web scraping completed")
            print(f"   📊 Extracted data:")
            print(f"     Title: {title}")
            print(f"     Description length: {len(description) if description else 0} chars")
            print(f"     Hashtags: {hashtags}")
            print(f"     Mentions: {mentions}")
            
            return {
                "url": url,
                "title": title or f"Instagram {content_type.title()}",
                "description": description or "",
                "type": content_type,
                "metadata": {
                    "shortcode": shortcode,
                    "webpage_url": url,
                    "scraper": "web_scraping",
                    "extracted_title": bool(title),
                    "extracted_description": bool(description),
                    "extracted_thumbnail": bool(thumbnail),
                },
                "transcript": None,
                "thumbnail": thumbnail,
                "hashtags": hashtags,
                "mentions": mentions,
                "is_carousel": False,
                "carousel_count": 0,
                "posting_account": {
                    "username": "unknown",
                    "full_name": None,
                    "profile_pic": None,
                    "verified": False,
                    "private": False,
                    "followers": None,
                    "following": None,
                },
                "media_content": [],
            }
            
        except Exception as e:
            print(f"   ❌ Web scraping failed: {e}")
            return self._get_fallback_result(url, f"Web scraping failed: {e}")

    def _get_fallback_result(self, url: str, error: str = "Unknown error") -> dict:
        """Return fallback data when all scraping methods fail."""
        print(f"   🔄 Returning fallback data due to: {error}")

        # Try to extract basic info from URL
        shortcode = extract_shortcode_from_url(url)
        content_type = "reel" if is_reels_url(url) else "post"

        return {
            "url": url,
            "title": f"Instagram {content_type.title()}",
            "description": "",
            "type": content_type,
            "metadata": {
                "error": error,
                "shortcode": shortcode,
                "webpage_url": url,
                "scraper": "fallback",
            },
            "transcript": None,
            "thumbnail": None,
            "hashtags": [],
            "mentions": [],
            "is_carousel": False,
            "carousel_count": 0,
            "posting_account": {
                "username": "unknown",
                "full_name": None,
                "profile_pic": None,
                "verified": False,
                "private": False,
                "followers": None,
                "following": None,
            },
            "media_content": [],
        }
