from .base import BaseScraper
import requests
import re
from bs4 import BeautifulSoup
from urllib.parse import urlparse, parse_qs
import json
import time
import random
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, WebDriverException
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def extract_post_id(url: str) -> str:
    """Extract LinkedIn post ID from URL."""
    patterns = [
        r'linkedin\.com/posts/[^/]+_([^-]+)-activity-([^?]+)',
        r'linkedin\.com/posts/[^/]+_([^-]+)-activity-([^?]+)\?',
        r'linkedin\.com/posts/[^/]+_([^-]+)-ugcPost-([^?]+)',
        r'linkedin\.com/posts/[^/]+_([^-]+)-ugcPost-([^?]+)\?',
        r'linkedin\.com/feed/update/urn:li:activity:([^/?]+)',
        r'linkedin\.com/posts/[^/]+-activity-([^?]+)',
        r'linkedin\.com/posts/[^/]+-ugcPost-([^?]+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            if len(match.groups()) > 1:
                return f"{match.group(1)}-{match.group(2)}"
            return match.group(1)
    
    # Handle activity- and ugcPost- patterns
    for pattern_type in ['activity-', 'ugcPost-']:
        if pattern_type in url:
            pattern_part = url.split(pattern_type)[1]
            if '?' in pattern_part:
                return pattern_part.split('?')[0]
            return pattern_part
    
    return ""


def clean_text(text: str) -> str:
    """Clean and normalize text content."""
    if not text:
        return ""
    
    text = re.sub(r'\s+', ' ', text.strip())
    text = re.sub(r'^(Kevin|John|Jane|etc\.)\s+on\s+[^:]+:\s*', '', text)
    return text


def get_enhanced_headers():
    """Get enhanced headers that mimic a real browser."""
    user_agents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ]
    
    return {
        'User-Agent': random.choice(user_agents),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
    }


def create_session():
    """Create a requests session with proper configuration."""
    session = requests.Session()
    session.headers.update(get_enhanced_headers())
    
    # Add some basic cookies that LinkedIn expects
    session.cookies.set('li_gc', '2', domain='.linkedin.com')
    session.cookies.set('JSESSIONID', 'ajax:' + str(random.randint(1000000, 9999999)), domain='.linkedin.com')
    
    return session


def extract_author_name_requests(soup: BeautifulSoup) -> str:
    """Extract author name using requests approach."""
    logger.info("🔍 Extracting author name from LinkedIn post...")
    
    # Priority selectors for author name
    selectors = [
        'div[class*="feed-shared-update-v2__actor"] a',
        'div[class*="feed-shared-actor"] a',
        'div[class*="update-components-actor"] a',
        'div[class*="post-actor"] a',
        'div[class*="feed-shared-update-v2__actor"] span a',
        'div[class*="feed-shared-actor"] span a',
        'div[class*="update-components-actor"] span a',
        'div[class*="post-actor"] span a',
        'h3 a[href*="/in/"]',
        'h3 a[href*="/company/"]',
        'span a[href*="/in/"]',
        'span a[href*="/company/"]',
        'div[class*="post-header"] a',
        'div[class*="post-meta"] a',
    ]
    
    for i, selector in enumerate(selectors):
        element = soup.select_one(selector)
        if element:
            text = element.get_text(strip=True)
            if text and len(text) > 0:
                # Skip comment authors and generic links
                element_classes = element.get('class', [])
                element_classes_str = ' '.join(element_classes).lower()
                
                if any(cls in element_classes_str for cls in ['comment', 'reply', 'response']):
                    logger.debug(f"⏭️ Skipping comment author with selector {i+1}: '{text}'")
                    continue
                
                if text.lower() in ['view profile', 'follow', 'message', 'connect']:
                    logger.debug(f"⏭️ Skipping generic link with selector {i+1}: '{text}'")
                    continue
                
                logger.info(f"✅ Found author with selector {i+1}: '{text}'")
                return clean_text(text)
    
    # Fallback: look for any link that might be the author
    logger.info("🔍 Trying fallback author detection...")
    author_links = soup.find_all('a', href=re.compile(r'/(in|company)/'))
    
    for link in author_links:
        text = link.get_text(strip=True)
        if text and len(text) > 0:
            element_classes = link.get('class', [])
            element_classes_str = ' '.join(element_classes).lower()
            
            if any(cls in element_classes_str for cls in ['comment', 'reply', 'response']):
                continue
            
            if text.lower() in ['view profile', 'follow', 'message', 'connect']:
                continue
            
            logger.info(f"✅ Found author with fallback link: '{text}'")
            return clean_text(text)
    
    logger.warning("❌ Could not find author name")
    return "Unknown Author"


