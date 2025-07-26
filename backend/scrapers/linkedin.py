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
import sys
import os

# Add credentials directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'credentials'))
try:
    from linkedin_credentials import get_linkedin_credentials, has_linkedin_credentials, JOB_SELECTORS
except ImportError:
    # Fallback if credentials module is not available
    def get_linkedin_credentials():
        raise ValueError("LinkedIn credentials not configured")
    
    def has_linkedin_credentials():
        return False
    
    JOB_SELECTORS = {
        'company_name': [],
        'position_title': [],
        'company_logo': []
    }

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def extract_post_id(url: str) -> str:
    """Extract LinkedIn post ID from URL."""
    patterns = [
        r'linkedin\.com/posts/[^/]+_([^-]+)-activity-([^?]+)',
        r'linkedin\.com/posts/[^/]+_([^-]+)-activity-([^?]+)\?',
        r'linkedin\.com/feed/update/urn:li:activity:([^/?]+)',
        r'linkedin\.com/posts/[^/]+-activity-([^?]+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            if len(match.groups()) > 1:
                return f"{match.group(1)}-{match.group(2)}"
            return match.group(1)
    
    if 'activity-' in url:
        activity_part = url.split('activity-')[1]
        if '?' in activity_part:
            return activity_part.split('?')[0]
        return activity_part
    
    return ""


def extract_job_id(url: str) -> str:
    """Extract LinkedIn job ID from URL."""
    patterns = [
        r'linkedin\.com/jobs/view/[^/]+-([^/?]+)',
        r'linkedin\.com/jobs/collections/[^/]+/\?currentJobId=([^&]+)',
        r'currentJobId=([^&]+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    return ""


def is_job_url(url: str) -> bool:
    """Check if the URL is a LinkedIn job URL."""
    return "linkedin.com/jobs/" in url.lower()


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


def extract_media_urls_requests(soup: BeautifulSoup) -> list:
    """Extract media URLs using requests approach with specific ember ID patterns."""
    logger.info("🔍 Searching for media in HTML using ember ID patterns...")
    media_urls = []
    
    # First, look for post media images with specific ember IDs (highest priority)
    post_media_ids = ['ember41', 'ember42', 'ember43']
    post_media_images = []
    
    for ember_id in post_media_ids:
        img_elements = soup.find_all('img', id=ember_id)
        for img in img_elements:
            src = img.get('src') or img.get('data-src') or img.get('data-lazy-src') or img.get('data-delayed-url')
            if src and not src.startswith('data:'):
                logger.info(f"🎯 Found post media image with ember ID {ember_id}: {src[:100]}...")
                post_media_images.append({
                    'type': 'image',
                    'url': src,
                    'alt': img.get('alt', ''),
                    'priority': 'highest',
                    'ember_id': ember_id
                })
    
    # If we found post media images, add them first
    if post_media_images:
        media_urls.extend(post_media_images)
        logger.info(f"✅ Found {len(post_media_images)} post media images with ember IDs")
    
    # If no post media found, look for profile pictures as fallback
    if not post_media_images:
        logger.info("🔍 No post media found, looking for profile pictures...")
        profile_picture_images = soup.find_all('img', id='ember35')
        
        for img in profile_picture_images:
            src = img.get('src') or img.get('data-src') or img.get('data-lazy-src') or img.get('data-delayed-url')
            if src and not src.startswith('data:'):
                logger.info(f"👤 Found profile picture with ember35: {src[:100]}...")
                media_urls.append({
                    'type': 'image',
                    'url': src,
                    'alt': img.get('alt', ''),
                    'priority': 'high',
                    'ember_id': 'ember35',
                    'is_profile_picture': True
                })
    
    # Enhanced fallback: Look for any ember IDs that might be close to our targets
    if not media_urls:
        logger.info("🔍 No specific ember IDs found, looking for any ember IDs...")
        all_images = soup.find_all('img')
        ember_images = []
        
        for img in all_images:
            img_id = img.get('id', '')
            if img_id and 'ember' in img_id:
                src = img.get('src') or img.get('data-src') or img.get('data-lazy-src') or img.get('data-delayed-url')
                if src and not src.startswith('data:'):
                    ember_images.append({
                        'id': img_id,
                        'src': src,
                        'alt': img.get('alt', ''),
                        'class': img.get('class', [])
                    })
        
        if ember_images:
            logger.info(f"🔍 Found {len(ember_images)} images with ember IDs: {[img['id'] for img in ember_images]}")
            
            # Look for any ember IDs that might be post media (not profile pictures)
            for img_data in ember_images:
                img_id = img_data['id']
                src = img_data['src']
                
                # Skip obvious profile pictures
                if any(skip in src.lower() for skip in ['profile-displayphoto', 'avatar']):
                    continue
                
                # Check if this might be post media
                if any(pattern in src.lower() for pattern in ['feedshare', 'article-cover', 'image-shrink']):
                    logger.info(f"🎯 Found potential post media with ember ID {img_id}: {src[:100]}...")
                    media_urls.append({
                        'type': 'image',
                        'url': src,
                        'alt': img_data['alt'],
                        'priority': 'highest',
                        'ember_id': img_id,
                        'is_potential_post_media': True
                    })
    
    # If still no media found, fall back to the original method
    if not media_urls:
        logger.info("🔍 No ember ID media found, falling back to original method...")
        
        # Look for images - prioritize post content images
        images = soup.find_all('img')
        logger.info(f"📸 Found {len(images)} total images")
        
        for img in images:
            src = img.get('src') or img.get('data-src') or img.get('data-lazy-src') or img.get('data-delayed-url')
            if src and not src.startswith('data:'):
                # Skip obvious UI elements
                skip_patterns = [
                    'avatar', 'icon', 'logo', 'profile-displaybackgroundimage', 'profile-picture',
                    'static.licdn.com/aero-v1/sc/h/'
                ]
                
                should_skip = any(pattern in src.lower() for pattern in skip_patterns)
                if should_skip:
                    continue
                
                # Check if this looks like a post content image
                parent_classes = []
                parent = img.parent
                for _ in range(5):
                    if parent:
                        parent_classes.extend(parent.get('class', []))
                        parent = parent.parent
                
                # Improved priority detection
                priority = 'low'
                url_lower = src.lower()
                
                # Highest priority: feedshare images (main post content)
                if 'feedshare' in url_lower:
                    priority = 'highest'
                # High priority: article cover images
                elif 'article-cover_image' in url_lower:
                    priority = 'highest'
                # High priority: post content images with specific patterns
                elif any('post' in cls.lower() or 'content' in cls.lower() or 'feed' in cls.lower() for cls in parent_classes):
                    priority = 'high'
                elif 'image-shrink_800' in url_lower or 'image-shrink_1280' in url_lower:
                    priority = 'high'
                elif 'dms/image' in url_lower and not any(skip in url_lower for skip in ['avatar', 'profile-displaybackgroundimage']):
                    priority = 'medium'
                
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
    
    # Priority: video thumbnails, then images, then any media
    for media in media_urls:
        if media.get('type') == 'video' and media.get('thumbnail'):
            return media['thumbnail']
    
    for media in media_urls:
        if media.get('type') == 'image' and media.get('url'):
            return media['url']
    
    # Fallback to first available media
    for media in media_urls:
        if media.get('thumbnail'):
            return media['thumbnail']
        if media.get('url'):
            return media['url']
    
    return ""


def extract_job_company_name(soup: BeautifulSoup) -> str:
    """Extract company name from LinkedIn job page."""
    logger.info("🔍 Extracting company name from LinkedIn job...")
    
    # Use selectors from credentials module
    selectors = JOB_SELECTORS.get('company_name', [])
    
    for selector in selectors:
        element = soup.select_one(selector)
        if element:
            company_name = element.get_text(strip=True)
            if company_name and len(company_name) > 1:
                logger.info(f"✅ Found company name: {company_name}")
                return company_name
    
    logger.warning("⚠️ Could not find company name")
    return "Unknown Company"


def extract_job_position_title(soup: BeautifulSoup) -> str:
    """Extract position title from LinkedIn job page."""
    logger.info("🔍 Extracting position title from LinkedIn job...")
    
    # Use selectors from credentials module
    selectors = JOB_SELECTORS.get('position_title', [])
    
    for selector in selectors:
        element = soup.select_one(selector)
        if element:
            title = element.get_text(strip=True)
            if title and len(title) > 1:
                logger.info(f"✅ Found position title: {title}")
                return title
    
    logger.warning("⚠️ Could not find position title")
    return "Unknown Position"


def extract_job_company_logo(soup: BeautifulSoup) -> str:
    """Extract company logo URL from LinkedIn job page."""
    logger.info("🔍 Extracting company logo from LinkedIn job...")
    
    # Use selectors from credentials module
    selectors = JOB_SELECTORS.get('company_logo', [])
    
    for selector in selectors:
        element = soup.select_one(selector)
        if element:
            logo_url = element.get('src')
            if logo_url and logo_url.startswith('http'):
                logger.info(f"✅ Found company logo: {logo_url}")
                return logo_url
    
    logger.warning("⚠️ Could not find company logo")
    return ""


def setup_selenium_driver():
    """Setup Selenium WebDriver with proper configuration."""
    chrome_options = Options()
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
    
    # Add additional options for better compatibility
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    
    try:
        driver = webdriver.Chrome(options=chrome_options)
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        return driver
    except Exception as e:
        logger.error(f"❌ Failed to create Chrome driver: {e}")
        return None


def login_to_linkedin(driver: webdriver.Chrome) -> bool:
    """
    Login to LinkedIn using credentials.
    
    Args:
        driver: Selenium WebDriver instance
        
    Returns:
        True if login successful, False otherwise
    """
    try:
        if not has_linkedin_credentials():
            logger.warning("⚠️ No LinkedIn credentials available")
            return False
        
        credentials = get_linkedin_credentials()
        email = credentials['email']
        password = credentials['password']
        
        logger.info("🔐 Logging into LinkedIn...")
        
        # Go to login page
        driver.get("https://www.linkedin.com/login")
        time.sleep(2)
        
        # Find and fill email field
        email_field = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "username"))
        )
        email_field.clear()
        email_field.send_keys(email)
        
        # Find and fill password field
        password_field = driver.find_element(By.ID, "password")
        password_field.clear()
        password_field.send_keys(password)
        
        # Click login button
        login_button = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        login_button.click()
        
        # Wait for login to complete
        time.sleep(5)
        
        # Check if login was successful
        current_url = driver.current_url
        if "feed" in current_url or "mynetwork" in current_url or "jobs" in current_url:
            logger.info("✅ LinkedIn login successful")
            return True
        else:
            logger.warning("⚠️ LinkedIn login may have failed")
            return False
            
    except Exception as e:
        logger.error(f"❌ LinkedIn login failed: {e}")
        return False


