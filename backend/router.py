from fastapi import APIRouter, HTTPException, Header, Body, Query, Request
from typing import Optional, List
from firebase import (
    change_password as change_password_firebase,
    add_entry as add_entry_firebase,
    get_entries as get_entries_firebase,
    update_entry as update_entry_firebase,
    delete_entry as delete_entry_firebase,
    add_collection as add_collection_firebase,
    get_collections as get_collections_firebase,
    update_collection as update_collection_firebase,
    delete_collection as delete_collection_firebase,
    add_category as add_category_firebase,
    get_categories as get_categories_firebase,
    update_category as update_category_firebase,
    delete_category as delete_category_firebase,
    store_ai_feedback as store_ai_feedback_firebase,
)
from pydantic import BaseModel, EmailStr, Field
from firebase_admin import auth
from datetime import datetime
from ai import classify_entry, aggregate_entry_data, format_ai_prompt
from scrapers.youtube import YouTubeScraper
from scraper_factory import get_scraper
import re
from rapidfuzz import fuzz

router = APIRouter()


# Data Models
class Entry(BaseModel):
    id: Optional[str] = None
    url: Optional[str] = None
    title: Optional[str] = None
    platform: Optional[str] = None
    notes: Optional[str] = None
    content: Optional[str] = None  # For future: extracted/AI content
    source: Optional[str] = None
    tags: List[str] = []
    favorite: bool = False
    created_at: datetime = Field(default_factory=datetime.now)
    collection_ids: List[str] = []
    category_ids: List[str] = []
    thumbnail: Optional[str] = None  # Add thumbnail field
    duration: Optional[int] = None  # Duration in seconds
    channel: Optional[str] = None  # YouTube channel name


class Collection(BaseModel):
    id: Optional[str] = None
    name: str
    created_at: datetime = Field(default_factory=datetime.now)
    entry_ids: List[str] = []


class Category(BaseModel):
    id: Optional[str] = None
    name: str
    created_at: datetime = Field(default_factory=datetime.now)
    ai_generated: bool


class Mention(BaseModel):
    platform: str
    username: str
    content_url: Optional[str] = None
    comment: str
    timestamp: str
    comment_id: Optional[str] = None
    video_id: Optional[str] = None


# Existing User and Auth Models
class User(BaseModel):
    uid: str
    email: Optional[EmailStr] = None
    email_verified: bool
    name: Optional[str] = None
    picture: Optional[str] = None


class TokenVerificationResponse(BaseModel):
    message: str
    user: User


class PasswordChangeRequest(BaseModel):
    new_password: str


@router.get("/ping")
async def ping():
    return {"message": "pong"}


@router.post("/verify-token", response_model=TokenVerificationResponse)
async def verify_token(authorization: Optional[str] = Header(None)):
    """
    Verify Firebase ID token and return decoded user info
    Expects: Authorization: Bearer <firebase_id_token>
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")

    # Extract token from "Bearer <token>" format
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization scheme")
    except ValueError:
        raise HTTPException(
            status_code=401, detail="Invalid authorization header format"
        )

    # Verify the token
    try:
        decoded_token = auth.verify_id_token(token)
    except Exception as e:
        raise HTTPException(
            status_code=401, detail=f"Token verification failed: {str(e)}"
        )

    return {"message": "Token verified successfully", "user": decoded_token}


@router.post("/change-password")
def change_password_endpoint(
    password_request: PasswordChangeRequest,
    authorization: Optional[str] = Header(None),
):
    """
    Change user's password
    Expects: Authorization: Bearer <firebase_id_token>
    Body: { "new_password": "new_password_here" }
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")

    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization scheme")
    except ValueError:
        raise HTTPException(
            status_code=401, detail="Invalid authorization header format"
        )

    # Verify the token
    try:
        decoded_token = auth.verify_id_token(token)
    except Exception as e:
        raise HTTPException(
            status_code=401, detail=f"Token verification failed: {str(e)}"
        )

    uid = decoded_token["uid"]

    # Change password
    change_result = change_password_firebase(uid, password_request.new_password)

    if not change_result["success"]:
        raise HTTPException(status_code=400, detail=change_result["error"])

    return {"message": "Password changed successfully."}


