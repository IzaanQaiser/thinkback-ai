from .base import BaseScraper
import yt_dlp
import requests
import json


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


class YouTubeScraper(BaseScraper):
    def scrape(self, url: str) -> dict:
        ydl_opts = {
            "quiet": True,
            "skip_download": True,
            "writesubtitles": True,
            "writeautomaticsub": True,
        }
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
            return {
                "title": title,
                "description": description,
                "metadata": metadata,
                "transcript": transcript,
                "thumbnail": thumbnail,
            }