def extract_post_content_requests(soup: BeautifulSoup) -> str:
    """Extract post content using requests approach."""
    logger.info("🔍 Extracting post content...")
    
    # Priority selectors for post content
    selectors = [
        'div[class*="feed-shared-update-v2__description"] span',
        'div[class*="feed-shared-update-v2__description"] div',
        'div[class*="feed-shared-text"] span',
        'div[class*="feed-shared-text"] div',
        'div[class*="update-components-text"] span',
        'div[class*="update-components-text"] div',
        'div[class*="post-content"] p',
        'div[class*="post-content"] div',
        'div[class*="content"] p',
        'div[class*="text"] p',
        'article p',
        'div[class*="post"] p',
    ]
    
    content_parts = []
    
    for selector in selectors:
        elements = soup.select(selector)
        for element in elements:
            text = element.get_text(strip=True)
            if text and len(text) > 10:  # Only include substantial text
                content_parts.append(text)
    
    # If no content found with selectors, try broader approach
    if not content_parts:
        paragraphs = soup.find_all('p')
        for p in paragraphs:
            text = p.get_text(strip=True)
            if text and len(text) > 20:  # Substantial text
                content_parts.append(text)
    
    content = ' '.join(content_parts) if content_parts else ""
    logger.info(f"📝 Content length: {len(content)} characters")
    return content


def extract_carousel_images(soup: BeautifulSoup) -> list:
    """Extract images from LinkedIn carousels, prioritizing the first image (index 0)."""
    logger.info("🎠 Searching for carousel images...")
    carousel_images = []
    found_urls = set()  # Track found URLs to avoid duplicates
    
    # Look for carousel containers
    carousel_selectors = [
        'div[class*="carousel"]',
        'div[class*="ssplayer-carousel"]',
        'ul[class*="carousel-track"]',
        'div[class*="feed-shared-carousel"]',
        'div[class*="update-components-carousel"]'
    ]
    
    for selector in carousel_selectors:
        carousels = soup.select(selector)
        for carousel in carousels:
            logger.info(f"🎠 Found carousel: {carousel.get('class', [])}")
            
            # Look for slides with data-ssplayer-slide-index="0" (first image)
            first_slide = carousel.find('li', attrs={'data-ssplayer-slide-index': '0'})
            if first_slide:
                logger.info("🎯 Found first carousel slide (index 0)")
                
                # Look for image within the first slide
                img = first_slide.find('img')
                if img:
                    src = img.get('src') or img.get('data-src') or img.get('data-lazy-src')
                    if src and not src.startswith('data:') and src not in found_urls:
                        logger.info(f"🎯 Found carousel image: {src[:100]}...")
                        carousel_images.append({
                            'type': 'image',
                            'url': src,
                            'alt': img.get('alt', ''),
                            'priority': 'carousel_first',
                            'carousel_index': 0
                        })
                        found_urls.add(src)
                        # Only take the first carousel image
                        break
            
            # If no specific index found, try to get the first slide anyway
            if not carousel_images:
                slides = carousel.find_all('li', class_='carousel-slide')
                if slides:
                    first_slide = slides[0]
                    img = first_slide.find('img')
                    if img:
                        src = img.get('src') or img.get('data-src') or img.get('data-lazy-src')
                        if src and not src.startswith('data:') and src not in found_urls:
                            logger.info(f"🎯 Found first carousel slide: {src[:100]}...")
                            carousel_images.append({
                                'type': 'image',
                                'url': src,
                                'alt': img.get('alt', ''),
                                'priority': 'carousel_first',
                                'carousel_index': 0
                            })
                            found_urls.add(src)
    
    return carousel_images