@router.post("/api/entries", response_model=Entry)
def create_entry(
    entry: Entry,
    authorization: Optional[str] = Header(None),
):
    """
    Create a new entry for the logged-in user. If the entry already has AI-enriched fields (title, tags, summary),
    save it directly. Otherwise, enrich it with AI classification.
    """
    print("\n" + "=" * 60)
    print("🚀 ENTRY CREATION PROCESS STARTED")
    print("=" * 60)

    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")

    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization scheme")
    except ValueError:
        raise HTTPException(
            status_code=401, detail="Invalid authorization header format"
        )

    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token["uid"]
        print(f"✅ Authentication successful - UID: {uid}")
    except Exception as e:
        raise HTTPException(
            status_code=401, detail=f"Token verification failed: {str(e)}"
        )

    # Always detect platform from URL
    entry_dict = entry.model_dump()
    url = entry_dict.get("url")
    notes = entry_dict.get("notes", "")

    print(f"📝 Input Data:")
    print(f"   URL: {url}")
    print(f"   Notes: {notes}")

    def detect_platform(url: str) -> str:
        url = url.lower()
        if (
            "youtube.com/shorts/" in url
            or "youtu.be/" in url
            and "?feature=share" in url
        ):
            return "YouTube Shorts"
        if "youtube.com/watch?v=" in url or "youtu.be/" in url:
            return "YouTube Video"
        if "/reels/" in url or "/reel/" in url:
            return "Instagram Reel"
        if "/p/" in url and "instagram.com" in url:
            return "Instagram Post"
        if "linkedin.com/feed/update/" in url or "linkedin.com/posts/" in url:
            return "LinkedIn Post"
        if "linkedin.com/jobs/view/" in url:
            return "LinkedIn Job"
        if "reddit.com/r/" in url and "/comments/" in url:
            return "Reddit Post"
        if "tiktok.com/" in url:
            return "TikTok Video"
        if "twitter.com/" in url or "x.com/" in url:
            return "Twitter/X Post"
        return "Unknown"

    if url:
        platform = detect_platform(str(url))
        entry_dict["platform"] = platform
        print(f"🔍 Platform Detection: {platform}")

    # Always scrape the URL to get metadata (including duration)
    duration = None
    scraped_title = None
    if url and platform:
        print(f"🔧 Starting content scraping for {platform}...")
        scraper = get_scraper(platform)
        if scraper:
            print(f"   Using scraper: {scraper.__class__.__name__}")
            scraped_data = scraper.scrape(url)
            if scraped_data and "error" in scraped_data:
                raise HTTPException(status_code=400, detail=f"YouTube scrape error: {scraped_data['error']}")
            print(f"📊 Scraped Data Summary:")
            print(f"   Title: {scraped_data.get('title', 'N/A')}")
            print(f"   Channel: {scraped_data.get('channel', 'N/A')}")
            print(f"   Type: {scraped_data.get('type', 'N/A')}")
            description = scraped_data.get('description', '')
            print(f"   Description length: {len(description) if description else 0} chars")
            print(f"   Thumbnail: {scraped_data.get('thumbnail', 'N/A')}")

            if (
                scraped_data
                and "metadata" in scraped_data
                and scraped_data["metadata"]
                and "duration" in scraped_data["metadata"]
            ):
                duration = scraped_data["metadata"]["duration"]
                entry_dict["duration"] = duration
                print(f"   Duration: {duration} seconds")
            # Also save thumbnail if present
            if scraped_data.get("thumbnail"):
                entry_dict["thumbnail"] = scraped_data["thumbnail"]
                print(f"   ✅ Thumbnail saved")
            # Save scraped title for later validation
            scraped_title = scraped_data.get("title")
            print(f"   ✅ Scraped title: {scraped_title}")
            # Save description (caption) if present
            if scraped_data.get("description"):
                entry_dict["description"] = scraped_data["description"]
                print(f"   ✅ Description (caption) saved: {entry_dict['description']}")
            # Save channel information if present
            if scraped_data.get("channel"):
                entry_dict["channel"] = scraped_data["channel"]
                print(f"   ✅ Channel saved: {entry_dict['channel']}")
            
            # For Instagram posts, save the posting account username as channel
            if platform and platform.lower() in ["instagram post", "instagram reel"]:
                posting_account = scraped_data.get("posting_account", {})
                print(f"   🔍 Instagram posting account debug:")
                print(f"     Posting account: {posting_account}")
                print(f"     Username: {posting_account.get('username') if posting_account else 'None'}")
                if posting_account and posting_account.get("username") and posting_account.get("username") != "unknown":
                    entry_dict["channel"] = posting_account["username"]
                    print(f"   ✅ Instagram posting account saved: {entry_dict['channel']}")
                else:
                    print(f"   ⚠️ No valid username found in posting account")
        else:
            print(f"   ❌ No scraper found for platform: {platform}")

    print(f"💾 Saving initial entry to Firebase...")
    result = add_entry_firebase(uid, entry_dict)
    if not result["success"]:
        print(f"   ❌ Failed to save entry: {result['error']}")
        raise HTTPException(status_code=400, detail=result["error"])
    saved_entry = result["entry"]
    print(f"   ✅ Entry saved with ID: {saved_entry['id']}")

    # Fetch all categories for the user
    print(f"📂 Fetching user categories...")
    cat_result = get_categories_firebase(uid)
    if not cat_result["success"]:
        print(f"   ❌ Failed to fetch categories: {cat_result['error']}")
        raise HTTPException(status_code=400, detail=cat_result["error"])
    categories = cat_result["categories"]  # List of dicts with 'id' and 'name'
    print(f"   ✅ Found {len(categories)} categories")

    # Check if this is a manual classification (entry already has category_ids)
    if entry_dict.get("category_ids") and len(entry_dict["category_ids"]) > 0:
        print(f"🤖 Manual classification detected - skipping AI enrichment")
        print(f"   📝 Using manually selected category: {entry_dict['category_ids']}")
        # For manual classification, use the existing data without AI processing
        ai_result = {
            "category": {"id": entry_dict["category_ids"][0]},
            "title": entry_dict.get("title", ""),
            "tags": entry_dict.get("tags", []),
            "summary": ""
        }
    else:
        # Call the classification agent
        print(f"🤖 Starting AI enrichment...")
        
        # For YouTube content, run AI classification but skip summary generation
        if platform and platform.lower() in ["youtube video", "youtube shorts"]:
            print(f"   📺 YouTube content detected - running AI classification without summary")
            # Run AI classification but modify the result to remove summary
            ai_result = classify_entry(saved_entry, categories)
            # Remove summary for YouTube content
            ai_result["summary"] = ""
        else:
            ai_result = classify_entry(saved_entry, categories)

    print(f"🧠 AI Enrichment Results:")
    print(f"   Category: {ai_result.get('category', {})}")
    print(f"   AI Title: {ai_result.get('title', 'N/A')}")
    print(f"   Tags: {ai_result.get('tags', [])}")

    # Helper to check if a title is nonsense/generic
    def is_nonsense_title(title, platform=None):
        if not title or not title.strip():
            return True
        t = title.strip().lower()
        generic_titles = [
            "untitled",
            "video",
            "instagram reel",
            "tiktok",
            "placeholder",
            "reel",
            "shorts",
            "youtube shorts",
            "watch",
            "no title",
            "",
            None,
        ]
        # Add platform-specific generic titles
        if platform:
            if platform.lower() == "youtube shorts":
                generic_titles += ["shorts", "youtube shorts"]
            if platform.lower() == "instagram reel":
                generic_titles += ["instagram reel", "reel"]
            if platform.lower() == "instagram post":
                generic_titles += ["instagram post", "post", "instagram"]
            if platform.lower() == "tiktok video":
                generic_titles += ["tiktok", "video"]
            # For Twitter/X posts, only consider "post" as generic if it's the entire title
            if platform.lower() == "twitter/x post":
                # Don't add "post" to generic titles for Twitter - actual tweet content is valuable
                pass
        # If title is just a URL
        if t.startswith("http://") or t.startswith("https://"):
            return True
        # If title is too short or matches generic
        if t in generic_titles or len(t) < 3:
            return True
        return False

    # Decide which title to use
    final_title = ai_result.get("title", "")
    
    # For manual classification, use the existing title
    if entry_dict.get("category_ids") and len(entry_dict["category_ids"]) > 0:
        final_title = entry_dict.get("title", "")
        print(f"📝 Using manual classification title: {final_title}")
    # For Instagram posts, prioritize the caption over AI-generated titles
    elif platform and platform.lower() in ["instagram post", "instagram reel"]:
        caption = scraped_data.get("description", "") if scraped_data else ""
        if caption and caption.strip():
            # Clean up the caption by removing hashtags at the end
            cleaned_caption = caption.strip()
            hashtag_index = cleaned_caption.find('#')
            if hashtag_index > 0:
                cleaned_caption = cleaned_caption[:hashtag_index].strip()

            final_title = cleaned_caption
            print(f"📝 Using Instagram caption as title: {final_title}")
        else:
            # No caption found, use a generic title
            final_title = "Instagram Post"
            print(f"📝 No caption found, using generic title: {final_title}")
    # For Twitter/X posts, prioritize the scraped title (actual tweet content)
    elif platform and platform.lower() in ["twitter/x post"]:
        if scraped_title and scraped_title.strip():
            final_title = scraped_title.strip()
            print(f"📝 Using Twitter/X scraped title: {final_title}")
        else:
            print(f"📝 No scraped title found, using AI-generated title: {final_title}")
    elif scraped_title and not is_nonsense_title(scraped_title, platform):
        final_title = scraped_title
        print(f"📝 Using scraped title: {final_title}")
    else:
        print(f"📝 Using AI-generated title: {final_title}")

    # Truncate hashtags at the end of the title if present
    def truncate_title_at_trailing_hashtags(title):
        if not title:
            return title
        idx = title.find("#")
        if idx == -1:
            return title
        # If the hashtag is not at the start, truncate at the hashtag
        if idx > 0:
            before = title[:idx].rstrip()
            # Only truncate if the text before the hashtag does not itself start with a hashtag
            if before and not before.strip().startswith("#"):
                return before
        return title

    final_title = truncate_title_at_trailing_hashtags(final_title)
    print(f"📝 Final title after hashtag truncation: {final_title}")

    # Add normalization and fuzzy matching helpers

    def normalize_category(name):
        name = name.strip().lower()
        # Remove trailing 's' for simple plural (e.g., motorsports -> motorsport)
        if name.endswith("s") and not name.endswith("ss"):
            name = name[:-1]
        # Remove non-alphanumeric characters (optional, for even more robustness)
        name = re.sub(r"[^a-z0-9 ]", "", name)
        return name

    def find_similar_category(new_cat_name, categories, threshold=90):
        norm_new = normalize_category(new_cat_name)
        for cat in categories:
            norm_existing = normalize_category(cat["name"])
            score = fuzz.ratio(norm_new, norm_existing)
            if score >= threshold:
                return cat
        return None

    # Handle category (existing or new)
    category_id = None
    if "id" in ai_result["category"] and ai_result["category"]["id"]:
        # AI returned an existing category ID
        category_id = ai_result["category"]["id"]
        if "name" in ai_result["category"]:
            print(f"🏷️ Using existing category: {ai_result['category']['name']}")
    else:
        # AI returned a new category name or "Uncategorized"
        new_cat_name = ai_result["category"]["name"].strip()
        # Use robust normalization and fuzzy matching
        existing = find_similar_category(new_cat_name, categories)
        if existing:
            category_id = existing["id"]
            if "name" in existing:
                print(f"🏷️ Found similar existing category: {existing['name']}")
        else:
            # Create new category
            new_cat = {"name": new_cat_name, "ai_generated": True}
            print(f"🏷️ Creating new category: {new_cat['name']}")
            new_cat_result = add_category_firebase(uid, new_cat)
            if not new_cat_result["success"]:
                print(f"   ❌ Failed to create category: {new_cat_result['error']}")
                raise HTTPException(status_code=400, detail=new_cat_result["error"])
            category_id = new_cat_result["category"]["id"]
            if "name" in new_cat_result["category"]:
                print(f"   ✅ Category created: {new_cat_result['category']['name']}")

    # Update the entry with AI-enriched fields, but use the chosen title
    update_data = {
        "category_ids": [category_id],
        "tags": ai_result.get("tags", []),
        "title": final_title,
        "platform": platform,
        "duration": duration,
    }
    # Ensure thumbnail is preserved in update
    if entry_dict.get("thumbnail"):
        update_data["thumbnail"] = entry_dict["thumbnail"]

    print(f"🔄 Updating entry with enriched data...")
    print(f"   Category ID: {category_id}")
    print(f"   Tags: {update_data['tags']}")
    print(f"   Title: {update_data['title']}")

    update_result = update_entry_firebase(uid, saved_entry["id"], update_data)
    if not update_result["success"]:
        print(f"   ❌ Failed to update entry: {update_result['error']}")
        raise HTTPException(status_code=400, detail=update_result["error"])

    print(f"✅ Entry creation completed successfully!")
    print(f"📋 Final Entry Summary:")
    print(f"   ID: {update_result['entry']['id']}")
    print(f"   Platform: {update_result['entry'].get('platform', 'N/A')}")
    print(f"   Title: {update_result['entry'].get('title', 'N/A')}")
    print(f"   Category: {update_result['entry'].get('category_ids', [])}")
    print(f"   Tags: {update_result['entry'].get('tags', [])}")
    print("=" * 60)

    return update_result["entry"]


