from .base import BaseScraper
import re
import asyncio
import json
from typing import Dict, Any, List, Optional
import urllib.parse
import requests
from playwright.async_api import async_playwright
import time
import random


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


async def scrape_instagram_with_playwright(url: str) -> Optional[Dict]:
    """Scrape Instagram using Playwright for better JavaScript handling."""
    try:
        async with async_playwright() as p:
            # Launch browser with stealth settings
            browser = await p.chromium.launch(
                headless=True,
                args=[
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding',
                    '--disable-features=TranslateUI',
                    '--disable-ipc-flooding-protection',
                ]
            )
            
            # Create context with realistic user agent
            context = await browser.new_context(
                user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                viewport={'width': 1920, 'height': 1080},
                locale='en-US',
                timezone_id='America/New_York',
            )
            
            # Add extra headers
            await context.set_extra_http_headers({
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            })
            
            page = await context.new_page()
            
            # Set up request interception to block unnecessary resources
            await page.route("**/*", lambda route: route.abort() 
                           if route.request.resource_type in ["image", "media", "font", "stylesheet"]
                           else route.continue_())
            
            print(f"   🌐 Navigating to Instagram page...")
            await page.goto(url, wait_until='networkidle', timeout=30000)
            
            # Wait for content to load
            await page.wait_for_timeout(3000)
            
            # Try to extract data from the page
            data = await page.evaluate("""
                () => {
                    const result = {
                        title: null,
                        description: null,
                        thumbnail: null,
                        username: null,
                        fullName: null,
                        isVideo: false,
                        isCarousel: false,
                        carouselCount: 0,
                        likes: null,
                        comments: null,
                        hashtags: [],
                        mentions: [],
                        error: null
                    };
                    
                    try {
                        // Try to get title from meta tags
                        const ogTitle = document.querySelector('meta[property="og:title"]');
                        if (ogTitle) {
                            result.title = ogTitle.getAttribute('content');
                        }
                        
                        // Try to get description from meta tags
                        const ogDescription = document.querySelector('meta[property="og:description"]');
                        if (ogDescription) {
                            let description = ogDescription.getAttribute('content');
                            
                            // Clean up the description to extract only the actual caption
                            if (description) {
                                // Remove patterns like "54K likes, 1,227 comments - username on date:"
                                description = description.replace(/^[0-9]+[KMB]?\\s+likes?,\\s+[0-9]+[KMB]?\\s+comments?\\s*-\\s*[^:]+:\\s*/, '');
                                
                                // Remove patterns like "username on Instagram:"
                                description = description.replace(/^[^:]+ on Instagram:[ \\s]*/, '');
                                
                                // Remove patterns like "username on date:"
                                description = description.replace(/^[^:]+ on [^:]+:[ \\s]*/, '');
                                
                                // Remove quotes at the beginning and end
                                description = description.replace(/^["']/, '').replace(/["']$/, '');
                                
                                // Trim whitespace
                                description = description.trim();
                                
                                // If the description is now empty or just contains hashtags, it means no caption
                                if (!description || description.length === 0 || description.match(/^[#@ \\s]+$/)) {
                                    description = '';
                                }
                            }
                            
                            result.description = description;
                        }
                        
                        // Also try to get the actual post caption from the page content
                        const captionSelectors = [
                            'article div[data-testid="post-caption"]',
                            'article div[role="button"]',
                            'article div[dir="auto"]'
                        ];
                        
                        for (const selector of captionSelectors) {
                            const elements = document.querySelectorAll(selector);
                            for (const element of elements) {
                                const text = element.textContent.trim();
                                if (text && text.length > 0 && !text.includes('likes') && !text.includes('comments')) {
                                    // This might be the actual caption
                                    result.description = text;
                                    break;
                                }
                            }
                            if (result.description && result.description !== '') break;
                        }
                        
                        // Try to get thumbnail from meta tags
                        const ogImage = document.querySelector('meta[property="og:image"]');
                        if (ogImage) {
                            result.thumbnail = ogImage.getAttribute('content');
                        }
                        
                        // Try to get username from the post author specifically
                        const usernameSelectors = [
                            'article header a[href^="/"]',
                            'header a[href^="/"]',
                            'a[href^="/"]',
                            'article header span',
                            'header span',
                            'span[dir="auto"]'
                        ];
                        
                        for (const selector of usernameSelectors) {
                            const elements = document.querySelectorAll(selector);
                            for (const element of elements) {
                                const text = element.textContent.trim();
                                const href = element.getAttribute('href');
                                
                                // Skip if text contains spaces (likely not a username)
                                if (text && !text.includes(' ') && text.length > 0 && text.length < 30) {
                                    let username = text.replace('@', '').trim();
                                    
                                    // Extract from href if available
                                    if (href && href.startsWith('/') && href.length > 1) {
                                        const hrefParts = href.split('/').filter(part => part.length > 0);
                                        if (hrefParts.length > 0) {
                                            username = hrefParts[0];
                                        }
                                    }
                                    
                                    // Validate username (should be alphanumeric with possible underscores)
                                    if (username && username.length > 0 && /^[a-zA-Z0-9._]+$/.test(username)) {
                                        result.username = username;
                                        break;
                                    }
                                }
                            }
                            if (result.username) break;
                        }
                        
                        // If we still don't have a username, try to extract from the URL path
                        if (!result.username) {
                            const currentUrl = window.location.pathname;
                            const urlParts = currentUrl.split('/').filter(part => part.length > 0);
                            if (urlParts.length > 0) {
                                const potentialUsername = urlParts[0];
                                if (/^[a-zA-Z0-9._]+$/.test(potentialUsername)) {
                                    result.username = potentialUsername;
                                }
                            }
                        }
                        
                        // If still no username, try to extract from the full URL
                        if (!result.username) {
                            const fullUrl = window.location.href;
                            const urlMatch = fullUrl.match(/instagram\\.com\\/([a-zA-Z0-9._]+)\\//);
                            if (urlMatch) {
                                const potentialUsername = urlMatch[1];
                                if (/^[a-zA-Z0-9._]+$/.test(potentialUsername)) {
                                    result.username = potentialUsername;
                                }
                            }
                        }
                        
                        // If still no username, try to extract from the title
                        if (!result.username && result.title) {
                            const titleMatch = result.title.match(/^([^:]+) on Instagram:/);
                            if (titleMatch) {
                                const potentialUsername = titleMatch[1].trim();
                                if (/^[a-zA-Z0-9._]+$/.test(potentialUsername)) {
                                    result.username = potentialUsername;
                                }
                            }
                        }
                        
                        // Debug: Log what we found
                        console.log('Debug - Username extraction:', {
                            username: result.username,
                            title: result.title,
                            url: window.location.href,
                            pathname: window.location.pathname
                        });
                        
                        // Check if it's a video
                        const videoElements = document.querySelectorAll('video');
                        if (videoElements.length > 0) {
                            result.isVideo = true;
                        }
                        
                        // Check if it's a carousel
                        const carouselIndicators = document.querySelectorAll('[data-testid="carousel-indicator"]');
                        if (carouselIndicators.length > 1) {
                            result.isCarousel = true;
                            result.carouselCount = carouselIndicators.length;
                        }
                        
                        // Try to extract likes
                        const likeElements = document.querySelectorAll('a[href*="/liked_by/"]');
                        if (likeElements.length > 0) {
                            const likeText = likeElements[0].textContent;
                            const likeMatch = likeText.match(/([0-9]+)/);
                            if (likeMatch) {
                                result.likes = parseInt(likeMatch[1]);
                            }
                        }
                        
                        // Extract hashtags and mentions from description
                        if (result.description) {
                            const hashtagPattern = /#([a-zA-Z0-9_]+)/g;
                            const mentionPattern = /@([a-zA-Z0-9_]+)/g;
                            
                            result.hashtags = result.description.match(hashtagPattern) || [];
                            result.mentions = result.description.match(mentionPattern) || [];
                        }
                        
                    } catch (error) {
                        result.error = error.message;
                    }
                    
                    return result;
                }
            """)
            
            await browser.close()
            return data
            
    except Exception as e:
        print(f"   ❌ Playwright scraping failed: {e}")
        return None