def extract_media_urls_requests(soup: BeautifulSoup) -> list:
    """Extract media URLs using requests approach."""
    logger.info("🔍 Searching for media in HTML...")
    media_urls = []
    
    # First, look for carousel images (highest priority)
    carousel_images = extract_carousel_images(soup)
    if carousel_images:
        logger.info(f"🎠 Found {len(carousel_images)} carousel images")
        media_urls.extend(carousel_images)
    
    # Look for regular images - prioritize post content images
    images = soup.find_all('img')
    logger.info(f"📸 Found {len(images)} total images")
    
    for img in images:
        src = img.get('src') or img.get('data-src') or img.get('data-lazy-src') or img.get('data-delayed-url')
        if src and not src.startswith('data:'):
            # Skip obvious UI elements and sidebar/profile images
            skip_patterns = [
                'avatar', 'icon', 'logo', 'profile-displaybackgroundimage', 'profile-picture',
                'profile-displayphoto', 'profile-photo', 'profile-image', 'profile-pic',
                'static.licdn.com/aero-v1/sc/h/', 'comment-image', 'sidebar', 'widget',
                'feed-shared-actor__avatar', 'feed-shared-actor__image', 'actor-avatar',
                'update-components-actor__avatar', 'post-actor__avatar', 'author-avatar',
                'feed-shared-actor__image', 'update-components-actor__image', 'post-actor__image',
                'author-image', 'user-avatar', 'user-image', 'member-avatar', 'member-image',
                'company-logo', 'organization-logo', 'brand-logo', 'entity-logo',
                'feed-shared-actor__background-image', 'profile-displaybackgroundimage',
                'feed-shared-actor__background', 'actor-background', 'author-background',
                'user-background', 'member-background', 'company-background', 'organization-background'
            ]
            
            should_skip = any(pattern in src.lower() for pattern in skip_patterns)
            if should_skip:
                logger.debug(f"⏭️ Skipping UI/sidebar image: {src[:50]}...")
                continue
            
            # Check if this looks like a post content image
            parent_classes = []
            parent = img.parent
            for _ in range(5):
                if parent:
                    parent_classes.extend(parent.get('class', []))
                    parent = parent.parent
            
            # Improved priority detection for post content images
            priority = 'low'
            url_lower = src.lower()
            parent_classes_lower = [cls.lower() for cls in parent_classes]
            
            # Highest priority: feedshare images (main post content)
            if 'feedshare' in url_lower:
                priority = 'highest'
            # High priority: article cover images
            elif 'article-cover_image' in url_lower:
                priority = 'highest'
            # High priority: post content images with specific patterns
            elif any('post' in cls or 'content' in cls or 'feed' in cls or 'update' in cls for cls in parent_classes_lower):
                priority = 'high'
            elif 'image-shrink_800' in url_lower or 'image-shrink_1280' in url_lower:
                priority = 'high'
            elif 'dms/image' in url_lower and not any(skip in url_lower for skip in ['avatar', 'profile-displaybackgroundimage']):
                priority = 'medium'
            # Additional patterns for post content images
            elif any('feed-shared' in cls or 'update-components' in cls or 'post-content' in cls for cls in parent_classes_lower):
                priority = 'high'
            elif 'image-shrink_480' in url_lower or 'image-shrink_640' in url_lower:
                priority = 'medium'
            
            # Additional filtering: skip if it's clearly a profile/sidebar image
            if any('actor' in cls or 'profile' in cls or 'sidebar' in cls or 'widget' in cls for cls in parent_classes_lower):
                if priority != 'highest':  # Only skip if not highest priority
                    logger.debug(f"⏭️ Skipping profile/sidebar image: {src[:50]}...")
                    continue
            
            if priority == 'highest':
                logger.info(f"🎯 Highest priority image found: {src[:100]}...")
                media_urls.insert(0, {
                    'type': 'image',
                    'url': src,
                    'alt': img.get('alt', ''),
                    'priority': 'highest'
                })
            elif priority == 'high':
                logger.info(f"✅ High priority image found: {src[:100]}...")
                media_urls.insert(0, {
                    'type': 'image',
                    'url': src,
                    'alt': img.get('alt', ''),
                    'priority': 'high'
                })
            else:
                logger.debug(f"📸 {priority.capitalize()} priority image: {src[:100]}...")
                media_urls.append({
                    'type': 'image',
                    'url': src,
                    'alt': img.get('alt', ''),
                    'priority': priority
                })
    
    # Look for videos
    videos = soup.find_all(['video', 'iframe'])
    logger.info(f"🎥 Found {len(videos)} videos/iframes")
    
    for video in videos:
        src = video.get('src') or video.get('data-src')
        if src:
            logger.info(f"🎥 Video found: {src[:100]}...")
            media_urls.append({
                'type': 'video',
                'url': src,
                'alt': video.get('alt', ''),
                'priority': 'medium'
            })
    
    logger.info(f"📊 Total media items found: {len(media_urls)}")
    return media_urls