@router.get("/api/entries", response_model=List[Entry])
def get_user_entries(authorization: Optional[str] = Header(None)):
    """
    Get all entries for the logged-in user
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")

    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization scheme")
    except ValueError:
        raise HTTPException(
            status_code=401, detail="Invalid authorization header format"
        )

    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token["uid"]
    except Exception as e:
        raise HTTPException(
            status_code=401, detail=f"Token verification failed: {str(e)}"
        )

    result = get_entries_firebase(uid)

    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])

    return result["entries"]


@router.put("/api/entries/{entry_id}", response_model=Entry)
def update_user_entry(
    entry_id: str, entry: Entry, authorization: Optional[str] = Header(None)
):
    """
    Update an entry for the logged-in user
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization scheme")
    except ValueError:
        raise HTTPException(
            status_code=401, detail="Invalid authorization header format"
        )
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token["uid"]
    except Exception as e:
        raise HTTPException(
            status_code=401, detail=f"Token verification failed: {str(e)}"
        )

    # Get the current entry to compare category changes
    current_entries_result = get_entries_firebase(uid)
    if not current_entries_result["success"]:
        raise HTTPException(status_code=400, detail=current_entries_result["error"])

    current_entry = next(
        (e for e in current_entries_result["entries"] if e["id"] == entry_id), None
    )
    if not current_entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    # Track categories that might become empty
    old_category_ids = set(current_entry.get("category_ids", []))

    update_data = entry.model_dump(exclude_unset=True)
    result = update_entry_firebase(uid, entry_id, update_data)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])

    # Check if categories were removed and clean up empty AI-generated ones
    new_category_ids = set(update_data.get("category_ids", old_category_ids))
    removed_category_ids = old_category_ids - new_category_ids

    if removed_category_ids:
        cleanup_empty_ai_categories(uid, list(removed_category_ids))

    return result["entry"]


