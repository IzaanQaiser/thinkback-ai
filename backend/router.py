from fastapi import APIRouter, HTTPException, Header, Body
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
from ai import classify_entry

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
    Create a new entry for the logged-in user, then enrich it with AI classification (category, tags, title).
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

    entry_dict = entry.model_dump()
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
    if ai_result["category"]["id"]:
        category_id = ai_result["category"]["id"]
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
    }
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
    update_data = category.model_dump(exclude_unset=True)
    result = update_category_firebase(uid, category_id, update_data)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
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
    result = delete_category_firebase(uid, category_id)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return {"message": "Category deleted successfully."}