def get_best_thumbnail(media_urls: list, url: str = "") -> str:
    """Get the best thumbnail from media URLs."""
    if not media_urls:
        return ""
    
    # Prioritize carousel images, then post content images, then profile photos
    carousel_images = []
    highest_priority_images = []
    post_content_images = []
    profile_images = []
    other_images = []
    
    # Enhanced filtering patterns for profile/sidebar images
    profile_patterns = [
        'profile-displayphoto', 'profile-displaybackgroundimage', 'profile-photo', 
        'profile-image', 'profile-pic', 'avatar', 'actor-avatar', 'author-avatar',
        'user-avatar', 'member-avatar', 'feed-shared-actor__avatar', 
        'update-components-actor__avatar', 'post-actor__avatar', 'author-image',
        'user-image', 'member-image', 'feed-shared-actor__image', 
        'update-components-actor__image', 'post-actor__image', 'company-logo',
        'organization-logo', 'brand-logo', 'entity-logo', 'sidebar', 'widget'
    ]
    
    for media in media_urls:
        url_lower = media['url'].lower()
        
        # Skip profile/sidebar images unless they're highest priority
        is_profile_image = any(pattern in url_lower for pattern in profile_patterns)
        
        if is_profile_image and media.get('priority') not in ['highest', 'carousel_first']:
            logger.debug(f"⏭️ Skipping profile/sidebar image in thumbnail selection: {url_lower[:50]}...")
            continue
        elif media.get('priority') == 'carousel_first':
            carousel_images.append(media)
        elif 'profile-displayphoto' in url_lower or 'profile-displaybackgroundimage' in url_lower:
            profile_images.append(media)
        elif media.get('priority') == 'highest':
            highest_priority_images.append(media)
        elif 'articleshare' in url_lower or 'image-shrink_480' in url_lower or 'image-shrink_800' in url_lower:
            post_content_images.append(media)
        elif 'comment-image' in url_lower:
            continue
        elif 'static.licdn.com/aero-v1/sc/h/' in url_lower:
            continue
        else:
            if media.get('priority') == 'high':
                post_content_images.append(media)
            else:
                other_images.append(media)
    
    # Return carousel image first, then highest priority, then post content, then profile
    if carousel_images:
        logger.info(f"🎠 Selected carousel image: {carousel_images[0]['url'][:100]}...")
        return carousel_images[0]['url']
    elif highest_priority_images:
        logger.info(f"🎯 Selected highest priority image: {highest_priority_images[0]['url'][:100]}...")
        return highest_priority_images[0]['url']
    elif post_content_images:
        logger.info(f"🎯 Selected post content image: {post_content_images[0]['url'][:100]}...")
        return post_content_images[0]['url']
    elif profile_images:
        logger.info(f"🎯 Selected profile image: {profile_images[0]['url'][:100]}...")
        return profile_images[0]['url']
    elif other_images:
        logger.info(f"🎯 Selected other image: {other_images[0]['url'][:100]}...")
        return other_images[0]['url']
    
    return media_urls[0]['url'] if media_urls else ""


