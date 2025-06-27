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
)
from pydantic import BaseModel, EmailStr, Field
from firebase_admin import auth
from datetime import datetime
from ai import classify_entry, aggregate_entry_data, format_ai_prompt
from scrapers.youtube import YouTubeScraper
from scraper_factory import get_scraper

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
    summary: Optional[str] = None  # AI-generated summary
    thumbnail: Optional[str] = None  # Add thumbnail field
    duration: Optional[int] = None  # Duration in seconds


class Collection(BaseModel):
    id: Optional[str] = None
    name: str
    created_at: datetime = Field(default_factory=datetime.now)
    entry_ids: List[str] = []


class Category(BaseModel):
    id: Optional[str] = None
    name: str
    created_at: datetime = Field(default_factory=datetime.now)


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

    # Always detect platform from URL
    entry_dict = entry.model_dump()
    url = entry_dict.get("url")

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
        if "instagram.com/reels/" in url:
            return "Instagram Reel"
        if "instagram.com/p/" in url:
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

    # Always scrape the URL to get metadata (including duration)
    duration = None
    if url and platform:
        scraper = get_scraper(platform)
        if scraper:
            scraped_data = scraper.scrape(url)
            print(f"[create_entry] Scraped data: {scraped_data}")
            if (
                scraped_data
                and "metadata" in scraped_data
                and scraped_data["metadata"]
                and "duration" in scraped_data["metadata"]
            ):
                duration = scraped_data["metadata"]["duration"]
                entry_dict["duration"] = duration
                print(f"[create_entry] Extracted duration: {duration}")
            # Also save thumbnail if present
            if scraped_data.get("thumbnail"):
                entry_dict["thumbnail"] = scraped_data["thumbnail"]

    print("[create_entry] entry_dict to be saved:", entry_dict)
    print(
        "[create_entry] About to save entry with duration:", entry_dict.get("duration")
    )
    # Save initial entry
    result = add_entry_firebase(uid, entry_dict)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    saved_entry = result["entry"]

    # Fetch all categories for the user
    cat_result = get_categories_firebase(uid)
    if not cat_result["success"]:
        raise HTTPException(status_code=400, detail=cat_result["error"])
    categories = cat_result["categories"]  # List of dicts with 'id' and 'name'

    # Call the classification agent
    ai_result = classify_entry(saved_entry, categories)

    # Handle category (existing or new)
    category_id = None
    if "id" in ai_result["category"] and ai_result["category"]["id"]:
        # AI returned an existing category ID
        category_id = ai_result["category"]["id"]
    else:
        # AI returned a new category name or "Uncategorized"
        new_cat_name = ai_result["category"]["name"].strip().lower()
        existing = next(
            (c for c in categories if c["name"].strip().lower() == new_cat_name), None
        )
        if existing:
            category_id = existing["id"]
        else:
            # Create new category
            new_cat = {"name": ai_result["category"]["name"]}
            new_cat_result = add_category_firebase(uid, new_cat)
            if not new_cat_result["success"]:
                raise HTTPException(status_code=400, detail=new_cat_result["error"])
            category_id = new_cat_result["category"]["id"]

    # Update the entry with AI-enriched fields
    update_data = {
        "category_ids": [category_id],
        "tags": ai_result.get("tags", []),
        "title": ai_result.get("title", ""),
        "summary": ai_result.get("summary", ""),
        "platform": platform,
        "duration": duration,
    }
    # Ensure thumbnail is preserved in update
    if entry_dict.get("thumbnail"):
        update_data["thumbnail"] = entry_dict["thumbnail"]
    update_result = update_entry_firebase(uid, saved_entry["id"], update_data)
    if not update_result["success"]:
        raise HTTPException(status_code=400, detail=update_result["error"])

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
    update_data = entry.model_dump(exclude_unset=True)
    result = update_entry_firebase(uid, entry_id, update_data)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
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
    result = delete_entry_firebase(uid, entry_id)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return {"message": "Entry deleted successfully."}


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
    return result["categories"]


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
    url = data["url"]
    user_notes = data.get("user_notes", "")
    print(f"[enrich_entry] Incoming URL: {url}")

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
        if "instagram.com/reels/" in url:
            return "Instagram Reel"
        if "instagram.com/p/" in url:
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
    print(f"[enrich_entry] Detected platform: {platform}")
    scraper = get_scraper(platform)
    scraped_data = scraper.scrape(url) if scraper else {}
    print(f"[enrich_entry] Scraped data: {scraped_data}")
    # Get categories for the user (decode from token if available, else fallback)
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization scheme")
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token["uid"]
    except Exception:
        uid = None
    categories = []
    if uid:
        cat_result = get_categories_firebase(uid)
        if cat_result["success"]:
            categories = cat_result["categories"]
    entry_data = aggregate_entry_data(
        url, platform, scraped_data, user_notes, categories
    )
    print(f"[enrich_entry] Aggregated entry data: {entry_data}")
    # Promote duration to top-level if present in metadata
    duration = None
    if entry_data.get("metadata") and "duration" in entry_data["metadata"]:
        duration = entry_data["metadata"]["duration"]
        entry_data["duration"] = duration
    print(
        f"[enrich_entry] entry_data to be saved (pre-AI, with duration): {entry_data}"
    )
    prompt = format_ai_prompt(entry_data)
    print(f"[enrich_entry] AI prompt: {prompt}")
    ai_response = classify_entry(
        entry_data, categories
    )  # classify_entry should call OpenAI and return the AI's JSON response
    print(f"[enrich_entry] AI response: {ai_response}")
    # Return both the AI response and the scraped data (including thumbnail)
    return {
        "ai": ai_response,
        "scraped": scraped_data,
        "thumbnail": scraped_data.get("thumbnail"),
    }


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
        if "instagram.com/reels/" in url:
            return "Instagram Reel"
        if "instagram.com/p/" in url:
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