def extract_with_selenium(url: str) -> dict:
    """Extract LinkedIn post content using Selenium."""
    logger.info("🔄 Trying Selenium-based approach...")
    
    driver = None
    try:
        driver = setup_selenium_driver()
        driver.get(url)
        
        # Wait for page to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        
        # Additional wait for dynamic content
        time.sleep(3)
        
        # Get page source
        page_source = driver.page_source
        soup = BeautifulSoup(page_source, 'html.parser')
        
        # Extract data using the same functions
        author_name = extract_author_name_requests(soup)
        post_content = extract_post_content_requests(soup)
        media_urls = extract_media_urls_requests(soup)
        thumbnail = get_best_thumbnail(media_urls, url)
        
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
                "platform": "LinkedIn",
                "method": "selenium"
            }
        }
        
        if media_urls:
            result["metadata"]["media_count"] = len(media_urls)
            result["metadata"]["media_types"] = list(set(m['type'] for m in media_urls))
        
        logger.info("✅ Selenium-based scraping successful")
        return result
        
    except Exception as e:
        logger.error(f"❌ Selenium approach failed: {e}")
        return {"error": f"Selenium scraping failed: {str(e)}"}
    finally:
        if driver:
            driver.quit()


def extract_job_with_selenium(url: str) -> dict:
    """Extract LinkedIn job content using Selenium."""
    logger.info("🔄 Trying Selenium-based job extraction...")
    
    driver = None
    try:
        driver = setup_selenium_driver()
        
        # Try to login if credentials are available
        if has_linkedin_credentials():
            logger.info("🔐 Attempting LinkedIn login...")
            login_success = login_to_linkedin(driver)
            if not login_success:
                logger.warning("⚠️ LinkedIn login failed, continuing without authentication")
        else:
            logger.info("ℹ️ No LinkedIn credentials available, proceeding without authentication")
        
        # Navigate to job page
        driver.get(url)
        
        # Wait for page to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        
        # Additional wait for dynamic content
        time.sleep(3)
        
        # Get page source
        page_source = driver.page_source
        soup = BeautifulSoup(page_source, 'html.parser')
        
        # Extract job data
        company_name = extract_job_company_name(soup)
        position_title = extract_job_position_title(soup)
        company_logo = extract_job_company_logo(soup)
        
        result = {
            "url": url,
            "title": position_title,
            "channel": company_name,
            "description": f"Job at {company_name}",
            "thumbnail": company_logo,
            "type": "job",
            "metadata": {
                "platform": "LinkedIn",
                "method": "selenium",
                "company_name": company_name,
                "position_title": position_title,
                "company_logo": company_logo
            }
        }
        
        logger.info("✅ Selenium-based job scraping successful")
        return result
        
    except Exception as e:
        logger.error(f"❌ Selenium job extraction failed: {e}")
        return {"error": f"Selenium job scraping failed: {str(e)}"}
    finally:
        if driver:
            driver.quit()


