import os
import firebase_admin
from firebase_admin import credentials, firestore, auth
from pathlib import Path


# Initialize Firebase Admin SDK
def initialize_firebase():
    """Initialize Firebase Admin SDK with service account credentials"""
    try:
        # Get the path to the service account file
        current_dir = Path(__file__).parent
        service_account_path = (
            current_dir.parent
            / "infrastructure"
            / "credentials"
            / "service-account.json"
        )

        if not service_account_path.exists():
            raise FileNotFoundError(
                f"Service account file not found at {service_account_path}"
            )

        # Initialize Firebase Admin SDK
        cred = credentials.Certificate(str(service_account_path))
        firebase_admin.initialize_app(cred)

        print("✅ Firebase Admin SDK initialized successfully")
        return True

    except Exception as e:
        print(f"❌ Failed to initialize Firebase Admin SDK: {e}")
        return False


# Get Firestore client
def get_firestore_client():
    """Get Firestore client instance"""
    try:
        return firestore.client()
    except Exception as e:
        print(f"❌ Failed to get Firestore client: {e}")
        return None


# Verify Firebase ID token
async def verify_id_token(id_token: str):
    """Verify Firebase ID token and return decoded user info"""
    try:
        decoded_token = auth.verify_id_token(id_token)
        return {
            "success": True,
            "user": {
                "uid": decoded_token["uid"],
                "email": decoded_token.get("email"),
                "email_verified": decoded_token.get("email_verified", False),
                "name": decoded_token.get("name"),
                "picture": decoded_token.get("picture"),
            },
        }
    except auth.ExpiredIdTokenError:
        return {"success": False, "error": "Token expired"}
    except auth.RevokedIdTokenError:
        return {"success": False, "error": "Token revoked"}
    except auth.InvalidIdTokenError:
        return {"success": False, "error": "Invalid token"}
    except Exception as e:
        return {"success": False, "error": f"Token verification failed: {str(e)}"}


# Get user by UID
def get_user_by_uid(uid: str):
    """Get user record from Firebase Auth by UID"""
    try:
        user = auth.get_user(uid)
        return {
            "success": True,
            "user": {
                "uid": user.uid,
                "email": user.email,
                "email_verified": user.email_verified,
                "display_name": user.display_name,
                "photo_url": user.photo_url,
                "disabled": user.disabled,
            },
        }
    except auth.UserNotFoundError:
        return {"success": False, "error": "User not found"}
    except Exception as e:
        return {"success": False, "error": f"Failed to get user: {str(e)}"}


# Change user password
def change_password(uid: str, new_password: str):
    """Change user's password in Firebase Auth"""
    try:
        auth.update_user(uid, password=new_password)
        return {"success": True, "message": "Password updated successfully"}
    except auth.UserNotFoundError:
        return {"success": False, "error": "User not found"}
    except Exception as e:
        return {"success": False, "error": f"Failed to update password: {str(e)}"}


# Add an entry for a user
def add_entry(uid: str, entry_data: dict):
    """Add an entry to a user's 'entries' subcollection in Firestore"""
    try:
        db = get_firestore_client()
        if not db:
            raise Exception("Firestore client not available")

        # Reference the user's entries subcollection and add a new document
        entry_ref = (
            db.collection("users").document(uid).collection("entries").document()
        )
        entry_data["id"] = entry_ref.id
        entry_ref.set(entry_data)

        return {"success": True, "entry": entry_data}
    except Exception as e:
        return {"success": False, "error": f"Failed to add entry: {str(e)}"}


# Get all entries for a user
def get_entries(uid: str):
    """Get all entries from a user's 'entries' subcollection in Firestore"""
    try:
        db = get_firestore_client()
        if not db:
            raise Exception("Firestore client not available")

        entries_ref = db.collection("users").document(uid).collection("entries")
        entries = [doc.to_dict() for doc in entries_ref.stream()]

        return {"success": True, "entries": entries}
    except Exception as e:
        return {"success": False, "error": f"Failed to get entries: {str(e)}"}


# Update an entry for a user
def update_entry(uid: str, entry_id: str, update_data: dict):
    """Update an entry in a user's 'entries' subcollection in Firestore"""
    try:
        db = get_firestore_client()
        if not db:
            raise Exception("Firestore client not available")
        entry_ref = (
            db.collection("users")
            .document(uid)
            .collection("entries")
            .document(entry_id)
        )
        entry_ref.update(update_data)
        updated_entry = entry_ref.get().to_dict()
        return {"success": True, "entry": updated_entry}
    except Exception as e:
        return {"success": False, "error": f"Failed to update entry: {str(e)}"}


# Delete an entry for a user
def delete_entry(uid: str, entry_id: str):
    """Delete an entry from a user's 'entries' subcollection in Firestore"""
    try:
        db = get_firestore_client()
        if not db:
            raise Exception("Firestore client not available")
        entry_ref = (
            db.collection("users")
            .document(uid)
            .collection("entries")
            .document(entry_id)
        )
        entry_ref.delete()
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": f"Failed to delete entry: {str(e)}"}


# --- COLLECTIONS HELPERS ---


def add_collection(uid: str, collection_data: dict):
    """Add a collection to a user's 'collections' subcollection in Firestore"""
    try:
        db = get_firestore_client()
        if not db:
            raise Exception("Firestore client not available")
        collection_ref = (
            db.collection("users").document(uid).collection("collections").document()
        )
        collection_data["id"] = collection_ref.id
        collection_ref.set(collection_data)
        return {"success": True, "collection": collection_data}
    except Exception as e:
        return {"success": False, "error": f"Failed to add collection: {str(e)}"}


def get_collections(uid: str):
    """Get all collections from a user's 'collections' subcollection in Firestore"""
    try:
        db = get_firestore_client()
        if not db:
            raise Exception("Firestore client not available")
        collections_ref = db.collection("users").document(uid).collection("collections")
        collections = [doc.to_dict() for doc in collections_ref.stream()]
        return {"success": True, "collections": collections}
    except Exception as e:
        return {"success": False, "error": f"Failed to get collections: {str(e)}"}


def update_collection(uid: str, collection_id: str, update_data: dict):
    """Update a collection in a user's 'collections' subcollection in Firestore"""
    try:
        db = get_firestore_client()
        if not db:
            raise Exception("Firestore client not available")
        collection_ref = (
            db.collection("users")
            .document(uid)
            .collection("collections")
            .document(collection_id)
        )
        collection_ref.update(update_data)
        updated_collection = collection_ref.get().to_dict()
        return {"success": True, "collection": updated_collection}
    except Exception as e:
        return {"success": False, "error": f"Failed to update collection: {str(e)}"}


def delete_collection(uid: str, collection_id: str):
    """Delete a collection from a user's 'collections' subcollection in Firestore"""
    try:
        db = get_firestore_client()
        if not db:
            raise Exception("Firestore client not available")
        collection_ref = (
            db.collection("users")
            .document(uid)
            .collection("collections")
            .document(collection_id)
        )
        collection_ref.delete()
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": f"Failed to delete collection: {str(e)}"}
