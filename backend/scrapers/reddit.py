import re
import requests
import json
from .base import BaseScraper
from typing import Optional
import urllib.parse
import os
import praw
from dotenv import load_dotenv

load_dotenv()


def extract_subreddit_and_id_from_url(url: str) -> Optional[tuple[str, str]]:
    """Extract subreddit name and post ID from Reddit URL."""
    # Handle various Reddit URL formats
    patterns = [
        r"reddit\.com/r/([^/]+)/comments/([^/]+)",
        r"reddit\.com/r/([^/]+)/comments/([^/]+)/[^/]+",
        r"reddit\.com/r/([^/]+)/comments/([^/]+)/[^/]+/[^/]+",
    ]

    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1), match.group(2)

    return None


def extract_title_from_url(url: str) -> Optional[str]:
    """Extract and decode title from Reddit URL when possible."""
    pattern = r"reddit\.com/r/[^/]+/comments/[^/]+/([^/]+)"
    match = re.search(pattern, url)
    if match:
        title_part = match.group(1)
        # Decode URL-encoded string
        title_part = urllib.parse.unquote(title_part)
        # Convert URL format to readable title
        title = title_part.replace("_", " ").replace("-", " ")
        # Capitalize first letter of each word
        title = " ".join(word.capitalize() for word in title.split())
        return title
    return None


def clean_reddit_title(title: str) -> str:
    """Clean Reddit title by removing common prefixes and formatting."""
    if not title:
        return title

    # Remove common Reddit prefixes
    prefixes_to_remove = [
        r"^\[.*?\]\s*",  # [Tag] prefix
        r"^\(.*?\)\s*",  # (Tag) prefix
        r"^TIL\s*",  # TIL prefix
        r"^AMA\s*",  # AMA prefix
        r"^PSA\s*",  # PSA prefix
    ]

    cleaned_title = title
    for prefix in prefixes_to_remove:
        cleaned_title = re.sub(prefix, "", cleaned_title, flags=re.IGNORECASE)

    # Clean up extra whitespace
    cleaned_title = re.sub(r"\s+", " ", cleaned_title).strip()

    return cleaned_title


def extract_reddit_metadata(info: dict) -> dict:
    """Extract relevant metadata from Reddit post info."""
    metadata = {
        "subreddit": info.get("subreddit"),
        "author": info.get("uploader"),  # Reddit username
        "upload_date": info.get("upload_date"),
        "duration": info.get("duration"),
        "view_count": info.get("view_count"),
        "like_count": info.get("like_count"),
        "comment_count": info.get("comment_count"),
        "score": info.get("score"),  # Reddit upvotes
        "upvote_ratio": info.get("upvote_ratio"),
        "is_self": info.get("is_self", False),  # Text post vs link post
        "is_video": info.get("is_video", False),
        "is_gallery": info.get("is_gallery", False),
        "domain": info.get("domain"),  # Domain of linked content
        "permalink": info.get("permalink"),
        "created_utc": info.get("created_utc"),
    }

    # Clean up None values
    metadata = {k: v for k, v in metadata.items() if v is not None}

    return metadata


