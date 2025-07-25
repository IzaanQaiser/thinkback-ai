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
            }
        try:
            result = json.loads(content)
            print(f"   ✅ JSON parsed successfully")
            print(f"   AI Results:")
            print(f"     Category: {result.get('category', {})}")
            print(f"     Title: {result.get('title', 'N/A')}")
            print(f"     Tags: {result.get('tags', [])}")
            
            # For Instagram posts, if AI returns empty title, it means keep the original
            platform = entry.get("platform", "").lower()
            if "instagram" in platform and not result.get("title"):
                print(f"   📸 Instagram post detected - keeping original caption as title")
                result["title"] = ""  # This signals to keep the original title
            else:
                # Ensure English for title
                result["title"] = ensure_english(result.get("title", ""))
            
            return result
        except Exception as e:
            print(f"   ⚠️ JSON parsing failed: {e}")
            # Try to extract JSON from the response using regex
            match = re.search(r"\{[\s\S]*\}", content)
            if match:
                try:
                    result = json.loads(match.group(0))
                    print(f"   ✅ JSON extracted with regex")
                    # Ensure English for title
                    result["title"] = ensure_english(result.get("title", ""))
                    return result
                except Exception as e2:
                    print(f"   ❌ Regex extraction also failed: {e2}")
            print(f"   ❌ Returning fallback data")
            return {
                "category": {"name": "General"},
                "tags": [],
                "title": "",
            }
    except Exception as e:
        print(f"   ❌ AI API call failed: {e}")
        return {
            "category": {"name": "General"},
            "tags": [],
            "title": "",
        }


def aggregate_entry_data(
    url: str,
    platform: str,
    scraped_data: Dict[str, Any],
    user_notes: str,
    categories: List[Dict[str, Any]],
) -> Dict[str, Any]:
    # For Instagram posts, use the description (caption) as the title if available
    title = scraped_data.get("title")
    description = scraped_data.get("description")
    
    # If this is an Instagram post and we have a description (caption), use it as the title
    if platform.lower() == "instagram post" and description:
        # Use the caption as the title, but clean it up
        title = description.strip()
        # Remove hashtags from the title if they're at the end
        if title and '#' in title:
            # Find the first hashtag and truncate there
            hashtag_index = title.find('#')
            if hashtag_index > 0:
                title = title[:hashtag_index].strip()
    
    return {
        "url": url,
        "platform": platform,
        "type": scraped_data.get("type"),
        "title": title,
        "description": description,
        "transcript": scraped_data.get("transcript"),
        "metadata": scraped_data.get("metadata"),
        "thumbnail": scraped_data.get("thumbnail"),
        "user_notes": user_notes,
        "categories": categories,
    }


