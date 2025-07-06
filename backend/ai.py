from dotenv import load_dotenv
from typing import List, Dict, Any
import textwrap
import re
from langdetect import detect
from google.cloud import translate_v2 as translate

load_dotenv()
import os
import json
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def ensure_english(text):
    try:
        if not text:
            return text
        if detect(text) != "en":
            translate_client = translate.Client()
            result = translate_client.translate(text, target_language="en")
            return result["translatedText"]
        return text
    except Exception as e:
        print(f"[Translation] Error: {e}")
        return text


def classify_entry(entry, categories):
    print(f"\n🤖 AI CLASSIFICATION STARTED")
    print(f"   Entry ID: {entry.get('id', 'N/A')}")
    print(f"   Platform: {entry.get('platform', 'N/A')}")
    print(f"   URL: {entry.get('url', 'N/A')}")
    print(f"   Available categories: {len(categories)}")

    prompt = format_ai_prompt(entry)
    print(f"   Prompt length: {len(prompt)} characters")

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
        print(f"   ✅ AI response received ({len(content)} chars)")

        if content is None:
            print(f"   ❌ AI returned empty response")
            return {
                "category": {"name": "General"},
                "tags": [],
                "title": "",
                "summary": "",
            }
        try:
            result = json.loads(content)
            print(f"   ✅ JSON parsed successfully")
            print(f"   AI Results:")
            print(f"     Category: {result.get('category', {})}")
            print(f"     Title: {result.get('title', 'N/A')}")
            print(f"     Tags: {result.get('tags', [])}")
            print(f"     Summary: {result.get('summary', 'N/A')[:50]}...")
            # Ensure English for title and summary
            result["title"] = ensure_english(result.get("title", ""))
            result["summary"] = ensure_english(result.get("summary", ""))
            return result
        except Exception as e:
            print(f"   ⚠️ JSON parsing failed: {e}")
            # Try to extract JSON from the response using regex
            match = re.search(r"\{[\s\S]*\}", content)
            if match:
                try:
                    result = json.loads(match.group(0))
                    print(f"   ✅ JSON extracted with regex")
                    # Ensure English for title and summary
                    result["title"] = ensure_english(result.get("title", ""))
                    result["summary"] = ensure_english(result.get("summary", ""))
                    return result
                except Exception as e2:
                    print(f"   ❌ Regex extraction also failed: {e2}")
            print(f"   ❌ Returning fallback data")
            return {
                "category": {"name": "General"},
                "tags": [],
                "title": "",
                "summary": "",
            }
    except Exception as e:
        print(f"   ❌ AI API call failed: {e}")
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
        "type": scraped_data.get("type"),
        "title": scraped_data.get("title"),
        "description": scraped_data.get("description"),
        "transcript": scraped_data.get("transcript"),
        "metadata": scraped_data.get("metadata"),
        "thumbnail": scraped_data.get("thumbnail"),
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

    # Add Instagram-specific guidance
    platform = entry.get("platform", "").lower()
    instagram_guidance = ""
    if "instagram" in platform:
        instagram_guidance = """
    INSTAGRAM-SPECIFIC GUIDANCE:
    - Instagram posts often have hashtags and mentions - focus on the core content
    - Look for the main message or theme beyond hashtags
    - Consider visual content type (photo, carousel, story-style)
    - Extract meaningful topics from captions and hashtags
    - Examples:
      * "Beautiful sunset at the beach #sunset #beach #nature" → "Nature" (not "Sunset Photography")
      * "New recipe for chocolate cake 🍰 #food #baking #dessert" → "Food" (not "Baking Recipes")
      * "Motivational quote about success #motivation #success #inspiration" → "Motivation" (not "Inspirational Quotes")
    """

    # Compose prompt
    prompt = textwrap.dedent(
        f"""
    You are an AI assistant for a knowledge management app. Given the following entry and the list of existing categories, do the following:
    1. CRITICAL: NEVER assign to "Uncategorized". You must either:
       - Match to an existing category if there's a 50%+ similarity
       - Create a NEW category name (1-2 words) that best describes the content topic/genre
    2. Generate a concise, specific title (4-5 words max) that captures the core topic of the content. Make it more specific and relevant than the original title.
    3. Generate up to 3 relevant tags.
    4. Generate a 3-5 sentence summary of the content that captures the key points and main takeaways.

    CATEGORIZATION RULES:
    - PREFER BROADER, SIMPLER categories over specific ones
    - Use single words or simple 2-word phrases (e.g., "Startups", "NBA", "Basketball", "Technology")
    - Avoid overly specific categories like "Startup Critique" or "Physics Fundamentals"
    - Consider the content's main topic area, not the specific angle or perspective
    - Examples:
      * "How startups are stupid" → "Startups" (not "Startup Critique")
      * "NBA player injury news" → "NBA" (not "NBA Injuries")
      * "Random basketball league highlights" → "Basketball" (not "Basketball Highlights")
      * "Physics tutorial" → "Physics" (not "Physics Education")
      * "React programming guide" → "Programming" (not "React Tutorial")
      * "Tech company analysis" → "Technology" (not "Tech Analysis")
    {instagram_guidance}

    Entry:
    URL: {entry.get("url")}
    Platform: {entry.get("platform")}
    Type: {entry.get("type", "unknown")}
    Title: {entry.get("title")}
    Description: {entry.get("description")}
    Transcript: {transcript}
    Metadata: {metadata_str}
    User Notes: {entry.get("user_notes")}

    Existing Categories:
    {categories_str}

    IMPORTANT: Choose the BROADEST appropriate category that still accurately describes the content. Prefer simple, general categories over specific ones. If none of the existing categories match well (less than 50% similarity), create a NEW category name that best describes this content.

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
