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

            # Enhanced media extraction with priority logic
            has_media = False
            media_urls = []
            video_count = 0
            image_count = 0

            try:
                print(f"   🔍 Analyzing media content...")

                # Step 1: Count video elements first
                video_elements = await page.query_selector_all(
                    '[data-testid="videoPlayer"], video, [data-testid="video"]'
                )
                video_count = len(video_elements)
                print(f"   🎥 Found {video_count} video elements")

                # Step 2: Count image elements
                tweet_images = await page.query_selector_all(
                    '[data-testid="tweetPhoto"], [data-testid="tweet"] img, article img'
                )
                print(f"   📊 Found {len(tweet_images)} potential tweet images")
                
                # Collect media images only (filter out profile images)
                media_images = []
                for img in tweet_images:
                    try:
                        src = await img.get_attribute("src")
                        if src and src.startswith("http"):
                            # Clean up the URL to get the best quality version
                            if "?format=" in src:
                                src = (
                                    src.split("?format=")[0] + "?format=jpg&name=large"
                                )
                            elif "&format=" in src:
                                src = (
                                    src.split("&format=")[0] + "?format=jpg&name=large"
                                )
                            else:
                                src = src + "?format=jpg&name=large"
                            
                            # Only collect media images (ignore profile images)
                            url_path = src.split('?')[0].lower()
                            if "/media/" in url_path:
                                media_images.append(src)
                                print(f"   🖼️ Found media image: {src}")
                            else:
                                print(f"   ⚠️ Skipping non-media image: {src[:50]}...")
                                
                    except Exception as e:
                        print(f"   ⚠️ Error extracting embedded image: {e}")
                
                image_count = len(media_images)
                print(f"   📸 Found {image_count} media images")

                # Step 3: Apply priority logic
                if video_count > 0:
                    # Has video - don't grab random images, let Twitter API handle thumbnail
                    has_media = True
                    print(f"   🎥 Priority: Video detected - skipping image extraction, will try Twitter API for thumbnail")
                    # Don't add any media URLs - let Twitter API handle video thumbnails
                    
                elif image_count > 0:
                    # Has image - use media image
                    has_media = True
                    media_urls.extend(media_images)
                    print(f"   ✅ Using media image as thumbnail")
                    
                else:
                    # No media at all - will use default X logo
                    print(f"   📱 No media found - will use default X logo")

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
                    "video_count": video_count,
                    "image_count": image_count
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

    # Use simplest possible request to avoid rate limiting
    # We'll get basic tweet data and extract what we can
    url = f"https://api.twitter.com/2/tweets/{tweet_id}"
    
    headers = {
        "Authorization": f"Bearer {twitter_bearer_token}"
        # Removed custom User-Agent to avoid rate limiting
    }
    
    # No parameters - simplest request possible
    params = {}

    # For video cases, only try once
    actual_retries = 1 if max_retries == 1 else max_retries
    
    for attempt in range(actual_retries):
        try:
            print(f"   📡 API request attempt {attempt + 1}/{actual_retries}")
            response = requests.get(url, headers=headers, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Twitter API request successful")
                
                # Extract tweet data
                tweet_data = data.get("data", {})
                
                # Extract text
                tweet_text = tweet_data.get("text", "")
                
                # Extract media - only for video cases
                media_urls = []
                video_count = 0
                image_count = 0
                
                # Only extract media if we're looking for video thumbnails
                if "attachments" in tweet_data and "media_keys" in tweet_data["attachments"]:
                    media_keys = tweet_data["attachments"]["media_keys"]
                    if "media" in includes:
                        # Count and extract video thumbnails only
                        for media in includes["media"]:
                            if media.get("media_key") in media_keys:
                                media_type = media.get("type", "")
                                if media_type == "video":
                                    video_count += 1
                                    # Extract video thumbnail
                                    video_thumbnail = media.get("preview_image_url") or media.get("url")
                                    if video_thumbnail:
                                        media_urls.append(video_thumbnail)
                                        print(f"   🎥 API: Found video thumbnail: {video_thumbnail}")
                                        break
                                elif media_type == "photo":
                                    image_count += 1
                        
                        print(f"   🎥 API: Found {video_count} video elements")
                        print(f"   📸 API: Found {image_count} image elements")
                
                # Extract hashtags and mentions from text
                hashtags = []
                mentions = []
                
                # Simple regex extraction for hashtags and mentions
                import re
                hashtags = re.findall(r'#(\w+)', tweet_text)
                mentions = re.findall(r'@(\w+)', tweet_text)
                
                return {
                    "text": tweet_text,
                    "author": "Unknown",  # Will be "Unknown" since we don't have user data
                    "author_id": None,  # Not available in simple request
                    "created_at": None,  # Not available in simple request
                    "media_urls": media_urls,
                    "has_media": len(media_urls) > 0,
                    "hashtags": hashtags,
                    "mentions": mentions,
                    "video_count": video_count,
                    "image_count": image_count
                }
                
            elif response.status_code == 429:
                # Rate limited - return immediately for video cases
                print(f"   ⏭️ Rate limited (429) - skipping Twitter API")
                return None
                
            elif response.status_code == 404:
                print(f"   ❌ Tweet not found (404)")
                return None
                
            elif response.status_code == 401:
                print(f"   ❌ Twitter API authentication failed (401)")
                return None
                
            else:
                print(f"   ❌ Twitter API returned status {response.status_code}")
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Twitter API request failed: {e}")
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

        # Step 2: Try Twitter API only for video thumbnails
        api_result = None
        api_error = None
        
        # Only try API if we detected video elements but no media URLs
        should_try_api = False
        if playwright_result and playwright_result.get("video_count", 0) > 0 and not playwright_result.get("media_urls"):
            should_try_api = True
            print(f"   🔄 Step 2: Trying Twitter API once (video detected but no thumbnail)...")
        elif not playwright_result:
            should_try_api = True
            print(f"   🔄 Step 2: Trying Twitter API (Playwright failed)...")
        else:
            print(f"   ⏭️ Skipping Twitter API - Playwright got good results")

        if should_try_api:
            try:
                # For video cases, only try once
                max_retries = 1 if playwright_result and playwright_result.get("video_count", 0) > 0 else 3
                api_result = scrape_with_twitter_api(tweet_id, max_retries)
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

        # Remove duplicates and filter out profile images while preserving order
        seen = set()
        unique_media_urls = []
        for url in media_urls:
            if url not in seen:
                # Filter out profile images
                url_path = url.split('?')[0].lower()
                if "/profile_images/" not in url_path and "/avatar/" not in url_path:
                    seen.add(url)
                    unique_media_urls.append(url)
                else:
                    print(f"   ⚠️ Filtering out profile image: {url[:50]}...")

        if unique_media_urls:
            result["thumbnail"] = unique_media_urls[0]  # Use first media as thumbnail
            print(f"   ✅ Using thumbnail: {unique_media_urls[0]}")
        else:
            print(f"   📱 No valid media found - will use default X logo")

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