@router.delete("/api/entries/{entry_id}")
def delete_user_entry(entry_id: str, authorization: Optional[str] = Header(None)):
    """
    Delete an entry for the logged-in user
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization scheme")
    except ValueError:
        raise HTTPException(
            status_code=401, detail="Invalid authorization header format"
        )
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token["uid"]
    except Exception as e:
        raise HTTPException(
            status_code=401, detail=f"Token verification failed: {str(e)}"
        )

    # Get the entry before deleting to check its categories
    entries_result = get_entries_firebase(uid)
    if not entries_result["success"]:
        raise HTTPException(status_code=400, detail=entries_result["error"])

    entry_to_delete = next(
        (e for e in entries_result["entries"] if e["id"] == entry_id), None
    )
    if not entry_to_delete:
        raise HTTPException(status_code=404, detail="Entry not found")

    # Delete the entry
    result = delete_entry_firebase(uid, entry_id)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])

    # Clean up empty AI-generated categories
    cleanup_empty_ai_categories(uid, entry_to_delete.get("category_ids", []))

    return {"message": "Entry deleted successfully."}


def cleanup_empty_ai_categories(uid: str, affected_category_ids: list):
    """
    Check if any AI-generated categories are now empty after entry deletion and delete them.
    Only deletes categories that are AI-generated and have no remaining entries.
    """
    try:
        # Get all categories
        cat_result = get_categories_firebase(uid)
        if not cat_result["success"]:
            print(f"Failed to get categories for cleanup: {cat_result['error']}")
            return

        # Get all entries to check which categories are still in use
        entries_result = get_entries_firebase(uid)
        if not entries_result["success"]:
            print(f"Failed to get entries for cleanup: {entries_result['error']}")
            return

        categories = cat_result["categories"]
        entries = entries_result["entries"]

        # Create a set of all category IDs that are still in use
        categories_in_use = set()
        for entry in entries:
            if "category_ids" in entry and entry["category_ids"]:
                categories_in_use.update(entry["category_ids"])

        # Check each AI-generated category that was affected by the deletion
        for category in categories:
            if (
                category.get("ai_generated", False)
                and category["id"] in affected_category_ids
                and category["id"] not in categories_in_use
            ):

                # This AI-generated category is now empty, delete it
                delete_result = delete_category_firebase(uid, category["id"])
                if delete_result["success"]:
                    print(f"Deleted empty AI-generated category: {category['name']}")
                else:
                    print(
                        f"Failed to delete empty AI-generated category {category['name']}: {delete_result['error']}"
                    )

    except Exception as e:
        print(f"Error during category cleanup: {str(e)}")


@router.get("/api/entries/{entry_id}", response_model=Entry)
def get_user_entry(entry_id: str, authorization: Optional[str] = Header(None)):
    """
    Get a single entry for the logged-in user by entry_id
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization scheme")
    except ValueError:
        raise HTTPException(
            status_code=401, detail="Invalid authorization header format"
        )
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token["uid"]
    except Exception as e:
        raise HTTPException(
            status_code=401, detail=f"Token verification failed: {str(e)}"
        )
    # Fetch all entries and find the one with the matching id
    result = get_entries_firebase(uid)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    entries = result["entries"]
    entry = next((e for e in entries if e["id"] == entry_id), None)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    return entry


