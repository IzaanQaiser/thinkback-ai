from .base import BaseScraper
import yt_dlp
import requests
import json
import re
import os


def vtt_to_text(vtt_content: str) -> str:
    lines = vtt_content.splitlines()
    text_lines = []
    for line in lines:
        # Skip VTT headers, timestamps, and empty lines
        if line.strip() == "" or "-->" in line or line.startswith("WEBVTT"):
            continue
        text_lines.append(line.strip())
    return " ".join(text_lines)


def youtube_json_to_text(json_str: str) -> str:
    try:
        data = json.loads(json_str)
        text = []
        for event in data.get("events", []):
            for seg in event.get("segs", []):
                if "utf8" in seg:
                    text.append(seg["utf8"])
        return "".join(text)
    except Exception:
        return ""


def is_shorts_url(url: str) -> bool:
    """Check if the URL is a YouTube Shorts URL."""
    url_lower = url.lower()
    return "youtube.com/shorts/" in url_lower or (
        "youtu.be/" in url_lower and "?feature=share" in url_lower
    )


class YouTubeScraper(BaseScraper):
    def scrape(self, url: str) -> dict:
        # Path to the cookies file (relative to this file)
        cookies_path = os.path.join(os.path.dirname(__file__), "../credentials/youtube-cookies.txt")
        ydl_opts = {
            "quiet": True,
            "skip_download": True,
            "writesubtitles": True,
            "writeautomaticsub": True,
            "cookiefile": cookies_path,
        }
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                title = info.get("title")
                description = info.get("description")
                metadata = {
                    "uploader": info.get("uploader"),
                    "upload_date": info.get("upload_date"),
                    "duration": info.get("duration"),
                    "view_count": info.get("view_count"),
                    "like_count": info.get("like_count"),
                    "channel_id": info.get("channel_id"),
                    "categories": info.get("categories"),
                    "tags": info.get("tags"),
                }
                transcript = None
                subtitles = info.get("subtitles") or info.get("automatic_captions")
                if subtitles:
                    for lang in ["en", "en-US", "en-GB"]:
                        if lang in subtitles:
                            captions_url = subtitles[lang][0]["url"]
                            resp = requests.get(captions_url)
                            if resp.ok:
                                content = resp.text
                                # Try to parse as JSON, else treat as VTT
                                if content.strip().startswith("{"):
                                    transcript = youtube_json_to_text(content)
                                else:
                                    transcript = vtt_to_text(content)
                            break
                thumbnail = info.get("thumbnail")

                # Determine content type
                content_type = "shorts" if is_shorts_url(url) else "video"

                return {
                    "url": url,
                    "title": title,
                    "description": description,
                    "type": content_type,
                    "metadata": metadata,
                    "transcript": transcript,
                    "thumbnail": thumbnail,
                }
        except Exception as e:
            return {"error": str(e)}
