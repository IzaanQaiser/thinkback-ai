from .base import BaseScraper


class LinkedInScraper(BaseScraper):
    def scrape(self, url: str) -> dict:
        # TODO: Implement actual scraping logic
        return {
            "title": "Placeholder LinkedIn Title",
            "description": "Placeholder LinkedIn Description",
            "metadata": {},
            "transcript": None,
        }
