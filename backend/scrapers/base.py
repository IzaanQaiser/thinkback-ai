class BaseScraper:
    def scrape(self, url: str) -> dict:
        """
        Scrape the given URL and return a dictionary with keys like:
        - title
        - description
        - metadata
        - transcript
        - etc.
        """
        raise NotImplementedError("scrape() must be implemented by subclasses.")