def setup_selenium_driver():
    """Set up Selenium WebDriver with proper options."""
    chrome_options = Options()
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--disable-extensions')
    chrome_options.add_argument('--disable-plugins')
    chrome_options.add_argument('--disable-images')  # Speed up loading
    chrome_options.add_argument('--disable-javascript')  # We'll enable this selectively
    chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    chrome_options.add_argument('--headless')  # Run in background
    chrome_options.add_argument('--disable-web-security')
    chrome_options.add_argument('--allow-running-insecure-content')
    chrome_options.add_argument('--disable-features=VizDisplayCompositor')
    
    try:
        driver = webdriver.Chrome(options=chrome_options)
        driver.set_page_load_timeout(30)
        driver.set_script_timeout(30)
        return driver
    except Exception as e:
        logger.error(f"❌ Failed to create Selenium driver: {e}")
        return None


def extract_with_selenium(url: str) -> dict:
    """Extract LinkedIn post data using Selenium as fallback."""
    logger.info("🤖 Using Selenium fallback for LinkedIn scraping...")
    
    driver = setup_selenium_driver()
    if not driver:
        return {"error": "Failed to create Selenium driver"}
    
    try:
        # Navigate to the page
        driver.get(url)
        
        # Wait for content to load with multiple possible selectors
        wait = WebDriverWait(driver, 15)
        
        # Try multiple selectors for content that might be present
        content_selectors = [
            'div[class*="feed-shared-update-v2__description"]',
            'div[class*="feed-shared-actor"]',
            'h3 a',
            'div[class*="post-content"]',
            'div[class*="update-components-text"]',
            'div[class*="feed-shared-text"]',
            'body'  # Fallback to just wait for body
        ]
        
        content_found = False
        for selector in content_selectors:
            try:
                wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, selector)))
                logger.info(f"✅ Found content with selector: {selector}")
                content_found = True
                break
            except TimeoutException:
                logger.debug(f"⏰ Timeout waiting for selector: {selector}")
                continue
        
        if not content_found:
            logger.warning("⏰ Timeout waiting for content to load")
        
        # Add a small delay to ensure JavaScript execution
        time.sleep(2)
        
        # Get the page source after JavaScript execution
        page_source = driver.page_source
        
        # Check if we got a meaningful page
        if len(page_source) < 1000:
            logger.warning("⚠️ Page source seems too small, might be an error page")
            return {"error": "Page source too small, likely an error page"}
        
        soup = BeautifulSoup(page_source, 'html.parser')
        
        # Extract data using the same functions
        author_name = extract_author_name_requests(soup)
        post_content = extract_post_content_requests(soup)
        media_urls = extract_media_urls_requests(soup)
        thumbnail = get_best_thumbnail(media_urls, url)
        
        # Check if we got meaningful data
        has_content = len(post_content.strip()) > 20
        has_author = author_name != "Unknown Author"
        
        if not has_content and not has_author:
            logger.warning("⚠️ Selenium didn't get meaningful data")
            return {"error": "Selenium couldn't extract meaningful data"}
        
        # Generate title
        if post_content:
            title = post_content[:100].strip()
            if len(post_content) > 100:
                title += "..."
        else:
            title = f"LinkedIn post by {author_name}"
        
        result = {
            "url": url,
            "title": title,
            "channel": author_name,
            "description": post_content,
            "thumbnail": thumbnail,
            "type": "post",
            "metadata": {
                "post_id": extract_post_id(url),
                "platform": "LinkedIn",
                "method": "selenium"
            }
        }
        
        if media_urls:
            result["metadata"]["media_count"] = len(media_urls)
            result["metadata"]["media_types"] = list(set(m['type'] for m in media_urls))
        
        logger.info("✅ Selenium scraping completed successfully")
        return result
        
    except Exception as e:
        logger.error(f"❌ Selenium scraping failed: {e}")
        return {"error": f"Selenium scraping failed: {str(e)}"}
    finally:
        try:
            driver.quit()
        except:
            pass