def try_reddit_json_api(url: str) -> Optional[dict]:
    """Try to fetch Reddit post data using the JSON API."""
    try:
        json_url = url.rstrip("/") + ".json"
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        response = requests.get(json_url, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if (
                "data" in data
                and "children" in data["data"]
                and len(data["data"]["children"]) > 0
            ):
                post_data = data["data"]["children"][0]["data"]
                title = post_data.get("title", "")
                # Use selftext for text posts, else empty string
                description = post_data.get("selftext", "") or ""

                # Get thumbnail
                thumbnail = get_best_media_url_from_json(post_data)
                
                # Add debugging for video posts
                if post_data.get("is_video"):
                    print(f"   🎥 JSON API: Processing video post")
                    print(f"   🎥 JSON API: Video data keys: {list(post_data.keys())}")
                    if "media" in post_data and post_data["media"]:
                        print(f"   🎥 JSON API: Media keys: {list(post_data['media'].keys())}")
                        if "reddit_video" in post_data["media"]:
                            video_data = post_data["media"]["reddit_video"]
                            print(f"   🎥 JSON API: Reddit video keys: {list(video_data.keys())}")
                            if "preview_image_url" in video_data:
                                print(f"   🎥 JSON API: Preview image URL: {video_data['preview_image_url']}")
                            if "fallback_url" in video_data:
                                print(f"   🎥 JSON API: Fallback URL: {video_data['fallback_url']}")
                    if thumbnail:
                        print(f"   🖼️ JSON API: Thumbnail extracted: {thumbnail}")
                    else:
                        print(f"   🖼️ JSON API: No thumbnail found")

                metadata = {
                    "subreddit": post_data.get("subreddit"),
                    "author": post_data.get("author"),
                    "score": post_data.get("score"),
                    "upvote_ratio": post_data.get("upvote_ratio"),
                    "comment_count": post_data.get("num_comments"),
                    "is_self": post_data.get("is_self", False),
                    "is_video": post_data.get("is_video", False),
                    "is_gallery": post_data.get("is_gallery", False),
                    "domain": post_data.get("domain"),
                    "created_utc": post_data.get("created_utc"),
                    "permalink": post_data.get("permalink"),
                }

                # Determine content type
                content_type = "video" if metadata.get("is_video") else "post"
                if metadata.get("is_gallery"):
                    content_type = "gallery"
                elif metadata.get("is_self"):
                    content_type = "text"

                return {
                    "url": url,
                    "title": title,
                    "description": description,
                    "type": content_type,
                    "metadata": metadata,
                    "transcript": None,
                    "thumbnail": thumbnail,
                    "hashtags": [],
                    "mentions": [],
                }

        return None
    except Exception as e:
        print(f"   ❌ JSON API failed: {e}")
        return None


def is_valid_content(title: Optional[str], description: Optional[str]) -> bool:
    if not title or not title.strip():
        return False
    if not description or not description.strip():
        return False
    # Add more checks if needed (e.g., length)
    return True


def get_best_media_url(submission):
    # Try gallery
    if hasattr(submission, "is_gallery") and submission.is_gallery:
        try:
            items = list(submission.gallery_data["items"])
            if items:
                media_id = items[0]["media_id"]
                if (
                    hasattr(submission, "media_metadata")
                    and media_id in submission.media_metadata
                ):
                    meta = submission.media_metadata[media_id]
                    if meta["e"] == "Image" and "s" in meta and "u" in meta["s"]:
                        return meta["s"]["u"].replace("&amp;", "&")
        except Exception:
            pass
    # Try video - Enhanced video thumbnail extraction
    if hasattr(submission, "is_video") and submission.is_video:
        try:
            print(f"   🎥 Processing video post...")
            if submission.media and "reddit_video" in submission.media:
                reddit_video = submission.media["reddit_video"]
                print(f"   🎥 Reddit video data found")
                
                # Try multiple thumbnail sources for videos
                thumbnail_sources = [
                    reddit_video.get("preview_image_url"),
                ]
                
                for source in thumbnail_sources:
                    if source and source.startswith("http") and any(source.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.gif']):
                        print(f"   🖼️ Found video thumbnail: {source}")
                        return source
                        
                # Additional fallback: try to get thumbnail from preview field
                if hasattr(submission, "preview") and submission.preview:
                    try:
                        images = submission.preview.get("images", [])
                        if images:
                            preview_url = images[0]["source"]["url"].replace("&amp;", "&")
                            print(f"   🖼️ Found video thumbnail from preview: {preview_url}")
                            return preview_url
                    except Exception as e:
                        print(f"   ❌ Error extracting preview thumbnail: {e}")
                        
                # Last resort: use the video URL itself (but only if it's an image)
                if reddit_video.get("fallback_url"):
                    video_url = reddit_video["fallback_url"]
                    if any(video_url.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.gif']):
                        print(f"   🖼️ Using video URL as thumbnail (appears to be image): {video_url}")
                        return video_url
                        
                # For Reddit videos, we often can't get direct thumbnails due to CDN restrictions
                # Return None instead of trying to construct URLs that don't work
                print(f"   🖼️ No accessible thumbnail found for Reddit video (CDN restrictions)")
                return None
        except Exception as e:
            print(f"   ❌ Error extracting video thumbnail: {e}")
            pass
    # Try preview image
    if hasattr(submission, "preview") and submission.preview:
        try:
            images = submission.preview.get("images", [])
            if images:
                return images[0]["source"]["url"].replace("&amp;", "&")
        except Exception:
            pass
    # Try direct image
    if hasattr(submission, "url") and submission.url:
        if any(
            submission.url.lower().endswith(ext)
            for ext in [".jpg", ".jpeg", ".png", ".gif"]
        ):
            return submission.url
    # Fallback to submission.thumbnail
    if (
        hasattr(submission, "thumbnail")
        and submission.thumbnail
        and submission.thumbnail not in ["self", "default", "nsfw", ""]
    ):
        return submission.thumbnail
    return None


def get_best_media_url_from_json(post_data):
    # Try gallery
    if (
        post_data.get("is_gallery")
        and "gallery_data" in post_data
        and "media_metadata" in post_data
    ):
        try:
            items = post_data["gallery_data"]["items"]
            if items:
                media_id = items[0]["media_id"]
                meta = post_data["media_metadata"][media_id]
                if meta["e"] == "Image" and "s" in meta and "u" in meta["s"]:
                    return meta["s"]["u"].replace("&amp;", "&")
        except Exception:
            pass
    # Try video - Enhanced video thumbnail extraction for JSON API
    if post_data.get("is_video") and "media" in post_data and post_data["media"]:
        try:
            print(f"   🎥 Processing video post via JSON API...")
            reddit_video = post_data["media"].get("reddit_video")
            if reddit_video:
                print(f"   🎥 Reddit video data found in JSON")
                
                # Try multiple thumbnail sources for videos
                thumbnail_sources = [
                    reddit_video.get("preview_image_url"),
                    reddit_video.get("fallback_url"),
                    reddit_video.get("hls_url"),  # Sometimes contains thumbnail info
                ]
                
                for source in thumbnail_sources:
                    if source and source.startswith("http"):
                        print(f"   🖼️ Found video thumbnail via JSON: {source}")
                        return source
                        
                # Additional fallback: try to get thumbnail from secure_media
                if "secure_media" in post_data and post_data["secure_media"]:
                    secure_video = post_data["secure_media"].get("reddit_video")
                    if secure_video:
                        secure_thumbnail = secure_video.get("preview_image_url")
                        if secure_thumbnail and secure_thumbnail.startswith("http") and any(secure_thumbnail.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.gif']):
                            print(f"   🖼️ Found secure video thumbnail: {secure_thumbnail}")
                            return secure_thumbnail
                            
                # Additional fallback: try to get thumbnail from preview field
                if "preview" in post_data and post_data["preview"]:
                    try:
                        images = post_data["preview"].get("images", [])
                        if images:
                            preview_url = images[0]["source"]["url"].replace("&amp;", "&")
                            print(f"   🖼️ Found video thumbnail from preview via JSON: {preview_url}")
                            return preview_url
                    except Exception as e:
                        print(f"   ❌ Error extracting preview thumbnail via JSON: {e}")
                        
                # Last resort: use the video URL itself (but only if it's an image)
                if reddit_video.get("fallback_url"):
                    video_url = reddit_video["fallback_url"]
                    if any(video_url.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.gif']):
                        print(f"   🖼️ Using video URL as thumbnail via JSON (appears to be image): {video_url}")
                        return video_url
                        
                # For Reddit videos, we often can't get direct thumbnails due to CDN restrictions
                # Return None instead of trying to construct URLs that don't work
                print(f"   🖼️ No accessible thumbnail found for Reddit video via JSON (CDN restrictions)")
                return None
        except Exception as e:
            print(f"   ❌ Error extracting video thumbnail via JSON: {e}")
            pass
    # Try preview image
    if "preview" in post_data and post_data["preview"]:
        try:
            images = post_data["preview"].get("images", [])
            if images:
                return images[0]["source"]["url"].replace("&amp;", "&")
        except Exception:
            pass
    # Try direct image
    if "url" in post_data and post_data["url"]:
        if any(
            post_data["url"].lower().endswith(ext)
            for ext in [".jpg", ".jpeg", ".png", ".gif"]
        ):
            return post_data["url"]
    # Fallback to thumbnail
    if (
        "thumbnail" in post_data
        and post_data["thumbnail"]
        and post_data["thumbnail"] not in ["self", "default", "nsfw", ""]
    ):
        return post_data["thumbnail"]
    return None


class RedditScraper(BaseScraper):
    def scrape(self, url: str) -> dict:
        print(f"\n🤖 REDDIT SCRAPING STARTED")
        print(f"   URL: {url}")

        # Extract subreddit and post ID for logging
        reddit_info = extract_subreddit_and_id_from_url(url)
        if reddit_info:
            subreddit, post_id = reddit_info
            print(f"   📍 Subreddit: r/{subreddit}")
            print(f"   🆔 Post ID: {post_id}")

        # Try to extract title from URL first
        url_title = extract_title_from_url(url)
        if url_title:
            print(f"   📝 Extracted title from URL: {url_title}")

        # --- PRAW SCRAPING PRIORITY ---
        praw_client_id = os.environ.get("REDDIT_CLIENT_ID")
        praw_client_secret = os.environ.get("REDDIT_CLIENT_SECRET")
        praw_user_agent = os.environ.get("REDDIT_USER_AGENT", "thinkback-ai/1.0")
        praw_username = os.environ.get("REDDIT_USERNAME")
        praw_password = os.environ.get("REDDIT_PASSWORD")
        print(
            "PRAW ENV DEBUG:",
            "ID:",
            praw_client_id,
            "SECRET:",
            praw_client_secret,
            "UA:",
            praw_user_agent,
            "USERNAME:",
            praw_username,
            "PASSWORD SET:",
            bool(praw_password),
        )
        praw_enabled = praw_client_id and praw_client_secret and praw_user_agent
        if praw_enabled and reddit_info:
            try:
                print(f"   🔄 Trying PRAW (authenticated API)...")
                praw_kwargs = dict(
                    client_id=praw_client_id,
                    client_secret=praw_client_secret,
                    user_agent=praw_user_agent,
                )
                if praw_username and praw_password:
                    praw_kwargs["username"] = praw_username
                    praw_kwargs["password"] = praw_password
                reddit = praw.Reddit(**praw_kwargs)
                submission = reddit.submission(id=post_id)
                submission_title = submission.title
                submission_selftext = submission.selftext or ""
                print(f"   ✅ PRAW got title: {submission_title}")
                print(f"   ✅ PRAW got selftext length: {len(submission_selftext)}")
                
                # Add debugging for video posts
                if hasattr(submission, "is_video") and submission.is_video:
                    print(f"   🎥 This is a video post")
                    print(f"   🎥 Video attributes: is_video={submission.is_video}")
                    if hasattr(submission, "media") and submission.media:
                        print(f"   🎥 Media data available: {list(submission.media.keys())}")
                        if "reddit_video" in submission.media:
                            video_data = submission.media["reddit_video"]
                            print(f"   🎥 Reddit video keys: {list(video_data.keys())}")
                            if "preview_image_url" in video_data:
                                print(f"   🎥 Preview image URL: {video_data['preview_image_url']}")
                            if "fallback_url" in video_data:
                                print(f"   🎥 Fallback URL: {video_data['fallback_url']}")
                
                best_media = get_best_media_url(submission)
                if best_media:
                    print(f"   🖼️ Thumbnail extracted: {best_media}")
                else:
                    print(f"   🖼️ No thumbnail found")
                    
                is_text_valid = is_valid_content(submission_title, submission_selftext)
                is_media_valid = best_media is not None
                
                # For video posts, we should accept them even with minimal text if we have media
                if hasattr(submission, "is_video") and submission.is_video:
                    print(f"   🎥 Video post detected - accepting with media or valid title")
                    # Accept video posts if we have either media or a valid title
                    if is_media_valid or (submission_title and submission_title.strip()):
                        print(f"   ✅ Video post content is valid (has media or title), using it!")
                        return {
                            "url": url,
                            "title": submission_title,
                            "description": submission_selftext if submission_selftext.strip() else "",
                            "type": "video",  # Set type to video for video posts
                            "metadata": {
                                "subreddit": subreddit,
                                "author": getattr(submission, "author", None)
                                and submission.author.name,
                                "score": submission.score,
                                "upvote_ratio": getattr(submission, "upvote_ratio", None),
                                "comment_count": submission.num_comments,
                                "is_self": submission.is_self,
                                "is_video": submission.is_video,
                                "created_utc": submission.created_utc,
                                "permalink": submission.permalink,
                            },
                            "transcript": None,
                            "thumbnail": best_media,
                            "hashtags": re.findall(
                                r"#\w+", submission_title + " " + submission_selftext
                            ),
                            "mentions": re.findall(
                                r"u/\w+", submission_title + " " + submission_selftext
                            ),
                        }
                    else:
                        print(f"   ⚠️ Video post has no media and no valid title, falling back...")
                elif is_text_valid or is_media_valid:
                    print(f"   ✅ PRAW content is valid (text or media), using it!")
                    return {
                        "url": url,
                        "title": submission_title,
                        "description": submission_selftext if is_text_valid else "",
                        "type": "post",
                        "metadata": {
                            "subreddit": subreddit,
                            "author": getattr(submission, "author", None)
                            and submission.author.name,
                            "score": submission.score,
                            "upvote_ratio": getattr(submission, "upvote_ratio", None),
                            "comment_count": submission.num_comments,
                            "is_self": submission.is_self,
                            "is_video": submission.is_video,
                            "created_utc": submission.created_utc,
                            "permalink": submission.permalink,
                        },
                        "transcript": None,
                        "thumbnail": best_media,
                        "hashtags": re.findall(
                            r"#\w+", submission_title + " " + submission_selftext
                        ),
                        "mentions": re.findall(
                            r"u/\w+", submission_title + " " + submission_selftext
                        ),
                    }
                else:
                    print(f"   ⚠️ PRAW content invalid, falling back...")
            except Exception as e:
                print(f"   ❌ PRAW failed: {e}")
        else:
            print(f"   ⚠️ PRAW not enabled or missing info, skipping...")

        # --- FALLBACK TO CURRENT SYSTEM ---
        # Try JSON API first (more reliable)
        print(f"   🔄 Trying Reddit JSON API...")
        json_result = try_reddit_json_api(url)
        if json_result:
            print(f"   ✅ Successfully extracted data via JSON API")
            title = json_result.get("title", "")
            cleaned_title = clean_reddit_title(title)
            json_result["title"] = cleaned_title

            # Add debugging for video posts in JSON API
            metadata = json_result.get("metadata", {})
            if metadata.get("is_video"):
                print(f"   🎥 JSON API: This is a video post")
                print(f"   🎥 JSON API: Video metadata: {metadata}")
                thumbnail = json_result.get("thumbnail")
                if thumbnail:
                    print(f"   🖼️ JSON API: Thumbnail found: {thumbnail}")
                else:
                    print(f"   🖼️ JSON API: No thumbnail found")

            # Extract hashtags and mentions
            description = json_result.get("description", "")
            combined_text = f"{cleaned_title} {description}"

            hashtag_pattern = r"#\w+"
            hashtags = re.findall(hashtag_pattern, combined_text)

            mention_pattern = r"u/\w+"
            mentions = re.findall(mention_pattern, combined_text)

            json_result["hashtags"] = hashtags
            json_result["mentions"] = mentions

            if hashtags:
                print(f"   🏷️ Extracted hashtags: {hashtags}")
            if mentions:
                print(f"   👥 Extracted mentions: {mentions}")

            print(f"   📊 Metadata extracted:")
            print(f"     Subreddit: {metadata.get('subreddit', 'N/A')}")
            print(f"     Author: {metadata.get('author', 'N/A')}")
            print(f"     Score: {metadata.get('score', 'N/A')}")
            print(f"     Comments: {metadata.get('comment_count', 'N/A')}")
            print(f"     Content type: {json_result.get('type', 'N/A')}")

            return json_result

        # Fallback to yt-dlp
        print(f"   🔄 JSON API failed, trying yt-dlp...")
        raise NotImplementedError("yt_dlp-based Reddit scraping removed. Implement alternative if needed.")

        # try:
        #     with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        #         print(f"   📥 Fetching Reddit post data via yt-dlp...")
        #         info = ydl.extract_info(url, download=False)

        #         if not info:
        #             print(f"   ❌ Failed to extract info from Reddit URL")
        #             return self._get_fallback_result(
        #                 url, "Failed to extract info", url_title
        #             )

        #         print(f"   ✅ Reddit post data extracted successfully via yt-dlp")

        #         # Extract title and clean it
        #         title = info.get("title", "")
        #         cleaned_title = clean_reddit_title(title)
        #         print(f"   📝 Original title: {title}")
        #         print(f"   📝 Cleaned title: {cleaned_title}")

        #         # Extract description (self text for text posts)
        #         description = info.get("description", "")
        #         if description:
        #             # Clean up description
        #             description = re.sub(r"\s+", " ", description).strip()
        #             print(f"   📄 Description length: {len(description)} chars")

        #         # Extract metadata
        #         metadata = extract_reddit_metadata(info)
        #         print(f"   📊 Metadata extracted:")
        #         print(f"     Subreddit: {metadata.get('subreddit', 'N/A')}")
        #         print(f"     Author: {metadata.get('author', 'N/A')}")
        #         print(f"     Score: {metadata.get('score', 'N/A')}")
        #         print(f"     Comments: {metadata.get('comment_count', 'N/A')}")
        #         print(f"     Is video: {metadata.get('is_video', False)}")
        #         print(f"     Is self post: {metadata.get('is_self', False)}")

        #         # Get thumbnail
        #         thumbnail = get_best_media_url(info)
        #         if thumbnail:
        #             print(f"   🖼️ Thumbnail found: {thumbnail}")
        #         else:
        #             print(f"   🖼️ No thumbnail available")

        #         # Determine content type
        #         content_type = "video" if metadata.get("is_video") else "post"
        #         if metadata.get("is_gallery"):
        #             content_type = "gallery"
        #         elif metadata.get("is_self"):
        #             content_type = "text"

        #         print(f"   📋 Content type: {content_type}")

        #         # Extract hashtags and mentions from title and description
        #         hashtags = []
        #         mentions = []

        #         # Look for hashtags in title and description
        #         combined_text = f"{cleaned_title} {description}"
        #         hashtag_pattern = r"#\w+"
        #         hashtags = re.findall(hashtag_pattern, combined_text)

        #         # Look for Reddit mentions (u/username)
        #         mention_pattern = r"u/\w+"
        #         mentions = re.findall(mention_pattern, combined_text)

        #         if hashtags:
        #             print(f"   🏷️ Extracted hashtags: {hashtags}")
        #         if mentions:
        #             print(f"   👥 Extracted mentions: {mentions}")

        #         result = {
        #             "url": url,
        #             "title": cleaned_title or title,  # Use cleaned title if available
        #             "description": description,
        #             "type": content_type,
        #             "metadata": metadata,
        #             "transcript": None,  # Reddit posts don't have transcripts
        #             "thumbnail": thumbnail,
        #             "hashtags": hashtags,
        #             "mentions": mentions,
        #         }

        #         print(f"   ✅ Reddit scraping completed successfully")
        #         return result

        # except Exception as e:
        #     error_msg = f"Error scraping Reddit URL: {str(e)}"
        #     print(f"   ❌ {error_msg}")
        #     return self._get_fallback_result(url, error_msg, url_title)
        # return self._get_fallback_result(url, "All scraping methods failed", url_title)

    def _get_fallback_result(
        self, url: str, error: str = "Unknown error", url_title: Optional[str] = None
    ) -> dict:
        """Return a fallback result when scraping fails."""
        print(f"   🔄 Using fallback result due to: {error}")

        # Try to extract basic info from URL
        reddit_info = extract_subreddit_and_id_from_url(url)
        subreddit = reddit_info[0] if reddit_info else "unknown"

        # Use URL title if available, otherwise use generic title
        if url_title:
            # Decode again in case not already decoded
            title = urllib.parse.unquote(url_title)
            print(f"   📝 Using title extracted from URL: {title}")
        else:
            title = f"Reddit Post from r/{subreddit}"
            print(f"   📝 Using generic title: {title}")

        return {
            "url": url,
            "title": title,
            "description": "",  # Do NOT include error message here
            "type": "post",
            "metadata": {
                "subreddit": subreddit,
                "error": error,
            },
            "transcript": None,
            "thumbnail": None,
            "hashtags": [],
            "mentions": [],
        }
