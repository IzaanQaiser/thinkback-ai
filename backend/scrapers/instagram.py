from .base import BaseScraper
import instaloader
import yt_dlp
import re
from typing import Dict, Any, List, Optional
import urllib.parse
import requests


def is_reels_url(url: str) -> bool:
    """Check if the URL is an Instagram Reels URL."""
    url_lower = url.lower()
    return "instagram.com/reels/" in url_lower


def is_post_url(url: str) -> bool:
    """Check if the URL is an Instagram post URL."""
    url_lower = url.lower()
    return "instagram.com/p/" in url_lower


def extract_shortcode_from_url(url: str) -> Optional[str]:
    """Extract the shortcode from an Instagram URL."""
    # Handle various Instagram URL formats
    patterns = [
        r"instagram\.com/p/([^/]+)",
        r"instagram\.com/reels/([^/]+)",
        r"instagram\.com/tv/([^/]+)",
    ]

    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)

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
        print(f"\n📸 INSTAGRAM SCRAPING STARTED (Hybrid: Instaloader + yt-dlp)")
        print(f"   URL: {url}")

        # Try Instaloader first for better data extraction
        result = self._try_instaloader(url)
        if result and result.get("posting_account", {}).get("username") != "unknown":
            print(f"   ✅ Instaloader succeeded - using enhanced data")
            return result

        # Fallback to yt-dlp if Instaloader fails
        print(f"   🔄 Instaloader failed, falling back to yt-dlp...")
        return self._fallback_to_ytdlp(url)

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
        """Fallback to yt-dlp when Instaloader fails."""
        print(f"   🔧 Using yt-dlp fallback...")

        ydl_opts = {
            "quiet": True,
            "skip_download": True,
            "extract_flat": False,
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)

                # Extract basic information
                title = info.get("title", "")
                description = info.get("description", "")

                print(f"   📊 yt-dlp data:")
                print(f"     Title: {title}")
                print(f"     Description length: {len(description)} chars")
                print(f"     Uploader: {info.get('uploader', 'N/A')}")
                print(f"     Upload date: {info.get('upload_date', 'N/A')}")
                print(f"     Duration: {info.get('duration', 'N/A')}")
                print(f"     View count: {info.get('view_count', 'N/A')}")
                print(f"     Like count: {info.get('like_count', 'N/A')}")
                print(f"     Comment count: {info.get('comment_count', 'N/A')}")
                print(f"     Thumbnail: {info.get('thumbnail', 'N/A')}")

                # Always try to get the first image from carousel if entries exist
                thumbnail = None
                is_carousel = False
                carousel_count = 0
                media_content = []

                if info and "entries" in info and info["entries"]:
                    if len(info["entries"]) > 1:
                        is_carousel = True
                        carousel_count = len(info["entries"])
                        print(f"     🖼️ Detected carousel with {carousel_count} images")

                    # Extract all carousel items
                    for i, entry in enumerate(info["entries"]):
                        if entry:
                            media_item = {
                                "index": i,
                                "type": (
                                    "video"
                                    if entry.get("ext") in ["mp4", "webm"]
                                    else "image"
                                ),
                                "url": entry.get("url"),
                                "video_url": (
                                    entry.get("url")
                                    if entry.get("ext") in ["mp4", "webm"]
                                    else None
                                ),
                                "thumbnail": entry.get("thumbnail"),
                                "dimensions": {
                                    "width": entry.get("width"),
                                    "height": entry.get("height"),
                                },
                            }
                            media_content.append(media_item)

                            # Use first item as thumbnail
                            if i == 0:
                                if entry.get("ext") in [
                                    "jpg",
                                    "jpeg",
                                    "png",
                                ] and entry.get("url"):
                                    thumbnail = entry["url"]
                                elif entry.get("thumbnail"):
                                    thumbnail = entry["thumbnail"]
                                elif entry.get("thumbnails") and entry["thumbnails"]:
                                    best_thumb = max(
                                        entry["thumbnails"],
                                        key=lambda x: (
                                            x.get("height", 0) if x.get("height") else 0
                                        ),
                                    )
                                    thumbnail = best_thumb.get("url")

                # If not a carousel or no entries, fallback to main thumbnail logic
                if not thumbnail and info:
                    thumbnail = info.get("thumbnail")
                    if not thumbnail and info.get("thumbnails"):
                        thumbnails = info["thumbnails"]
                        if thumbnails:
                            best_thumb = max(
                                thumbnails,
                                key=lambda x: (
                                    x.get("height", 0) if x.get("height") else 0
                                ),
                            )
                            thumbnail = best_thumb.get("url")

                # If no media content extracted, create a single item
                if not media_content and thumbnail:
                    media_content = [
                        {
                            "index": 0,
                            "type": "image",
                            "url": thumbnail,
                            "video_url": None,
                            "thumbnail": thumbnail,
                            "dimensions": {
                                "width": info.get("width") if info else None,
                                "height": info.get("height") if info else None,
                            },
                        }
                    ]

                # Determine content type
                content_type = "reel" if is_reels_url(url) else "post"
                if is_carousel:
                    content_type = "carousel"
                elif info.get("ext") in ["mp4", "webm"]:
                    content_type = "video"
                else:
                    content_type = "image"

                print(f"   📱 Content type: {content_type}")

                # Extract hashtags from description
                hashtags = []
                if description:
                    hashtag_pattern = r"#\w+"
                    hashtags = re.findall(hashtag_pattern, description)
                    print(f"   🏷️ Extracted hashtags: {hashtags}")

                # Extract mentions from description
                mentions = []
                if description:
                    mention_pattern = r"@\w+"
                    mentions = re.findall(mention_pattern, description)
                    print(f"   👥 Extracted mentions: {mentions}")

                # Clean up description by removing excessive whitespace
                if description:
                    description = re.sub(r"\s+", " ", description).strip()
                    print(f"   📝 Cleaned description length: {len(description)} chars")

                # Build posting account info from yt-dlp data
                posting_account = {
                    "username": info.get("uploader", "unknown"),
                    "full_name": info.get("uploader", "unknown"),
                    "profile_pic": None,
                    "verified": False,
                    "private": False,
                    "followers": None,
                    "following": None,
                }

                # Build metadata
                metadata = {
                    "uploader": info.get("uploader") if info else None,
                    "upload_date": info.get("upload_date") if info else None,
                    "duration": info.get("duration") if info else None,
                    "view_count": info.get("view_count") if info else None,
                    "like_count": info.get("like_count") if info else None,
                    "comment_count": info.get("comment_count") if info else None,
                    "webpage_url": info.get("webpage_url") if info else url,
                    "thumbnail": thumbnail,
                    "is_carousel": is_carousel,
                    "carousel_count": carousel_count,
                    "scraper": "yt-dlp",
                }

                result = {
                    "url": url,
                    "title": (
                        title
                        if title and title.strip()
                        else f"Instagram {content_type.title()} by @{posting_account['username']}"
                    ),
                    "description": description,
                    "type": content_type,
                    "metadata": metadata,
                    "transcript": description if description else None,
                    "thumbnail": thumbnail,
                    "hashtags": hashtags,
                    "mentions": mentions,
                    "is_carousel": is_carousel,
                    "carousel_count": carousel_count,
                    "posting_account": posting_account,
                    "media_content": media_content,
                }

                print(f"   ✅ yt-dlp fallback completed successfully")
                print(f"   📋 Final scraped data:")
                print(f"     Title: {result['title']}")
                print(f"     Type: {result['type']}")
                print(f"     Owner: @{result['posting_account']['username']}")
                print(f"     Hashtags: {result['hashtags']}")
                print(f"     Mentions: {result['mentions']}")
                print(f"     Thumbnail: {result['thumbnail']}")
                print(f"     Is Carousel: {result['is_carousel']}")
                print(f"     Carousel Count: {result['carousel_count']}")
                print(f"     Media Items: {len(result['media_content'])}")

                return result

        except Exception as e:
            print(f"   ❌ yt-dlp fallback also failed: {e}")
            return self._get_fallback_result(url, error=str(e))

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