# --- COLLECTIONS ENDPOINTS ---


@router.post("/api/collections", response_model=Collection)
def create_collection(
    collection: Collection,
    authorization: Optional[str] = Header(None),
):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization scheme")
    except ValueError:
        raise HTTPException(
            status_code=401, detail="Invalid authorization header format"
        )
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token["uid"]
    except Exception as e:
        raise HTTPException(
            status_code=401, detail=f"Token verification failed: {str(e)}"
        )
    collection_dict = collection.model_dump()
    result = add_collection_firebase(uid, collection_dict)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return result["collection"]


@router.get("/api/collections", response_model=List[Collection])
def get_user_collections(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization scheme")
    except ValueError:
        raise HTTPException(
            status_code=401, detail="Invalid authorization header format"
        )
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token["uid"]
    except Exception as e:
        raise HTTPException(
            status_code=401, detail=f"Token verification failed: {str(e)}"
        )
    result = get_collections_firebase(uid)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return result["collections"]


@router.put("/api/collections/{collection_id}", response_model=Collection)
def update_user_collection(
    collection_id: str,
    collection: Collection,
    authorization: Optional[str] = Header(None),
):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization scheme")
    except ValueError:
        raise HTTPException(
            status_code=401, detail="Invalid authorization header format"
        )
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token["uid"]
    except Exception as e:
        raise HTTPException(
            status_code=401, detail=f"Token verification failed: {str(e)}"
        )
    update_data = collection.model_dump(exclude_unset=True)
    result = update_collection_firebase(uid, collection_id, update_data)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return result["collection"]


@router.delete("/api/collections/{collection_id}")
def delete_user_collection(
    collection_id: str, authorization: Optional[str] = Header(None)
):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization scheme")
    except ValueError:
        raise HTTPException(
            status_code=401, detail="Invalid authorization header format"
        )
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token["uid"]
    except Exception as e:
        raise HTTPException(
            status_code=401, detail=f"Token verification failed: {str(e)}"
        )
    result = delete_collection_firebase(uid, collection_id)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return {"message": "Collection deleted successfully."}


# --- CATEGORIES ENDPOINTS ---


@router.post("/api/categories", response_model=Category)
def create_category(
    category: Category,
    authorization: Optional[str] = Header(None),
):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization scheme")
    except ValueError:
        raise HTTPException(
            status_code=401, detail="Invalid authorization header format"
        )
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token["uid"]
    except Exception as e:
        raise HTTPException(
            status_code=401, detail=f"Token verification failed: {str(e)}"
        )
    # Check for existing category with same name (case-insensitive, trimmed)
    cat_result = get_categories_firebase(uid)
    if not cat_result["success"]:
        raise HTTPException(status_code=400, detail=cat_result["error"])
    categories = cat_result["categories"]
    new_cat_name = category.name.strip().lower()
    existing = next(
        (c for c in categories if c["name"].strip().lower() == new_cat_name), None
    )
    if existing:
        return existing
    category_dict = category.model_dump()
    category_dict["ai_generated"] = False  # User-created category
    result = add_category_firebase(uid, category_dict)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return result["category"]


@router.get("/api/categories", response_model=List[Category])
def get_user_categories(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization scheme")
    except ValueError:
        raise HTTPException(
            status_code=401, detail="Invalid authorization header format"
        )
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token["uid"]
    except Exception as e:
        raise HTTPException(
            status_code=401, detail=f"Token verification failed: {str(e)}"
        )
    result = get_categories_firebase(uid)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    # Fallback: ensure all categories have ai_generated, backfill as False if missing
    categories = result["categories"]
    for cat in categories:
        if "ai_generated" not in cat:
            cat["ai_generated"] = False
    return categories


@router.put("/api/categories/{category_id}", response_model=Category)
def update_user_category(
    category_id: str, category: Category, authorization: Optional[str] = Header(None)
):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization scheme")
    except ValueError:
        raise HTTPException(
            status_code=401, detail="Invalid authorization header format"
        )
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token["uid"]
    except Exception as e:
        raise HTTPException(
            status_code=401, detail=f"Token verification failed: {str(e)}"
        )
    # Check if a category with the new name exists (case-insensitive, trimmed)
    cat_result = get_categories_firebase(uid)
    if not cat_result["success"]:
        raise HTTPException(status_code=400, detail=cat_result["error"])
    categories = cat_result["categories"]
    new_cat_name = category.name.strip().lower()
    existing = next(
        (c for c in categories if c["name"].strip().lower() == new_cat_name), None
    )
    if existing and existing["id"] != category_id:
        # Reassign all entries to this existing category, then delete the old one
        entries_result = get_entries_firebase(uid)
        if not entries_result["success"]:
            raise HTTPException(status_code=400, detail=entries_result["error"])
        for entry in entries_result["entries"]:
            if category_id in entry.get("category_ids", []):
                new_cats = [cid for cid in entry["category_ids"] if cid != category_id]
                new_cats.append(existing["id"])
                update_entry_firebase(uid, entry["id"], {"category_ids": new_cats})
        delete_category_firebase(uid, category_id)
        return existing
    else:
        # Update the category name
        update_data = category.model_dump(exclude_unset=True)
        result = update_category_firebase(uid, category_id, update_data)
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        # Reassign all entries to this category (in case name is used for display)
        entries_result = get_entries_firebase(uid)
        if not entries_result["success"]:
            raise HTTPException(status_code=400, detail=entries_result["error"])
        for entry in entries_result["entries"]:
            if category_id in entry.get("category_ids", []):
                update_entry_firebase(uid, entry["id"], {"category_ids": [category_id]})
        return result["category"]


@router.delete("/api/categories/{category_id}")
def delete_user_category(category_id: str, authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization scheme")
    except ValueError:
        raise HTTPException(
            status_code=401, detail="Invalid authorization header format"
        )
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token["uid"]
    except Exception as e:
        raise HTTPException(
            status_code=401, detail=f"Token verification failed: {str(e)}"
        )

    # Get all entries for the user
    entries_result = get_entries_firebase(uid)
    if not entries_result["success"]:
        raise HTTPException(status_code=400, detail=entries_result["error"])

    # Find entries that belong to this category and delete them
    entries_to_delete = []
    for entry in entries_result["entries"]:
        if category_id in entry.get("category_ids", []):
            entries_to_delete.append(entry["id"])

    # Delete all entries that belong to this category
    deleted_count = 0
    for entry_id in entries_to_delete:
        delete_result = delete_entry_firebase(uid, entry_id)
        if delete_result["success"]:
            deleted_count += 1

    # Delete the category
    result = delete_category_firebase(uid, category_id)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])

    return {
        "message": f"Category deleted successfully. {deleted_count} entries were also deleted.",
        "deleted_entries_count": deleted_count,
    }


@router.get("/api/scrape/youtube")
def scrape_youtube(url: str = Query(...)):
    scraper = YouTubeScraper()
    return scraper.scrape(url)


@router.post("/api/enrich-entry")
def enrich_entry(data: dict = Body(...), authorization: str = Header(None)):
    print(f"\n🔍 ENRICH-ENTRY ENDPOINT CALLED")
    print(f"   Input data: {data}")

    url = data["url"]
    user_notes = data.get("user_notes", "")  # Keep for backward compatibility

    print(f"   URL: {url}")
    print(f"   User notes: {user_notes}")

    # Platform detection (reuse frontend logic or implement here)
    def detect_platform(url: str) -> str:
        url = url.lower()
        if (
            "youtube.com/shorts/" in url
            or "youtu.be/" in url
            and "?feature=share" in url
        ):
            return "YouTube Shorts"
        if "youtube.com/watch?v=" in url or "youtu.be/" in url:
            return "YouTube Video"
        if "/reels/" in url or "/reel/" in url:
            return "Instagram Reel"
        if "/p/" in url and "instagram.com" in url:
            return "Instagram Post"
        if "linkedin.com/feed/update/" in url or "linkedin.com/posts/" in url:
            return "LinkedIn Post"
        if "linkedin.com/jobs/view/" in url:
            return "LinkedIn Job"
        if "reddit.com/r/" in url and "/comments/" in url:
            return "Reddit Post"
        if "tiktok.com/" in url:
            return "TikTok Video"
        if "twitter.com/" in url or "x.com/" in url:
            return "Twitter/X Post"
        return "Unknown"

    platform = detect_platform(url)
    print(f"   🔍 Detected platform: {platform}")

    scraper = get_scraper(platform)
    print(f"   🔧 Using scraper: {scraper.__class__.__name__ if scraper else 'None'}")

    scraped_data = scraper.scrape(url) if scraper else {}
    if scraped_data and "error" in scraped_data:
        raise HTTPException(status_code=400, detail=f"YouTube scrape error: {scraped_data['error']}")
    print(
        f"   📊 Scraped data keys: {list(scraped_data.keys()) if scraped_data else 'None'}"
    )
    
    # Extract scraped title for title selection logic
    scraped_title = scraped_data.get("title") if scraped_data else None

    # Get categories for the user (decode from token if available, else fallback)
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization scheme")
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token["uid"]
        print(f"   👤 Authenticated user: {uid}")
    except Exception as e:
        print(f"   ⚠️ Authentication failed: {e}")
        uid = None

    categories = []
    if uid:
        cat_result = get_categories_firebase(uid)
        if cat_result["success"]:
            categories = cat_result["categories"]
            print(f"   📂 Found {len(categories)} categories for user")
        else:
            print(f"   ❌ Failed to fetch categories: {cat_result['error']}")
    else:
        print(f"   ⚠️ No user ID, using empty categories list")

    entry_data = aggregate_entry_data(
        url, platform, scraped_data, user_notes, categories
    )
    print(f"   📋 Aggregated entry data keys: {list(entry_data.keys())}")

    # Promote duration to top-level if present in metadata
    duration = None
    if entry_data.get("metadata") and "duration" in entry_data["metadata"]:
        duration = entry_data["metadata"]["duration"]
        entry_data["duration"] = duration
        print(f"   ⏱️ Duration promoted: {duration} seconds")

    prompt = format_ai_prompt(entry_data)
    print(f"   🤖 AI prompt length: {len(prompt)} characters")

    ai_response = classify_entry(
        entry_data, categories
    )  # classify_entry should call OpenAI and return the AI's JSON response

    print(f"   🧠 AI response received:")
    print(f"     Category: {ai_response.get('category', {})}")
    print(f"     Title: {ai_response.get('title', 'N/A')}")
    print(f"     Tags: {ai_response.get('tags', [])}")

    if ai_response and "category" in ai_response and "name" in ai_response["category"]:
        print(f"category: {ai_response['category']['name']}")
    
    # Title selection logic
    final_title = ai_response.get("title", "")
    
    # For Instagram posts, prioritize the caption over AI-generated titles
    if platform and platform.lower() in ["instagram post", "instagram reel"]:
        caption = scraped_data.get("description", "") if scraped_data else ""
        if caption and caption.strip():
            # Clean up the caption by removing hashtags at the end
            cleaned_caption = caption.strip()
            hashtag_index = cleaned_caption.find('#')
            if hashtag_index > 0:
                cleaned_caption = cleaned_caption[:hashtag_index].strip()

            final_title = cleaned_caption
            print(f"📝 Using Instagram caption as title: {final_title}")
        else:
            # No caption found, use a generic title
            final_title = "Instagram Post"
            print(f"📝 No caption found, using generic title: {final_title}")
    # For Twitter/X posts, prioritize the scraped title (actual tweet content)
    elif platform and platform.lower() in ["twitter/x post"]:
        if scraped_title and scraped_title.strip():
            final_title = scraped_title.strip()
            print(f"📝 Using Twitter/X scraped title: {final_title}")
        else:
            print(f"📝 No scraped title found, using AI-generated title: {final_title}")
    elif scraped_title and scraped_title.strip():
        final_title = scraped_title.strip()
        print(f"📝 Using scraped title: {final_title}")
    else:
        print(f"📝 Using AI-generated title: {final_title}")
    
    # Update the AI response with the selected title
    ai_response["title"] = final_title
    
    print("success")

    # Return both the AI response and the scraped data (including thumbnail)
    result = {
        "ai": ai_response,
        "scraped": scraped_data,
        "thumbnail": scraped_data.get("thumbnail"),
    }

    print(f"   ✅ Enrichment completed, returning result")
    return result


@router.post("/api/scrape")
def scrape_url(
    request: Request,
    url: str = Body(..., embed=True),
):
    """
    Scrape the given URL, detect the platform, and return only the scraped data (no AI enrichment).
    """
    platform = None

    # Use the same platform detection logic as in create_entry
    def detect_platform(url: str) -> str:
        url = url.lower()
        if (
            "youtube.com/shorts/" in url
            or "youtu.be/" in url
            and "?feature=share" in url
        ):
            return "YouTube Shorts"
        if "youtube.com/watch?v=" in url or "youtu.be/" in url:
            return "YouTube Video"
        if "/reels/" in url or "/reel/" in url:
            return "Instagram Reel"
        if "/p/" in url and "instagram.com" in url:
            return "Instagram Post"
        if "linkedin.com/feed/update/" in url or "linkedin.com/posts/" in url:
            return "LinkedIn Post"
        if "linkedin.com/jobs/view/" in url:
            return "LinkedIn Job"
        if "reddit.com/r/" in url and "/comments/" in url:
            return "Reddit Post"
        if "tiktok.com/" in url:
            return "TikTok Video"
        if "twitter.com/" in url or "x.com/" in url:
            return "Twitter/X Post"
        return "Unknown"

    platform = detect_platform(url)
    scraper = get_scraper(platform)
    if not scraper:
        return {
            "success": False,
            "error": f"No scraper available for platform: {platform}",
        }
    scraped_data = scraper.scrape(url)
    return {"success": True, "platform": platform, **scraped_data}


@router.post("/api/cleanup-empty-categories")
def cleanup_empty_categories_endpoint(authorization: Optional[str] = Header(None)):
    """
    Manually trigger cleanup of empty AI-generated categories.
    This is useful for cleaning up existing data or as a maintenance task.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization scheme")
    except ValueError:
        raise HTTPException(
            status_code=401, detail="Invalid authorization header format"
        )
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token["uid"]
    except Exception as e:
        raise HTTPException(
            status_code=401, detail=f"Token verification failed: {str(e)}"
        )

    try:
        # Get all categories
        cat_result = get_categories_firebase(uid)
        if not cat_result["success"]:
            raise HTTPException(status_code=400, detail=cat_result["error"])

        # Get all entries to check which categories are still in use
        entries_result = get_entries_firebase(uid)
        if not entries_result["success"]:
            raise HTTPException(status_code=400, detail=entries_result["error"])

        categories = cat_result["categories"]
        entries = entries_result["entries"]

        # Create a set of all category IDs that are still in use
        categories_in_use = set()
        for entry in entries:
            if "category_ids" in entry and entry["category_ids"]:
                categories_in_use.update(entry["category_ids"])

        # Find and delete empty AI-generated categories
        deleted_categories = []
        for category in categories:
            if (
                category.get("ai_generated", False)
                and category["id"] not in categories_in_use
            ):

                # This AI-generated category is empty, delete it
                delete_result = delete_category_firebase(uid, category["id"])
                if delete_result["success"]:
                    deleted_categories.append(category["name"])
                    print(f"Deleted empty AI-generated category: {category['name']}")
                else:
                    print(
                        f"Failed to delete empty AI-generated category {category['name']}: {delete_result['error']}"
                    )

        return {
            "message": f"Cleanup completed. Deleted {len(deleted_categories)} empty AI-generated categories.",
            "deleted_categories": deleted_categories,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")


@router.post("/api/mentions")
def process_mention(mention: Mention):
    """
    Process incoming mentions from social media platforms.
    This endpoint receives mentions from bots/monitors and either:
    1. Saves content directly if user is found via social_identity_links
    2. Queues for user confirmation if no match found
    """
    try:
        print(
            f"[MENTION RECEIVED] {mention.platform} - {mention.username}: {mention.comment[:100]}..."
        )

        # TODO: Implement social identity lookup
        # For now, just log the mention and return success
        # In the future, this will:
        # 1. Look up username in social_identity_links table
        # 2. If found, create entry for that user
        # 3. If not found, queue for confirmation

        # Log the mention data
        mention_data = mention.model_dump()
        print(f"Mention data: {mention_data}")

        # For now, return success
        return {
            "success": True,
            "message": "Mention received and logged",
            "mention_id": f"{mention.platform}_{mention.comment_id}_{mention.timestamp}",
            "status": "logged",  # Will be "saved" or "queued" in future
        }

    except Exception as e:
        print(f"Error processing mention: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to process mention: {str(e)}"
        )


@router.post("/api/ai-feedback")
def submit_ai_feedback(
    feedback: dict = Body(...),
    authorization: Optional[str] = Header(None),
):
    """
    Submit feedback about AI classification to improve future performance.
    """
    try:
        # Authenticate user
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization scheme")
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token["uid"]
        
        # Extract feedback data
        entry_id = feedback.get("entry_id")
        original_category = feedback.get("original_category")
        suggested_category = feedback.get("suggested_category")
        feedback_type = feedback.get("type")  # "correction", "rating", "suggestion"
        rating = feedback.get("rating")  # 1-5 scale
        notes = feedback.get("notes", "")
        
        # Store feedback in Firebase
        feedback_data = {
            "entry_id": entry_id,
            "original_category": original_category,
            "suggested_category": suggested_category,
            "feedback_type": feedback_type,
            "rating": rating,
            "notes": notes,
        }
        
        result = store_ai_feedback_firebase(uid, feedback_data)
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result["error"])
        
        print(f"📝 AI Feedback received:")
        print(f"   User: {uid}")
        print(f"   Entry: {entry_id}")
        print(f"   Original: {original_category}")
        print(f"   Suggested: {suggested_category}")
        print(f"   Rating: {rating}")
        print(f"   Feedback ID: {result.get('feedback_id', 'N/A')}")
        
        return {"success": True, "message": "Feedback submitted successfully"}
        
    except Exception as e:
        print(f"❌ AI feedback error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
