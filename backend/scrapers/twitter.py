import re
import os
import json
import requests
import time
from typing import Optional, Dict, List, Tuple
from .base import BaseScraper
from dotenv import load_dotenv
import asyncio
from playwright.async_api import async_playwright
import urllib.parse

load_dotenv()


def extract_tweet_id_from_url(url: str) -> Optional[str]:
    """Extract tweet ID from various Twitter/X URL formats."""
    # Handle various Twitter/X URL formats
    patterns = [
        r"(?:twitter\.com|x\.com)/\w+/status/(\d+)",
        r"(?:twitter\.com|x\.com)/i/status/(\d+)",
        r"(?:twitter\.com|x\.com)/status/(\d+)",
    ]

    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)

    return None


def extract_username_from_url(url: str) -> Optional[str]:
    """Extract username from various Twitter/X URL formats."""
    # Handle various Twitter/X URL formats
    patterns = [
        r"(?:twitter\.com|x\.com)/(\w+)/status/\d+",
        r"(?:twitter\.com|x\.com)/(\w+)/status/\d+",
    ]

    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)

    return None


def clean_tweet_text(text: str) -> str:
    """Clean tweet text by removing URLs, extra whitespace, etc."""
    if not text:
        return text

    # Remove URLs
    text = re.sub(
        r"http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+",
        "",
        text,
    )

    # Remove extra whitespace
    text = re.sub(r"\s+", " ", text).strip()

    return text


def extract_hashtags_and_mentions(text: str) -> Tuple[List[str], List[str]]:
    """Extract hashtags and mentions from tweet text."""
    hashtags = re.findall(r"#\w+", text)
    mentions = re.findall(r"@\w+", text)
    return hashtags, mentions


