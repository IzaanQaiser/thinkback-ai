import re
import os
import json
import requests
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
            browser = await p.chromium.launch(headless=True)
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
                                    print(f"   🎥 Found video container image: {src}")
                        except:
                            pass

                    # Look for video thumbnails in the tweet area
                    tweet_area = await page.query_selector(
                        'article[data-testid="tweet"]'
                    )
                    if tweet_area:
                        # Look for any images that might be video thumbnails
                        all_images = await tweet_area.query_selector_all("img")
                        for img in all_images:
                            try:
                                src = await img.get_attribute("src")
                                alt = await img.get_attribute("alt") or ""

                                # Check if this looks like a video thumbnail
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
                                    and (
                                        "video" in src
                                        or "media" in alt.lower()
                                        or "play" in alt.lower()
                                    )
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
                                    print(
                                        f"   🎥 Found potential video thumbnail: {src}"
                                    )
                            except Exception as e:
                                print(f"   ⚠️ Error processing tweet image: {e}")

                # Method 3: Look for background images in CSS (but filter better)
                try:
                    # Get all elements that might have background images
                    elements_with_bg = await page.query_selector_all(
                        '[style*="background"], [class*="media"]'
                    )
                    for element in elements_with_bg:
                        try:
                            style = await element.get_attribute("style")
                            if style and "background-image" in style:
                                # Extract URL from background-image
                                match = re.search(
                                    r'url\(["\']?([^"\']+)["\']?\)', style
                                )
                                if match:
                                    bg_url = match.group(1)
                                    if (
                                        bg_url.startswith("http")
                                        and "twimg.com" in bg_url
                                        and "profile" not in bg_url
                                        and "avatar" not in bg_url
                                        and "icon" not in bg_url
                                        and "normal" not in bg_url
                                        and "bigger" not in bg_url
                                        and "mini" not in bg_url
                                    ):

                                        media_urls.append(bg_url)
                                        has_media = True
                                        print(f"   🖼️ Found background image: {bg_url}")
                        except:
                            pass
                except Exception as e:
                    print(f"   ⚠️ Error checking background images: {e}")

                # Method 4: Look for any img tags in the tweet area (improved filtering)
                if not media_urls:
                    tweet_area = await page.query_selector(
                        'article[data-testid="tweet"]'
                    )
                    if tweet_area:
                        all_images = await tweet_area.query_selector_all("img")
                        for img in all_images:
                            try:
                                src = await img.get_attribute("src")
                                alt = await img.get_attribute("alt") or ""

                                # Skip small icons and avatars with better filtering
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
                                ):  # Skip very short URLs

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
                                    has_media = True
                                    print(f"   🖼️ Found tweet image: {src}")
                            except Exception as e:
                                print(f"   ⚠️ Error processing image: {e}")

                # Method 5: Look for media containers (improved)
                media_containers = await page.query_selector_all(
                    '[data-testid="tweetPhoto"], [data-testid="image"], [data-testid="gif"]'
                )
                if media_containers:
                    has_media = True
                    print(f"   📷 Found media containers: {len(media_containers)}")

                    # Try to find images within these containers
                    for container in media_containers:
                        try:
                            img = await container.query_selector("img")
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
                                    print(f"   🖼️ Found container image: {src}")
                        except:
                            pass

                # Method 6: Look specifically for media in the tweet content area
                try:
                    # Look for the main tweet content area
                    tweet_content = await page.query_selector(
                        '[data-testid="tweet"] [data-testid="tweetText"]'
                    )
                    if tweet_content:
                        # Find the parent article and look for media within it
                        article = await tweet_content.query_selector(
                            "xpath=ancestor::article"
                        )
                        if article:
                            # Look for media elements that are siblings or children of the tweet content
                            media_siblings = await article.query_selector_all(
                                '[data-testid="tweetPhoto"], [data-testid="videoPlayer"], [data-testid="gif"]'
                            )
                            for media_elem in media_siblings:
                                try:
                                    # Look for images within this media element
                                    img = await media_elem.query_selector("img")
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
                                            print(f"   🖼️ Found content media: {src}")
                                except:
                                    pass
                except Exception as e:
                    print(f"   ⚠️ Error checking tweet content media: {e}")

                # Method 7: Aggressive media search - look for any image that might be media
                if not media_urls:
                    print(f"   🔍 Performing aggressive media search...")
                    try:
                        # Get all images on the page and filter more carefully
                        all_page_images = await page.query_selector_all("img")
                        for img in all_page_images:
                            try:
                                src = await img.get_attribute("src")
                                alt = await img.get_attribute("alt") or ""

                                # More permissive filtering - look for any image that could be media
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
                                    and not any(
                                        skip in src
                                        for skip in [
                                            "_normal",
                                            "_bigger",
                                            "_mini",
                                            "_small",
                                        ]
                                    )
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
                                    print(f"   🖼️ Found potential media: {src}")
                            except Exception as e:
                                print(f"   ⚠️ Error in aggressive search: {e}")
                    except Exception as e:
                        print(f"   ⚠️ Error in aggressive media search: {e}")

                # Method 8: Look for media in data attributes
                try:
                    # Some Twitter media might be stored in data attributes
                    media_elements = await page.query_selector_all(
                        '[data-testid*="media"], [data-testid*="photo"], [data-testid*="video"]'
                    )
                    for elem in media_elements:
                        try:
                            # Check for data attributes that might contain media URLs
                            data_src = await elem.get_attribute("data-src")
                            if (
                                data_src
                                and data_src.startswith("http")
                                and "twimg.com" in data_src
                            ):
                                media_urls.append(data_src)
                                print(f"   🖼️ Found data-src media: {data_src}")
                        except:
                            pass
                except Exception as e:
                    print(f"   ⚠️ Error checking data attributes: {e}")

            except Exception as e:
                print(f"   ⚠️ Could not check for media: {e}")

            # Extract author info
            author = ""
            try:
                author_selectors = [
                    '[data-testid="User-Name"] a',
                    '[data-testid="User-Name"] span',
                    'a[data-testid="User-Name"]',
                ]

                for selector in author_selectors:
                    try:
                        element = await page.wait_for_selector(selector, timeout=3000)
                        if element:
                            author = await element.inner_text()
                            break
                    except:
                        continue

            except Exception as e:
                print(f"   ⚠️ Could not extract author: {e}")

            await browser.close()

            # Remove duplicates from media URLs
            media_urls = list(set(media_urls))

            if tweet_text or has_media:
                print(f"   ✅ Playwright scraping successful")
                print(f"   📝 Tweet text length: {len(tweet_text)}")
                print(f"   🖼️ Has media: {has_media}")
                print(f"   🖼️ Media URLs found: {len(media_urls)}")
                print(f"   👤 Author: {author}")

                return {
                    "text": tweet_text,
                    "author": author,
                    "has_media": has_media,
                    "media_urls": media_urls,
                    "scraping_method": "playwright",
                }
            else:
                print(f"   ⚠️ Playwright found no content")
                return None

    except Exception as e:
        print(f"   ❌ Playwright scraping failed: {e}")
        return None


