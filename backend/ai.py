from dotenv import load_dotenv

load_dotenv()
import os
import json
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def classify_entry(entry, categories):
    prompt = f"""
    You are an AI assistant for a personal knowledge management app.
    Given the following content and the user's existing categories, do the following:
    1. Analyze the content and the list of categories.
    2. If a relevant category exists, return its name and ID. If not, suggest a new category name (ID can be null).
    3. Suggest 2-5 relevant tags.
    4. Generate a concise, descriptive title for the content (max 5 sentences, ideally 1-2).

    Content URL: {entry.get('url')}
    Notes: {entry.get('notes', '')}

    Existing categories (format: [{{'id': '...', 'name': '...'}}, ...]):
    {categories}

    Respond in JSON like this:
    {{
      "category": {{"name": "CategoryName", "id": "categoryIdOrNull"}},
      "tags": ["tag1", "tag2", "tag3"],
      "title": "AI-generated title here"
    }}
    """

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",  # or "gpt-4o" if you have access
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
            temperature=0.2,
        )
        content = response.choices[0].message.content
        if content is None:
            return {
                "category": {"name": "Uncategorized", "id": None},
                "tags": [],
                "title": "",
            }
        result = json.loads(content)
        return result
    except Exception as e:
        # fallback: just return a default
        return {
            "category": {"name": "Uncategorized", "id": None},
            "tags": [],
            "title": "",
        }


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
