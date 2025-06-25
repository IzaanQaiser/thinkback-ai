from dotenv import load_dotenv
from typing import List, Dict, Any
import textwrap
import re

load_dotenv()
import os
import json
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def classify_entry(entry, categories):
    prompt = format_ai_prompt(entry)
    try:
        response = client.chat.completions.create(
            model="gpt-4-1106-preview",  # gpt-4.1
            messages=[
                {
                    "role": "system",
                    "content": "You are an AI assistant. Only respond in valid JSON as instructed.",
                },
                {"role": "user", "content": prompt},
            ],
            max_tokens=2048,
            temperature=0.2,
            top_p=1.0,
        )
        content = response.choices[0].message.content
        print(f"[classify_entry] Raw model output: {content}")
        if content is None:
            return {
                "category": {"name": "General"},
                "tags": [],
                "title": "",
                "summary": "",
            }
        try:
            result = json.loads(content)
            return result
        except Exception:
            # Try to extract JSON from the response using regex
            match = re.search(r"\{[\s\S]*\}", content)
            if match:
                try:
                    return json.loads(match.group(0))
                except Exception:
                    pass
            return {
                "category": {"name": "General"},
                "tags": [],
                "title": "",
                "summary": "",
            }
    except Exception as e:
        return {
            "category": {"name": "General"},
            "tags": [],
            "title": "",
            "summary": "",
        }


def aggregate_entry_data(
    url: str,
    platform: str,
    scraped_data: Dict[str, Any],
    user_notes: str,
    categories: List[Dict[str, Any]],
) -> Dict[str, Any]:
    return {
        "url": url,
        "platform": platform,
        "title": scraped_data.get("title"),
        "description": scraped_data.get("description"),
        "transcript": scraped_data.get("transcript"),
        "metadata": scraped_data.get("metadata"),
        "user_notes": user_notes,
        "categories": categories,
    }


def format_ai_prompt(entry: Dict[str, Any]) -> str:
    # Truncate transcript if too long for prompt
    transcript = entry.get("transcript") or ""
    if transcript and len(transcript) > 2000:
        transcript = transcript[:2000] + "..."
    # Format categories for display with IDs
    categories_str = "\n".join(
        f"- {cat['name']} (ID: {cat['id']})" for cat in entry.get("categories", [])
    )
    # Format metadata for display
    metadata = entry.get("metadata") or {}
    metadata_str = ", ".join(f"{k}: {v}" for k, v in metadata.items() if v)
    # Compose prompt
    prompt = textwrap.dedent(
        f"""
    You are an AI assistant for a knowledge management app. Given the following entry and the list of existing categories, do the following:
    1. CRITICAL: NEVER assign to "Uncategorized". You must either:
       - Match to an existing category if there's a 50%+ similarity
       - Create a NEW category name (1-2 words) that best describes the content topic/genre
    2. Generate a concise, human-friendly title (if needed).
    3. Generate up to 3 relevant tags.
    4. Generate a 3-5 sentence summary of the content that captures the key points and main takeaways.

    Entry:
    URL: {entry.get("url")}
    Platform: {entry.get("platform")}
    Title: {entry.get("title")}
    Description: {entry.get("description")}
    Transcript: {transcript}
    Metadata: {metadata_str}
    User Notes: {entry.get("user_notes")}

    Existing Categories:
    {categories_str}

    IMPORTANT: If none of the existing categories match well (less than 50% similarity), create a NEW category name that best describes this content. Examples: "Science", "Technology", "Sports", "Entertainment", "Education", "Business", "Health", "Travel", etc.

    Respond in JSON with keys: category (object with id if matching existing category, or name if suggesting new category), title, tags (list of strings), summary (string with 3-5 sentences).
    """
    )
    return prompt


if __name__ == "__main__":
    print("API Key loaded:", os.getenv("OPENAI_API_KEY") is not None)
    # Test classify_entry with dummy data
    test_entry = {
        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "notes": "Motivational video about persistence.",
    }
    test_categories = [
        {"id": "1", "name": "Motivation"},
        {"id": "2", "name": "Productivity"},
    ]
    print(classify_entry(test_entry, test_categories))