def format_ai_prompt(entry: Dict[str, Any]) -> str:
    # For YouTube and TikTok content, skip transcript processing
    platform = entry.get("platform", "").lower()
    if "youtube" in platform:
        transcript = ""  # No transcript for YouTube
        print(f"   📺 YouTube content detected - skipping transcript processing")
    elif "tiktok" in platform:
        transcript = ""  # No transcript for TikTok
        print(f"   🎵 TikTok content detected - skipping transcript processing")
    else:
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

    # Get thumbnail information
    thumbnail = entry.get("thumbnail")
    thumbnail_info = ""
    if thumbnail:
        thumbnail_info = f"\nThumbnail URL: {thumbnail}"
        # Add thumbnail dimensions if available
        if metadata.get("thumbnail_width") and metadata.get("thumbnail_height"):
            thumbnail_info += f"\nThumbnail Dimensions: {metadata.get('thumbnail_width')}x{metadata.get('thumbnail_height')}"

    # Get creator/channel information for better categorization
    creator_info = ""
    channel = entry.get("channel")
    if channel:
        creator_info = f"\nCreator/Channel: {channel}"
    
    # Add platform-specific guidance for precise categorization
    platform_guidance = ""
    if "instagram" in platform:
        platform_guidance = """
    INSTAGRAM-SPECIFIC CATEGORIZATION:
    - Use the caption content and hashtags to determine the main topic
    - Consider the creator's typical content type if available
    - Focus on the primary theme, not secondary hashtags
    - Examples:
      * "Beautiful sunset at the beach #sunset #beach #nature" → "Nature" (not "Sunset Photography")
      * "New recipe for chocolate cake 🍰 #food #baking #dessert" → "Food" (not "Baking Recipes")
      * "Motivational quote about success #motivation #success #inspiration" → "Motivation" (not "Inspirational Quotes")
    """
    elif "youtube" in platform:
        platform_guidance = """
    YOUTUBE-SPECIFIC CATEGORIZATION:
    - Use the video title as the primary source for categorization
    - Consider the channel name and typical content type
    - Look for keywords in the title that indicate the topic
    - Examples:
      * "How to Make Perfect Pasta" → "Cooking" (not "Pasta Tutorial")
      * "NBA Highlights 2024" → "Basketball" (not "NBA Highlights")
      * "React Tutorial for Beginners" → "Programming" (not "React Tutorial")
      * "Tech Review: iPhone 15" → "Technology" (not "Tech Reviews")
    """
    elif "tiktok" in platform:
        platform_guidance = """
    TIKTOK-SPECIFIC CATEGORIZATION:
    - Use the video title and creator information for categorization
    - Consider the creator's typical content type if available
    - Look for keywords in the title that indicate the topic
    - Examples:
      * "Funny dance challenge" → "Entertainment" (not "Dance Challenge")
      * "Cooking tutorial" → "Food" (not "Cooking Tutorial")
      * "Life hack tips" → "Lifestyle" (not "Life Hacks")
      * "Tech tips and tricks" → "Technology" (not "Tech Tips")
    """
    elif "twitter" in platform or "x.com" in platform:
        platform_guidance = """
    TWITTER/X-SPECIFIC CATEGORIZATION:
    - Use the tweet content and hashtags to determine the main topic
    - Consider the author's typical content type if available
    - Focus on the primary theme, not secondary hashtags
    - Examples:
      * "Breaking: New tech startup raises $10M" → "Technology" (not "Startup News")
      * "Amazing sunset at the beach today" → "Nature" (not "Sunset Photography")
      * "Recipe for perfect chocolate cake" → "Food" (not "Baking Recipes")
    """
    elif "reddit" in platform:
        platform_guidance = """
    REDDIT-SPECIFIC CATEGORIZATION:
    - Use the post title and subreddit to determine the main topic
    - Consider the content of the post (selftext) if available
    - Focus on the primary theme of the post
    - Examples:
      * "How to learn programming as a beginner" → "Programming" (not "Learning Guides")
      * "Best restaurants in NYC" → "Food" (not "Restaurant Reviews")
      * "New basketball highlights" → "Basketball" (not "Sports Highlights")
    """
    elif "linkedin" in platform:
        platform_guidance = """
    LINKEDIN-SPECIFIC CATEGORIZATION:
    - Use the post content and author information to determine the main topic
    - Consider the professional context and business focus of LinkedIn
    - Focus on the primary theme, not secondary topics
    - Examples:
      * "Career advice for new graduates" → "Career" (not "Graduate Advice")
      * "Marketing tips for small businesses" → "Marketing" (not "Business Tips")
      * "Tech industry trends 2024" → "Technology" (not "Industry Trends")
      * "Leadership lessons from my startup" → "Leadership" (not "Startup Lessons")
      * "Professional networking strategies" → "Networking" (not "Professional Tips")
    """

    # For Instagram posts, don't generate a new title if we have a good caption
    title_instruction = ""
    if "instagram" in entry.get("platform", "").lower():
        title_instruction = """
    2. TITLE: For Instagram posts, ONLY generate a new title if the current title is generic (like "Instagram Post by @username"). 
       If the current title is already the actual caption content, keep it as is and respond with "title": "" (empty string).
       If you need to generate a title, make it concise and specific (4-5 words max).
    """
    else:
        title_instruction = """
    2. Generate a concise, specific title (4-5 words max) that captures the core topic of the content. Make it more specific and relevant than the original title.
    """

    prompt = textwrap.dedent(
        f"""
    You are an AI assistant for a knowledge management app. Given the following entry and the list of existing categories, do the following:
    1. CRITICAL: NEVER assign to "Uncategorized". You must either:
       - Match to an existing category if there's a 50%+ similarity
       - Create a NEW category name (1-2 words) that best describes the content topic/genre
    {title_instruction}
    3. Generate up to 3 relevant tags.

    CATEGORIZATION RULES:
    - PREFER BROADER, SIMPLER categories over specific ones
    - Use single words or simple 2-word phrases (e.g., "Startups", "NBA", "Basketball", "Technology")
    - Avoid overly specific categories like "Startup Critique" or "Physics Fundamentals"
    - Consider the content's main topic area, not the specific angle or perspective
    - Use ALL available information: title, description, transcript, metadata, creator info
    - If thumbnail is available, consider the visual content type for better categorization
    - Examples:
      * "How startups are stupid" → "Startups" (not "Startup Critique")
      * "Before you build a startup write down..." → "Startups" (exact keyword match)
      * "NBA player injury news" → "NBA" (not "NBA Injuries")
      * "Random basketball league highlights" → "Basketball" (not "Basketball Highlights")
      * "Physics tutorial" → "Physics" (not "Physics Education")
      * "React programming guide" → "Programming" (not "React Tutorial")
      * "Tech company analysis" → "Technology" (not "Tech Analysis")
    {platform_guidance}

    Entry:
    URL: {entry.get("url")}
    Platform: {entry.get("platform")}
    Type: {entry.get("type", "unknown")}
    Title: {entry.get("title")}
    Description: {entry.get("description")}
    Transcript: {transcript}
    Metadata: {metadata_str}
    User Notes: {entry.get("user_notes")}{thumbnail_info}{creator_info}

    Existing Categories:
    {categories_str}

    IMPORTANT: 
    - FIRST: Check for EXACT keyword matches in existing categories (e.g., if content mentions "startup" and you have a "Startups" category, use it)
    - SECOND: Check for high similarity matches (80%+ similarity to existing categories)
    - THIRD: Choose the BROADEST appropriate category that still accurately describes the content
    - FOURTH: Create a NEW category only if no good match exists (less than 50% similarity)
    
    PRIORITY ORDER:
    1. Exact keyword matches in existing categories
    2. High similarity matches (80%+)
    3. Broad appropriate categories
    4. New category creation

    Respond in JSON with keys: category (object with id if matching existing category, or name if suggesting new category), title, tags (list of strings).
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
