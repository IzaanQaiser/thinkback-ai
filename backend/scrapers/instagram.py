from .base import BaseScraper


class InstagramScraper(BaseScraper):
    def scrape(self, url: str) -> dict:
        # TODO: Implement actual scraping logic
        return {
            "title": "Placeholder Instagram Title",
            "description": "Placeholder Instagram Description",
            "metadata": {},
            "transcript": None,
        }