class LinkedInScraper(BaseScraper):
    def scrape(self, url: str) -> dict:
        """
        Scrape LinkedIn post or job content using hybrid approach.
        Tries requests first, falls back to Selenium if needed.
        """
        logger.info(f"🔍 Starting LinkedIn scraping for: {url}")
        
        # Check if this is a job URL
        if is_job_url(url):
            logger.info("📋 Detected LinkedIn job URL")
            return self._scrape_job(url)
        else:
            logger.info("📝 Detected LinkedIn post URL")
            return self._scrape_post(url)
    
    def _scrape_job(self, url: str) -> dict:
        """Scrape LinkedIn job content."""
        job_id = extract_job_id(url)
        if not job_id:
            logger.error(f"❌ Could not extract job ID from URL: {url}")
            return {"error": "Could not extract job ID from URL"}
        
        logger.info(f"📝 Job ID: {job_id}")
        
        # Initialize result structure
        result = {
            "url": url,
            "title": None,
            "channel": None,
            "description": None,
            "thumbnail": None,
            "type": "job",
            "metadata": {
                "job_id": job_id,
                "platform": "LinkedIn",
                "method": "requests"
            }
        }
        
        # Try requests approach first
        logger.info("🔄 Trying requests-based approach for job...")
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
            
            # Extract job data
            company_name = extract_job_company_name(soup)
            position_title = extract_job_position_title(soup)
            company_logo = extract_job_company_logo(soup)
            
            # Check if we got meaningful data
            has_company = company_name != "Unknown Company"
            has_title = position_title != "Unknown Position"
            
            logger.info(f"📊 Job data quality check:")
            logger.info(f"   - Has company: {has_company} ({company_name})")
            logger.info(f"   - Has title: {has_title} ({position_title})")
            logger.info(f"   - Has logo: {bool(company_logo)}")
            
            # If we got good data, use it
            if has_company or has_title:
                result.update({
                    "title": position_title,
                    "channel": company_name,
                    "description": f"Job at {company_name}",
                    "thumbnail": company_logo
                })
                
                result["metadata"].update({
                    "company_name": company_name,
                    "position_title": position_title,
                    "company_logo": company_logo
                })
                
                logger.info("✅ Requests-based job scraping successful")
                return result
            else:
                logger.warning("⚠️ Requests approach didn't get good job data, trying Selenium...")
                raise Exception("Insufficient job data from requests approach")
                
        except Exception as e:
            logger.warning(f"⚠️ Requests approach failed for job: {e}")
            
            # Fall back to Selenium
            selenium_result = extract_job_with_selenium(url)
            if "error" not in selenium_result:
                return selenium_result
            else:
                logger.error(f"❌ Both approaches failed for job")
                return {"error": f"All job scraping methods failed: {str(e)}"}
    
    def _scrape_post(self, url: str) -> dict:
        """Scrape LinkedIn post content."""
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