class InstagramScraper(BaseScraper):
    def __init__(self):
        # Add rate limiting delay
        self.last_request_time = 0
        self.min_delay = 2  # Minimum delay between requests in seconds

    def _rate_limit_delay(self):
        """Implement rate limiting to avoid Instagram's rate limits."""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        if time_since_last < self.min_delay:
            delay = self.min_delay - time_since_last + random.uniform(0.5, 1.5)
            print(f"   ⏳ Rate limiting: waiting {delay:.1f}s...")
            time.sleep(delay)
        
        self.last_request_time = time.time()

    def scrape(self, url: str) -> dict:
        print(f"\n📸 INSTAGRAM SCRAPING STARTED (Playwright-based)")
        print(f"   URL: {url}")

        # Apply rate limiting
        self._rate_limit_delay()

        # Extract shortcode for metadata
        shortcode = extract_shortcode_from_url(url)
        content_type = "reel" if is_reels_url(url) else "post"
        
        print(f"   🔍 Extracted shortcode: {shortcode}")
        print(f"   📱 Content type: {content_type}")

        # Try Playwright scraping
        print(f"   🌐 Attempting Playwright scraping...")
        playwright_data = asyncio.run(scrape_instagram_with_playwright(url))
        
        if playwright_data and not playwright_data.get('error'):
            print(f"   ✅ Playwright scraping successful")
            return self._build_result_from_playwright(url, playwright_data, shortcode, content_type)
        
        # Fallback to basic web scraping
        print(f"   🔄 Playwright failed, trying basic web scraping...")
        return self._fallback_web_scraping(url, shortcode, content_type)

    def _build_result_from_playwright(self, url: str, data: Dict, shortcode: str, content_type: str) -> Dict:
        """Build result from Playwright scraped data."""
        print(f"   📊 Processing Playwright data:")
        print(f"     Title: {data.get('title', 'N/A')}")
        print(f"     Username: {data.get('username', 'N/A')}")
        description = data.get('description', '')
        print(f"     Description length: {len(description) if description else 0} chars")
        print(f"     Is video: {data.get('isVideo', False)}")
        print(f"     Is carousel: {data.get('isCarousel', False)}")
        print(f"     Carousel count: {data.get('carouselCount', 0)}")
        print(f"     Likes: {data.get('likes', 'N/A')}")
        print(f"     Comments: {data.get('comments', 'N/A')}")
        print(f"     Hashtags: {data.get('hashtags', [])}")
        print(f"     Mentions: {data.get('mentions', [])}")

        # Build posting account info
        username = data.get('username', 'unknown')
        posting_account = {
            "username": username,
            "full_name": data.get('fullName', username),
            "profile_pic": None,  # Not available via web scraping
            "verified": False,     # Not available via web scraping
            "private": False,      # Not available via web scraping
            "followers": None,     # Not available via web scraping
            "following": None,     # Not available via web scraping
        }

        # Build title
        title = data.get('title')
        if not title and username != 'unknown':
            title = f"Instagram {content_type.title()} by @{username}"
        elif not title:
            title = f"Instagram {content_type.title()}"

        # Build description
        description = data.get('description', '')

        # Build metadata
        metadata = {
            "shortcode": shortcode,
            "webpage_url": url,
            "scraper": "playwright",
            "username": username,
            "is_video": data.get('isVideo', False),
            "is_carousel": data.get('isCarousel', False),
            "carousel_count": data.get('carouselCount', 0),
            "likes": data.get('likes'),
            "comments": data.get('comments'),
            "extracted_title": bool(data.get('title')),
            "extracted_description": bool(data.get('description')),
            "extracted_thumbnail": bool(data.get('thumbnail')),
        }

        # Build media content
        media_content = []
        if data.get('thumbnail'):
            media_item = {
                "index": 0,
                "type": "video" if data.get('isVideo') else "image",
                "url": data.get('thumbnail'),
                "video_url": None,
                "thumbnail": data.get('thumbnail'),
                "dimensions": {"width": None, "height": None},
            }
            media_content.append(media_item)

        return {
            "url": url,
            "title": title,
            "description": description,
            "type": content_type,
            "metadata": metadata,
            "transcript": None,
            "thumbnail": data.get('thumbnail'),
            "hashtags": data.get('hashtags', []),
            "mentions": data.get('mentions', []),
            "is_carousel": data.get('isCarousel', False),
            "carousel_count": data.get('carouselCount', 0),
            "posting_account": posting_account,
            "media_content": media_content,
        }

    def _fallback_web_scraping(self, url: str, shortcode: str, content_type: str) -> Dict:
        """Fallback to basic web scraping when Playwright fails."""
        print(f"   🔧 Using basic web scraping fallback...")
        
        try:
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
            response = requests.get(url, headers=headers, timeout=15)
            response.raise_for_status()
            
            # Parse with BeautifulSoup
            from bs4 import BeautifulSoup
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
                
                # Clean up the description to extract only the actual caption
                if description:
                    # Remove patterns like "54K likes, 1,227 comments - username on date:"
                    import re
                    description = re.sub(r'^\d+[KMB]?\s+likes?,\s+\d+[KMB]?\s+comments?\s*-\s*[^:]+:\s*', '', description)
                    
                    # Remove patterns like "username on Instagram:"
                    description = re.sub(r'^[^:]+ on Instagram:\s*', '', description)
                    
                    # Remove patterns like "username on date:"
                    description = re.sub(r'^[^:]+ on [^:]+:\s*', '', description)
                    
                    # Remove quotes at the beginning and end
                    description = description.strip('"\'')
                    
                    # Trim whitespace
                    description = description.strip()
                    
                    # If the description is now empty or just contains hashtags, it means no caption
                    if not description or description == '' or re.match(r'^[#@\s]+$', description):
                        description = ''
            
            # Try to get thumbnail from meta tags
            og_image = soup.find('meta', property='og:image')
            if og_image:
                thumbnail = og_image.get('content', '')
            
            # Extract hashtags and mentions from description
            hashtags = []
            mentions = []
            if description:
                hashtag_pattern = r'#(\w+)'
                hashtags = re.findall(hashtag_pattern, description)
                mention_pattern = r'@(\w+)'
                mentions = re.findall(mention_pattern, description)
            
            print(f"   ✅ Basic web scraping completed")
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
                    "scraper": "basic_web_scraping",
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
            print(f"   ❌ Basic web scraping failed: {e}")
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