def scrape_with_twitter_api(tweet_id: str) -> Optional[Dict]:
    """Scrape tweet using Twitter API v2 as fallback."""
    bearer_token = os.environ.get("TWITTER_BEARER_TOKEN")
    if not bearer_token:
        print(f"   ❌ Twitter Bearer Token not found in environment")
        return None

    try:
        url = f"https://api.twitter.com/2/tweets/{tweet_id}?expansions=attachments.media_keys&media.fields=url,type,preview_image_url&tweet.fields=text,author_id,created_at"

        headers = {
            "Authorization": f"Bearer {bearer_token}",
            "User-Agent": "ThinkbackAI/1.0",
        }

        print(f"   🔄 Trying Twitter API v2...")
        response = requests.get(url, headers=headers, timeout=10)

        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Twitter API response received")

            tweet_data = data.get("data", {})
            includes = data.get("includes", {})
            media = includes.get("media", [])

            tweet_text = tweet_data.get("text", "")
            author_id = tweet_data.get("author_id", "")
            created_at = tweet_data.get("created_at", "")

            # Extract media URLs
            media_urls = []
            for media_item in media:
                media_type = media_item.get("type", "")
                if media_type == "photo":
                    url = media_item.get("url")
                    if url:
                        media_urls.append(url)
                elif media_type == "video":
                    preview_url = media_item.get("preview_image_url")
                    if preview_url:
                        media_urls.append(preview_url)
                elif media_type == "animated_gif":
                    url = media_item.get("url")
                    if url:
                        media_urls.append(url)

            has_media = len(media_urls) > 0

            print(f"   📝 Tweet text length: {len(tweet_text)}")
            print(f"   🖼️ Has media: {has_media}")
            print(f"   🖼️ Media URLs found: {len(media_urls)}")

            return {
                "text": tweet_text,
                "author_id": author_id,
                "created_at": created_at,
                "has_media": has_media,
                "media_urls": media_urls,
                "scraping_method": "twitter_api",
            }
        else:
            print(f"   ❌ Twitter API returned status {response.status_code}")
            return None

    except Exception as e:
        print(f"   ❌ Twitter API scraping failed: {e}")
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

        # Step 2: Determine if we need API fallback
        needs_api_fallback = False

        if playwright_result:
            # If Playwright found content but detected media, we might need API for better media URLs
            if playwright_result.get("has_media") and not playwright_result.get(
                "media_urls"
            ):
                print(f"   🔄 Media detected but no URLs found, trying API fallback...")
                needs_api_fallback = True
            # Also try API if we found some media but want to get more complete data
            elif (
                playwright_result.get("has_media")
                and len(playwright_result.get("media_urls", [])) < 2
            ):
                print(
                    f"   🔄 Media found but limited URLs, trying API for complete data..."
                )
                needs_api_fallback = True
        else:
            # If Playwright completely failed, try API
            print(f"   🔄 Playwright failed, trying API fallback...")
            needs_api_fallback = True

        # Step 3: Try Twitter API if needed
        api_result = None
        if needs_api_fallback:
            api_result = scrape_with_twitter_api(tweet_id)

        # Step 4: Combine results and return
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

        # Extract hashtags and mentions
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
