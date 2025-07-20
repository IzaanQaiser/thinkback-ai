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
        # First, try to install browsers if they're missing
        try:
            import subprocess
            result = subprocess.run(
                ["playwright", "install", "--dry-run", "chromium"],
                capture_output=True,
                text=True
            )
            if result.returncode != 0:
                print("   🔧 Installing Playwright browsers...")
                subprocess.run(["playwright", "install", "chromium"], check=True)
                print("   ✅ Browsers installed successfully")
        except Exception as e:
            print(f"   ⚠️ Could not install browsers: {e}")
        
        async with async_playwright() as p:
            # Use chromium with container-optimized arguments
            browser = await p.chromium.launch(
                headless=True,
                timeout=30000,  # 30 second timeout
                args=[
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    '--memory-pressure-off',
                    '--max_old_space_size=256',
                    '--single-process',
                    '--disable-extensions',
                    '--disable-plugins',
                    '--disable-images',
                    '--disable-javascript',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding'
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

                # Method 1: Look for image elements with src attributes (enhanced)
                print(f"   🔍 Searching for embedded images...")
                
                # First, try to find images in tweet content containers
                tweet_images = await page.query_selector_all(
                    '[data-testid="tweetPhoto"], [data-testid="tweet"] img, article img'
                )
                print(f"   📊 Found {len(tweet_images)} potential tweet images")
                
                for img in tweet_images:
                    try:
                        src = await img.get_attribute("src")
                        alt = await img.get_attribute("alt") or ""

                        if src and src.startswith("http"):
                            # Enhanced filtering - be more specific about what to exclude
                            exclude_patterns = [
                                "profile", "avatar", "icon", "normal", "bigger", "mini",
                                "verified", "badge", "emoji", "sticker", "small"
                            ]
                            
                            should_exclude = any(pattern in src.lower() for pattern in exclude_patterns)
                            
                            # Also exclude very small images (likely icons)
                            if len(src) < 100:
                                should_exclude = True
                                
                            if should_exclude:
                                print(f"   ⚠️ Excluding image: {src[:50]}...")
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
                            print(f"   🖼️ Found embedded tweet image: {src}")
                    except Exception as e:
                        print(f"   ⚠️ Error extracting embedded image: {e}")
                
                # If no embedded images found, try broader search
                if not media_urls:
                    print(f"   🔍 No embedded images found, trying broader search...")
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
                                        + "?format=jpg&name=large"
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
    """Scrape tweet using Twitter API v2."""
    print(f"   🔄 Trying Twitter API v2...")
    
    # Get Twitter API credentials
    twitter_bearer_token = os.getenv("TWITTER_BEARER_TOKEN")
    if not twitter_bearer_token:
        print(f"   ❌ Twitter API credentials not configured")
        return None

    # Twitter API v2 endpoint
    url = f"https://api.twitter.com/2/tweets/{tweet_id}"
    
    headers = {
        "Authorization": f"Bearer {twitter_bearer_token}",
        "User-Agent": "ThinkBackAI/1.0"
    }
    
    # Include additional fields for better data extraction
    params = {
        "tweet.fields": "created_at,author_id,text,entities,attachments",
        "expansions": "attachments.media_keys,author_id",
        "media.fields": "url,preview_image_url,type",
        "user.fields": "username,name"
    }

    for attempt in range(max_retries):
        try:
            print(f"   📡 API request attempt {attempt + 1}/{max_retries}")
            response = requests.get(url, headers=headers, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Twitter API request successful")
                
                # Extract tweet data
                tweet_data = data.get("data", {})
                includes = data.get("includes", {})
                
                # Extract text
                tweet_text = tweet_data.get("text", "")
                
                # Extract author info
                author_id = tweet_data.get("author_id")
                author_username = "Unknown"
                if author_id and "users" in includes:
                    for user in includes["users"]:
                        if user.get("id") == author_id:
                            author_username = user.get("username", "Unknown")
                            break
                
                # Extract media
                media_urls = []
                if "attachments" in tweet_data and "media_keys" in tweet_data["attachments"]:
                    media_keys = tweet_data["attachments"]["media_keys"]
                    if "media" in includes:
                        for media in includes["media"]:
                            if media.get("media_key") in media_keys:
                                media_url = media.get("url") or media.get("preview_image_url")
                                if media_url:
                                    media_urls.append(media_url)
                
                # Extract hashtags and mentions from entities
                hashtags = []
                mentions = []
                entities = tweet_data.get("entities", {})
                
                if "hashtags" in entities:
                    hashtags = [tag["tag"] for tag in entities["hashtags"]]
                
                if "mentions" in entities:
                    mentions = [mention["username"] for mention in entities["mentions"]]
                
                return {
                    "text": tweet_text,
                    "author": author_username,
                    "author_id": author_id,
                    "created_at": tweet_data.get("created_at"),
                    "media_urls": media_urls,
                    "has_media": len(media_urls) > 0,
                    "hashtags": hashtags,
                    "mentions": mentions
                }
                
            elif response.status_code == 429:
                # Rate limited - implement exponential backoff with longer delays
                wait_time = (2 ** attempt) * 10  # 10s, 20s, 40s
                print(f"   ⏳ Rate limited (429). Waiting {wait_time}s before retry...")
                time.sleep(wait_time)
                continue
                
            elif response.status_code == 404:
                print(f"   ❌ Tweet not found (404)")
                return None
                
            elif response.status_code == 401:
                print(f"   ❌ Twitter API authentication failed (401)")
                return None
                
            else:
                print(f"   ❌ Twitter API returned status {response.status_code}")
                if attempt < max_retries - 1:
                    wait_time = (2 ** attempt) * 5  # Shorter backoff for other errors
                    print(f"   ⏳ Waiting {wait_time}s before retry...")
                    time.sleep(wait_time)
                    continue
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Twitter API request failed: {e}")
            if attempt < max_retries - 1:
                wait_time = (2 ** attempt) * 5
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
        playwright_error = None

        try:
            # Run the async Playwright function
            playwright_result = asyncio.run(scrape_with_playwright(url))
        except Exception as e:
            playwright_error = str(e)
            print(f"   ❌ Playwright execution failed: {e}")

        # Step 2: Try Twitter API with better error handling
        api_result = None
        api_error = None
        
        # Only try API if Playwright failed or didn't get media
        if not playwright_result or (playwright_result.get("has_media") and not playwright_result.get("media_urls")):
            print(f"   🔄 Step 2: Trying Twitter API...")
            try:
                api_result = scrape_with_twitter_api(tweet_id)
            except Exception as e:
                api_error = str(e)
                print(f"   ❌ Twitter API execution failed: {e}")

        # Step 3: Combine results and return
        final_result = self._combine_results(
            playwright_result, api_result, url, tweet_id
        )

        # If both methods failed, create a better fallback
        if not playwright_result and not api_result:
            error_msg = "Both Playwright and Twitter API failed"
            if playwright_error:
                error_msg += f" (Playwright: {playwright_error})"
            if api_error:
                error_msg += f" (API: {api_error})"
            final_result = self._get_fallback_result(url, error_msg)

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
        tweet_id = extract_tweet_id_from_url(url)
        
        # Create a more meaningful fallback title
        if username:
            fallback_title = f"Tweet by @{username}"
        else:
            fallback_title = "Twitter/X Post"
            
        # Create a more descriptive fallback description
        if "rate limited" in error.lower() or "429" in error:
            fallback_description = "Content temporarily unavailable due to rate limiting. Please try again later."
        elif "playwright" in error.lower():
            fallback_description = "Content unavailable due to technical issues. Please try again later."
        else:
            fallback_description = f"Unable to scrape content: {error}"

        return {
            "url": url,
            "title": fallback_title,
            "description": fallback_description,
            "type": "post",
            "metadata": {
                "platform": "Twitter/X",
                "error": error,
                "scraping_method": "fallback",
                "tweet_id": tweet_id,
            },
            "transcript": None,
            "thumbnail": None,
            "hashtags": [],
            "mentions": [],
            "channel": username,  # Add username as channel
        }