async def scrape_with_playwright(url: str) -> Optional[Dict]:
    """Scrape tweet using Playwright headless browser."""
    try:
        async with async_playwright() as p:
            # Use chromium with specific arguments for better compatibility
            browser = await p.chromium.launch(
                headless=True,
                args=[
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            )
            page = await browser.new_page()

            # Set user agent to avoid detection
            await page.set_extra_http_headers(
                {
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                }
            )

            print(f"   🌐 Loading tweet page with Playwright...")
            await page.goto(url, wait_until="networkidle", timeout=30000)

            # Wait for tweet content to load
            await page.wait_for_timeout(3000)

            # Extract tweet text
            tweet_text = ""
            try:
                # Try multiple selectors for tweet text
                selectors = [
                    '[data-testid="tweetText"]',
                    '[data-testid="tweet"] [lang]',
                    'article [data-testid="tweetText"]',
                    'div[data-testid="tweetText"]',
                ]

                for selector in selectors:
                    try:
                        element = await page.wait_for_selector(selector, timeout=5000)
                        if element:
                            tweet_text = await element.inner_text()
                            break
                    except:
                        continue

                if not tweet_text:
                    # Fallback: try to get any text content from the tweet
                    tweet_elements = await page.query_selector_all("article [lang]")
                    if tweet_elements:
                        tweet_text = await tweet_elements[0].inner_text()

            except Exception as e:
                print(f"   ⚠️ Could not extract tweet text: {e}")

            # Enhanced media extraction
            has_media = False
            media_urls = []

            try:
                print(f"   🔍 Searching for media content...")

                # Method 1: Look for image elements with src attributes
                image_elements = await page.query_selector_all(
                    'img[src*="pbs.twimg.com"], img[src*="video.twimg.com"]'
                )
                for img in image_elements:
                    try:
                        src = await img.get_attribute("src")
                        alt = await img.get_attribute("alt") or ""

                        if src and src.startswith("http"):
                            # Filter out profile images and small icons
                            if (
                                "profile" in src
                                or "avatar" in src
                                or "icon" in src
                                or "normal" in src
                                or "bigger" in src
                                or "mini" in src
                                or len(src) < 80
                            ):  # Skip very short URLs
                                continue

                            # Clean up the URL to get the best quality version
                            if "?format=" in src:
                                src = (
                                    src.split("?format=")[0] + "?format=jpg&name=large"
                                )
                            elif "&format=" in src:
                                src = (
                                    src.split("&format=")[0] + "&format=jpg&name=large"
                                )
                            else:
                                src = src + "?format=jpg&name=large"

                            media_urls.append(src)
                            has_media = True
                            print(f"   🖼️ Found tweet image: {src}")
                    except Exception as e:
                        print(f"   ⚠️ Error extracting image src: {e}")

                # Method 2: Look for video thumbnails (enhanced)
                video_elements = await page.query_selector_all(
                    '[data-testid="videoPlayer"], video, [data-testid="video"]'
                )
                if video_elements:
                    has_media = True
                    print(f"   🎥 Found video elements: {len(video_elements)}")

                    # Try to extract poster/thumbnail from video elements
                    for video in video_elements:
                        try:
                            poster = await video.get_attribute("poster")
                            if poster and poster.startswith("http"):
                                # Filter out profile images
                                if not (
                                    "profile" in poster
                                    or "avatar" in poster
                                    or "icon" in poster
                                ):
                                    media_urls.append(poster)
                                    print(f"   🎥 Found video poster: {poster}")
                        except:
                            pass

                    # Enhanced video thumbnail extraction
                    # Look for video thumbnail images in the page
                    video_thumbnails = await page.query_selector_all(
                        'img[src*="video.twimg.com"], img[src*="pbs.twimg.com"]'
                    )
                    for thumb in video_thumbnails:
                        try:
                            src = await thumb.get_attribute("src")
                            alt = await thumb.get_attribute("alt") or ""

                            # Check if this is likely a video thumbnail
                            if (
                                src
                                and src.startswith("http")
                                and ("video.twimg.com" in src or "pbs.twimg.com" in src)
                                and "profile" not in src
                                and "avatar" not in src
                                and "icon" not in src
                                and "normal" not in src
                                and "bigger" not in src
                                and "mini" not in src
                                and len(src) > 80
                            ):

                                # Clean up the URL to get the best quality version
                                if "?format=" in src:
                                    src = (
                                        src.split("?format=")[0]
                                        + "?format=jpg&name=large"
                                    )
                                elif "&format=" in src:
                                    src = (
                                        src.split("&format=")[0]
                                        + "&format=jpg&name=large"
                                    )
                                else:
                                    src = src + "?format=jpg&name=large"

                                media_urls.append(src)
                                print(f"   🎥 Found video thumbnail: {src}")
                        except Exception as e:
                            print(f"   ⚠️ Error processing video thumbnail: {e}")

                    # Look for video thumbnails in media containers
                    for video_elem in video_elements:
                        try:
                            # Look for images within the video element
                            img = await video_elem.query_selector("img")
                            if img:
                                src = await img.get_attribute("src")
                                if (
                                    src
                                    and src.startswith("http")
                                    and "twimg.com" in src
                                    and "profile" not in src
                                    and "avatar" not in src
                                    and "icon" not in src
                                    and "normal" not in src
                                    and "bigger" not in src
                                    and "mini" not in src
                                    and len(src) > 80
                                ):
                                    # Clean up the URL
                                    if "?format=" in src:
                                        src = (
                                            src.split("?format=")[0]
                                            + "?format=jpg&name=large"
                                        )
                                    elif "&format=" in src:
                                        src = (
                                            src.split("&format=")[0]
                                            + "&format=jpg&name=large"
                                        )
                                    else:
                                        src = src + "?format=jpg&name=large"

                                    media_urls.append(src)
                                    print(f"   🎥 Found video thumbnail in container: {src}")
                        except Exception as e:
                            print(f"   ⚠️ Error processing video container: {e}")

            except Exception as e:
                print(f"   ⚠️ Error during media extraction: {e}")

            # Extract author information
            author = "Unknown"
            try:
                # Try to extract author from various selectors
                author_selectors = [
                    '[data-testid="User-Name"] a',
                    'a[href*="/status/"]',
                    'a[data-testid="User-Name"]',
                ]

                for selector in author_selectors:
                    try:
                        author_element = await page.query_selector(selector)
                        if author_element:
                            author_text = await author_element.inner_text()
                            if author_text and author_text.strip():
                                author = author_text.strip()
                                break
                    except:
                        continue

            except Exception as e:
                print(f"   ⚠️ Could not extract author: {e}")

            await browser.close()

            if tweet_text or has_media:
                return {
                    "text": tweet_text,
                    "author": author,
                    "has_media": has_media,
                    "media_urls": media_urls,
                    "scraping_method": "playwright",
                }
            else:
                print(f"   ⚠️ No content found with Playwright")
                return None

    except Exception as e:
        print(f"   ❌ Playwright scraping failed: {e}")
        return None


def scrape_with_twitter_api(tweet_id: str, max_retries: int = 3) -> Optional[Dict]:
    """Scrape tweet using Twitter API v2 with exponential backoff for rate limiting."""
    
    # Get Twitter API credentials
    bearer_token = os.getenv("TWITTER_BEARER_TOKEN")
    if not bearer_token:
        print(f"   ⚠️ Twitter API bearer token not found")
        return None

    headers = {
        "Authorization": f"Bearer {bearer_token}",
        "User-Agent": "ThinkBackAI/1.0",
    }

    # Twitter API v2 endpoint
    url = f"https://api.twitter.com/2/tweets/{tweet_id}"
    params = {
        "tweet.fields": "created_at,author_id,text,entities,attachments",
        "expansions": "author_id,attachments.media_keys",
        "media.fields": "url,preview_image_url,type",
        "user.fields": "username,name",
    }

    for attempt in range(max_retries):
        try:
            print(f"   🔄 Trying Twitter API v2 (attempt {attempt + 1}/{max_retries})...")
            
            response = requests.get(url, headers=headers, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if "data" in data and data["data"]:
                    tweet_data = data["data"]
                    
                    # Extract text
                    text = tweet_data.get("text", "")
                    
                    # Extract author info
                    author_id = tweet_data.get("author_id")
                    author = "Unknown"
                    if "includes" in data and "users" in data["includes"]:
                        for user in data["includes"]["users"]:
                            if user.get("id") == author_id:
                                author = user.get("name", user.get("username", "Unknown"))
                                break
                    
                    # Extract media
                    media_urls = []
                    has_media = False
                    
                    if "includes" in data and "media" in data["includes"]:
                        has_media = True
                        for media in data["includes"]["media"]:
                            media_url = media.get("url") or media.get("preview_image_url")
                            if media_url:
                                media_urls.append(media_url)
                    
                    # Extract hashtags and mentions from entities
                    hashtags = []
                    mentions = []
                    
                    if "entities" in tweet_data:
                        entities = tweet_data["entities"]
                        
                        # Extract hashtags
                        if "hashtags" in entities:
                            for hashtag in entities["hashtags"]:
                                if "tag" in hashtag:
                                    hashtags.append(f"#{hashtag['tag']}")
                        
                        # Extract mentions
                        if "mentions" in entities:
                            for mention in entities["mentions"]:
                                if "username" in mention:
                                    mentions.append(f"@{mention['username']}")
                    
                    return {
                        "text": text,
                        "author": author,
                        "author_id": author_id,
                        "created_at": tweet_data.get("created_at"),
                        "has_media": has_media,
                        "media_urls": media_urls,
                        "hashtags": hashtags,
                        "mentions": mentions,
                        "scraping_method": "twitter_api",
                    }
                else:
                    print(f"   ❌ No tweet data found in API response")
                    return None
                    
            elif response.status_code == 429:
                # Rate limited - implement exponential backoff
                wait_time = (2 ** attempt) * 5  # 5s, 10s, 20s
                print(f"   ⏳ Rate limited (429). Waiting {wait_time}s before retry...")
                time.sleep(wait_time)
                continue
                
            elif response.status_code == 404:
                print(f"   ❌ Tweet not found (404)")
                return None
                
            else:
                print(f"   ❌ Twitter API returned status {response.status_code}")
                if attempt < max_retries - 1:
                    wait_time = (2 ** attempt) * 2  # Shorter backoff for other errors
                    print(f"   ⏳ Waiting {wait_time}s before retry...")
                    time.sleep(wait_time)
                    continue
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Twitter API request failed: {e}")
            if attempt < max_retries - 1:
                wait_time = (2 ** attempt) * 2
                print(f"   ⏳ Waiting {wait_time}s before retry...")
                time.sleep(wait_time)
                continue
            return None
    
    print(f"   ❌ All Twitter API attempts failed")
    return None


class TwitterScraper(BaseScraper):
    def scrape(self, url: str) -> dict:
        print(f"\n🤖 TWITTER/X SCRAPING STARTED")
        print(f"   URL: {url}")

        # Extract tweet ID
        tweet_id = extract_tweet_id_from_url(url)
        if not tweet_id:
            print(f"   ❌ Could not extract tweet ID from URL")
            return self._get_fallback_result(url, "Invalid Twitter/X URL")

        print(f"   🆔 Tweet ID: {tweet_id}")

        # Step 1: Try Playwright scraping first
        print(f"   🔄 Step 1: Attempting Playwright scraping...")
        playwright_result = None

        try:
            # Run the async Playwright function
            playwright_result = asyncio.run(scrape_with_playwright(url))
        except Exception as e:
            print(f"   ❌ Playwright execution failed: {e}")

        # Step 2: Try Twitter API with better error handling
        api_result = None
        if not playwright_result or playwright_result.get("has_media") and not playwright_result.get("media_urls"):
            print(f"   🔄 Step 2: Trying Twitter API...")
            api_result = scrape_with_twitter_api(tweet_id)

        # Step 3: Combine results and return
        final_result = self._combine_results(
            playwright_result, api_result, url, tweet_id
        )

        print(f"   ✅ Twitter/X scraping completed")
        print(f"   📝 Final title: {final_result.get('title', 'N/A')}")
        print(
            f"   📄 Final description: {len(final_result.get('description', ''))} chars"
        )
        print(f"   🖼️ Thumbnail: {final_result.get('thumbnail', 'N/A')}")

        return final_result

    def _combine_results(
        self,
        playwright_result: Optional[Dict],
        api_result: Optional[Dict],
        url: str,
        tweet_id: str,
    ) -> Dict:
        """Combine results from Playwright and Twitter API, prioritizing the best data."""

        # Extract username from URL
        username = extract_username_from_url(url)
        print(f"   👤 Extracted username: {username}")

        # Start with base structure
        result = {
            "url": url,
            "title": "",
            "description": "",
            "type": "post",
            "metadata": {
                "platform": "Twitter/X",
                "tweet_id": tweet_id,
                "scraping_method": "unknown",
            },
            "transcript": None,
            "thumbnail": None,
            "hashtags": [],
            "mentions": [],
            "channel": username,  # Add username as channel
        }

        # Determine which result to use as primary
        primary_result = None
        if api_result:
            primary_result = api_result
            result["metadata"]["scraping_method"] = "twitter_api"
        elif playwright_result:
            primary_result = playwright_result
            result["metadata"]["scraping_method"] = "playwright"

        if not primary_result:
            # No results from either method
            return self._get_fallback_result(url, "Failed to scrape tweet")

        # Extract text content
        tweet_text = primary_result.get("text", "")
        cleaned_text = clean_tweet_text(tweet_text)

        # Set title and description
        if cleaned_text:
            # Use first 100 chars as title, rest as description
            if len(cleaned_text) <= 100:
                result["title"] = cleaned_text
                result["description"] = ""
            else:
                result["title"] = cleaned_text[:100].rstrip()
                result["description"] = cleaned_text[100:].strip()
        else:
            result["title"] = f"Tweet by {primary_result.get('author', 'Unknown')}"

        # Extract hashtags and mentions - prioritize API results if available
        if api_result:
            result["hashtags"] = api_result.get("hashtags", [])
            result["mentions"] = api_result.get("mentions", [])
        else:
            # Extract from text if API not available
            full_text = tweet_text
            hashtags, mentions = extract_hashtags_and_mentions(full_text)
            result["hashtags"] = hashtags
            result["mentions"] = mentions

        # Handle media/thumbnail - prioritize Playwright media URLs if available
        media_urls = []
        if playwright_result and playwright_result.get("media_urls"):
            media_urls.extend(playwright_result.get("media_urls", []))
        if api_result and api_result.get("media_urls"):
            media_urls.extend(api_result.get("media_urls", []))

        # Remove duplicates while preserving order
        seen = set()
        unique_media_urls = []
        for url in media_urls:
            if url not in seen:
                seen.add(url)
                unique_media_urls.append(url)

        if unique_media_urls:
            result["thumbnail"] = unique_media_urls[0]  # Use first media as thumbnail

        # Add additional metadata
        if api_result:
            result["metadata"]["author_id"] = api_result.get("author_id")
            result["metadata"]["created_at"] = api_result.get("created_at")
        if playwright_result:
            result["metadata"]["author"] = playwright_result.get("author")

        result["metadata"]["has_media"] = primary_result.get("has_media", False)

        return result

    def _get_fallback_result(self, url: str, error: str = "Unknown error") -> dict:
        """Return a fallback result when scraping fails."""
        print(f"   ⚠️ Using fallback result due to: {error}")

        # Extract username from URL even in fallback
        username = extract_username_from_url(url)

        return {
            "url": url,
            "title": "Twitter/X Post",
            "description": f"Unable to scrape content: {error}",
            "type": "post",
            "metadata": {
                "platform": "Twitter/X",
                "error": error,
                "scraping_method": "fallback",
            },
            "transcript": None,
            "thumbnail": None,
            "hashtags": [],
            "mentions": [],
            "channel": username,  # Add username as channel
        }
