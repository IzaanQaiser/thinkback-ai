from scrapers.youtube import YouTubeScraper
from scrapers.instagram import InstagramScraper
from scrapers.linkedin import LinkedInScraper
from scrapers.reddit import RedditScraper
from scrapers.tiktok import TikTokScraper
from scrapers.twitter import TwitterScraper


def get_scraper(platform: str):
    if platform in ["YouTube Video", "YouTube Shorts"]:
        return YouTubeScraper()
    elif platform in ["Instagram Reel", "Instagram Post"]:
        return InstagramScraper()
    elif platform in ["LinkedIn Post", "LinkedIn Job"]:
        return LinkedInScraper()
    elif platform == "Reddit Post":
        return RedditScraper()
    elif platform == "TikTok Video":
        return TikTokScraper()
    elif platform == "Twitter/X Post":
        return TwitterScraper()
    else:
        return None