class LinkedInScraper(BaseScraper):
    def scrape(self, url: str) -> dict:
        """
        Scrape LinkedIn post content using hybrid approach.
        Tries requests first, falls back to Selenium if needed.
        """
        logger.info(f"🔍 Starting LinkedIn scraping for: {url}")
        
        post_id = extract_post_id(url)
        if not post_id:
            logger.error(f"❌ Could not extract post ID from URL: {url}")
            return {"error": "Could not extract post ID from URL"}
        
        logger.info(f"📝 Post ID: {post_id}")
        
        # Initialize result structure
        result = {
            "url": url,
            "title": None,
            "channel": None,
            "description": None,
            "thumbnail": None,
            "type": "post",
            "metadata": {
                "post_id": post_id,
                "platform": "LinkedIn",
                "method": "requests"
            }
        }
        
        # Try requests approach first
        logger.info("🔄 Trying requests-based approach...")
        try:
            session = create_session()
            
            # Add random delay to avoid detection
            time.sleep(random.uniform(1, 3))
            
            response = session.get(url, timeout=15)
            response.raise_for_status()
            
            logger.info(f"✅ Response status: {response.status_code}")
            logger.info(f"📄 Content length: {len(response.text)} characters")
            
            # Check if we got a meaningful response
            if len(response.text) < 1000:
                logger.warning("⚠️ Response seems too small, might be an error page")
                raise Exception("Response too small, likely an error page")
            
            # Parse HTML
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract data
            author_name = extract_author_name_requests(soup)
            post_content = extract_post_content_requests(soup)
            media_urls = extract_media_urls_requests(soup)
            thumbnail = get_best_thumbnail(media_urls, url)
            
            # Check if we got meaningful data
            has_content = len(post_content.strip()) > 20
            has_author = author_name != "Unknown Author"
            has_thumbnail = bool(thumbnail)
            
            logger.info(f"📊 Data quality check:")
            logger.info(f"   - Has content: {has_content} ({len(post_content)} chars)")
            logger.info(f"   - Has author: {has_author} ({author_name})")
            logger.info(f"   - Has thumbnail: {has_thumbnail}")
            
            # If we got good data, use it
            if has_content or has_author:
                # Generate title
                if post_content:
                    title = post_content[:100].strip()
                    if len(post_content) > 100:
                        title += "..."
                else:
                    title = f"LinkedIn post by {author_name}"
                
                result.update({
                    "title": title,
                    "channel": author_name,
                    "description": post_content,
                    "thumbnail": thumbnail
                })
                
                if media_urls:
                    result["metadata"]["media_count"] = len(media_urls)
                    result["metadata"]["media_types"] = list(set(m['type'] for m in media_urls))
                
                logger.info("✅ Requests-based scraping successful")
                return result
            else:
                logger.warning("⚠️ Requests approach didn't get good data, trying Selenium...")
                raise Exception("Insufficient data from requests approach")
                
        except Exception as e:
            logger.warning(f"⚠️ Requests approach failed: {e}")
            
            # Fall back to Selenium
            selenium_result = extract_with_selenium(url)
            if "error" not in selenium_result:
                return selenium_result
            else:
                logger.error(f"❌ Both approaches failed")
                return {"error": f"All scraping methods failed: {str(e)}"}

