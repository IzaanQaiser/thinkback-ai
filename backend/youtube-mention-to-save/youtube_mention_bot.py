import os
import json
from datetime import datetime, timezone
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
import requests

# Configuration
SCOPES = [
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/youtube.force-ssl",
]
API_SERVICE_NAME = "youtube"
API_VERSION = "v3"
MENTION = "@thinkback_ai"

# Get client secret filename from environment or use default
CLIENT_SECRET_FILE = os.getenv("YOUTUBE_CLIENT_SECRET_FILE", "client_secret.json")

# Backend endpoint for sending mentions
BACKEND_ENDPOINT = os.getenv("BACKEND_ENDPOINT", "http://localhost:8000/api/mentions")


def get_authenticated_service():
    """Authenticate with YouTube API and return service object."""
    creds = None
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except Exception as e:
                print(f"Error refreshing token: {e}")
                creds = None

        if not creds:
            try:
                flow = InstalledAppFlow.from_client_secrets_file(
                    CLIENT_SECRET_FILE, SCOPES
                )
                creds = flow.run_local_server(port=0)
                with open("token.json", "w") as token:
                    token.write(creds.to_json())
            except Exception as e:
                print(f"Error during authentication: {e}")
                return None

    return build(API_SERVICE_NAME, API_VERSION, credentials=creds)


def get_channel_id(youtube):
    """Get the authenticated user's channel ID."""
    try:
        response = youtube.channels().list(mine=True, part="id").execute()
        if response.get("items"):
            return response["items"][0]["id"]
        else:
            print("No channel found for authenticated user")
            return None
    except Exception as e:
        print(f"Error getting channel ID: {e}")
        return None


def search_for_mentions_across_youtube(youtube):
    """Search for mentions of @thinkback_ai across all of YouTube."""
    comments = []
    try:
        # Search for comments containing our mention
        search_request = youtube.search().list(
            part="snippet",
            q=MENTION,  # Search for '@thinkback_ai'
            type="video",
            maxResults=50,
            order="date",
        )
        search_response = search_request.execute()

        # For each video found, get its comments
        for video_item in search_response.get("items", []):
            video_id = video_item["id"]["videoId"]

            try:
                # Get comments for this video
                comments_request = youtube.commentThreads().list(
                    part="snippet", videoId=video_id, maxResults=100, order="time"
                )
                comments_response = comments_request.execute()

                for comment_item in comments_response.get("items", []):
                    comment = comment_item["snippet"]["topLevelComment"]["snippet"]
                    # Only include comments that actually contain our mention
                    if MENTION.lower() in comment.get("textDisplay", "").lower():
                        comment["videoId"] = video_id  # Add video ID to comment data
                        comments.append(comment)

            except Exception as e:
                print(f"Error fetching comments for video {video_id}: {e}")
                continue

    except Exception as e:
        print(f"Error searching for mentions: {e}")

    return comments


def fetch_recent_comments(youtube, channel_id):
    """Fetch recent comments from the channel."""
    comments = []
    try:
        request = youtube.commentThreads().list(
            part="snippet",
            allThreadsRelatedToChannelId=channel_id,
            maxResults=50,
            order="time",
        )
        response = request.execute()
        for item in response.get("items", []):
            comment = item["snippet"]["topLevelComment"]["snippet"]
            comments.append(comment)
    except Exception as e:
        print(f"Error fetching comments: {e}")

    return comments


def send_mention_to_backend(mention_data):
    """Send detected mention to backend endpoint."""
    try:
        response = requests.post(
            BACKEND_ENDPOINT,
            json=mention_data,
            headers={"Content-Type": "application/json"},
            timeout=10,
        )
        if response.status_code == 200:
            print(f"✓ Mention sent to backend successfully")
        else:
            print(f"✗ Backend returned status {response.status_code}: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"✗ Error sending to backend: {e}")


def extract_mentions_and_process(comments):
    """Extract mentions from comments and process them."""
    mentions_found = 0

    for comment in comments:
        text = comment.get("textDisplay", "")
        if MENTION.lower() in text.lower():
            username = comment.get("authorDisplayName", "Unknown")
            video_id = comment.get("videoId")
            comment_time = comment.get("publishedAt")
            comment_id = comment.get("id")

            # Create content URL
            content_url = (
                f"https://youtube.com/watch?v={video_id}" if video_id else None
            )

            # Prepare mention data
            mention_data = {
                "platform": "youtube",
                "username": username,
                "content_url": content_url,
                "comment": text,
                "timestamp": comment_time,
                "comment_id": comment_id,
                "video_id": video_id,
            }

            print(f"[MENTION DETECTED] {username}: {text[:100]}...")

            # Send to backend
            send_mention_to_backend(mention_data)
            mentions_found += 1

    return mentions_found


def main():
    """Main function to run the YouTube mention bot."""
    print(f"Starting YouTube mention bot for '{MENTION}'...")
    print(f"Backend endpoint: {BACKEND_ENDPOINT}")

    # Authenticate with YouTube
    youtube = get_authenticated_service()
    if not youtube:
        print("Failed to authenticate with YouTube API")
        return

    print("Searching for mentions across all of YouTube...")

    # Search for mentions across all videos
    comments = search_for_mentions_across_youtube(youtube)
    print(f"Found {len(comments)} comments containing '{MENTION}'")

    mentions_found = extract_mentions_and_process(comments)
    print(f"Processed {mentions_found} mentions of '{MENTION}'")


if __name__ == "__main__":
    main()
