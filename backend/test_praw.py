import os
import praw
import sys
from dotenv import load_dotenv

# Always load .env from project root
load_dotenv(
    dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
)

print("Current working directory:", os.getcwd())
print("REDDIT_CLIENT_ID:", os.environ.get("REDDIT_CLIENT_ID"))
print("REDDIT_CLIENT_SECRET is set:", bool(os.environ.get("REDDIT_CLIENT_SECRET")))
print("REDDIT_USER_AGENT:", os.environ.get("REDDIT_USER_AGENT"))

client_id = os.environ.get("REDDIT_CLIENT_ID")
client_secret = os.environ.get("REDDIT_CLIENT_SECRET")
user_agent = os.environ.get("REDDIT_USER_AGENT", "thinkback-ai/1.0")

if not client_id or not client_secret:
    print(
        "❌ Reddit API credentials not set. Please set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET."
    )
    sys.exit(1)

reddit = praw.Reddit(
    client_id=client_id, client_secret=client_secret, user_agent=user_agent
)

url = "https://www.reddit.com/r/uwaterloo/comments/1lpig1c/good_haircut_places_for_male_asian_hair/"
submission = reddit.submission(url=url)

print("Title:", submission.title)
print("Selftext:", submission.selftext)
print("Is self post:", submission.is_self)
print("Author:", submission.author)
print("Score:", submission.score)
print("Num comments:", submission.num_comments)
