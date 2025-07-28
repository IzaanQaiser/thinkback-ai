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


# --- CATEGORIES HELPERS ---


def add_category(uid: str, category_data: dict):
    """Add a category to a user's 'categories' subcollection in Firestore"""
    try:
        db = get_firestore_client()
        if not db:
            raise Exception("Firestore client not available")
        category_ref = (
            db.collection("users").document(uid).collection("categories").document()
        )
        category_data["id"] = category_ref.id
        category_ref.set(category_data)
        return {"success": True, "category": category_data}
    except Exception as e:
        return {"success": False, "error": f"Failed to add category: {str(e)}"}


def get_categories(uid: str):
    """Get all categories from a user's 'categories' subcollection in Firestore"""
    try:
        db = get_firestore_client()
        if not db:
            raise Exception("Firestore client not available")
        categories_ref = db.collection("users").document(uid).collection("categories")
        categories = [doc.to_dict() for doc in categories_ref.stream()]
        return {"success": True, "categories": categories}
    except Exception as e:
        return {"success": False, "error": f"Failed to get categories: {str(e)}"}


def update_category(uid: str, category_id: str, update_data: dict):
    """Update a category in a user's 'categories' subcollection in Firestore"""
    try:
        db = get_firestore_client()
        if not db:
            raise Exception("Firestore client not available")
        category_ref = (
            db.collection("users")
            .document(uid)
            .collection("categories")
            .document(category_id)
        )
        category_ref.update(update_data)
        updated_category = category_ref.get().to_dict()
        return {"success": True, "category": updated_category}
    except Exception as e:
        return {"success": False, "error": f"Failed to update category: {str(e)}"}


def delete_category(uid: str, category_id: str):
    """Delete a category from Firestore"""
    try:
        db = get_firestore_client()
        if not db:
            return {"success": False, "error": "Failed to get Firestore client"}

        # Delete the category document
        category_ref = db.collection("users").document(uid).collection("categories").document(category_id)
        category_ref.delete()

        return {"success": True, "message": "Category deleted successfully"}
    except Exception as e:
        return {"success": False, "error": f"Failed to delete category: {str(e)}"}


# AI Feedback Functions
def store_ai_feedback(uid: str, feedback_data: dict):
    """Store AI feedback in Firestore"""
    try:
        db = get_firestore_client()
        if not db:
            return {"success": False, "error": "Failed to get Firestore client"}

        # Add timestamp if not provided
        if "timestamp" not in feedback_data:
            from datetime import datetime
            feedback_data["timestamp"] = datetime.now().isoformat()

        # Add user ID
        feedback_data["uid"] = uid

        # Store in ai_feedback collection
        feedback_ref = db.collection("users").document(uid).collection("ai_feedback").document()
        feedback_ref.set(feedback_data)

        return {
            "success": True,
            "message": "Feedback stored successfully",
            "feedback_id": feedback_ref.id
        }
    except Exception as e:
        return {"success": False, "error": f"Failed to store feedback: {str(e)}"}


def get_ai_feedback(uid: str, limit: int = 100):
    """Get AI feedback for a user from Firestore"""
    try:
        db = get_firestore_client()
        if not db:
            return {"success": False, "error": "Failed to get Firestore client"}

        # Get feedback documents
        feedback_ref = db.collection("users").document(uid).collection("ai_feedback")
        feedback_docs = feedback_ref.order_by("timestamp", direction=firestore.Query.DESCENDING).limit(limit).stream()

        feedback_list = []
        for doc in feedback_docs:
            feedback_data = doc.to_dict()
            feedback_data["id"] = doc.id
            feedback_list.append(feedback_data)

        return {
            "success": True,
            "feedback": feedback_list,
            "count": len(feedback_list)
        }
    except Exception as e:
        return {"success": False, "error": f"Failed to get feedback: {str(e)}"}


def get_all_ai_feedback(limit: int = 1000):
    """Get all AI feedback across all users (for analysis)"""
    try:
        db = get_firestore_client()
        if not db:
            return {"success": False, "error": "Failed to get Firestore client"}

        # Get all users
        users_ref = db.collection("users")
        users = users_ref.stream()

        all_feedback = []
        for user_doc in users:
            uid = user_doc.id

            # Get feedback for this user
            feedback_ref = user_doc.reference.collection("ai_feedback")
            feedback_docs = feedback_ref.order_by("timestamp", direction=firestore.Query.DESCENDING).limit(limit).stream()

            for doc in feedback_docs:
                feedback_data = doc.to_dict()
                feedback_data["id"] = doc.id
                feedback_data["user_id"] = uid
                all_feedback.append(feedback_data)

        return {
            "success": True,
            "feedback": all_feedback,
            "count": len(all_feedback)
        }
    except Exception as e:
        return {"success": False, "error": f"Failed to get all feedback: {str(e)}"}


def delete_ai_feedback(uid: str, feedback_id: str):
    """Delete specific AI feedback"""
    try:
        db = get_firestore_client()
        if not db:
            return {"success": False, "error": "Failed to get Firestore client"}

        # Delete the feedback document
        feedback_ref = db.collection("users").document(uid).collection("ai_feedback").document(feedback_id)
        feedback_ref.delete()

        return {"success": True, "message": "Feedback deleted successfully"}
    except Exception as e:
        return {"success": False, "error": f"Failed to delete feedback: {str(e)}"}


def analyze_feedback_patterns():
    """Analyze feedback patterns for AI improvement"""
    try:
        # Get all feedback
        result = get_all_ai_feedback()
        if not result["success"]:
            return result

        feedback_list = result["feedback"]

        # Analyze patterns
        patterns = {
            "total_feedback": len(feedback_list),
            "average_rating": 0,
            "correction_patterns": {},
            "category_issues": {},
            "platform_performance": {}
        }

        if feedback_list:
            # Calculate average rating
            ratings = [f.get("rating", 0) for f in feedback_list if f.get("rating")]
            if ratings:
                patterns["average_rating"] = sum(ratings) / len(ratings)

            # Analyze corrections
            corrections = [f for f in feedback_list if f.get("type") == "correction"]
            for correction in corrections:
                original = correction.get("original_category", "Unknown")
                suggested = correction.get("suggested_category", "Unknown")

                if original not in patterns["correction_patterns"]:
                    patterns["correction_patterns"][original] = {}

                if suggested not in patterns["correction_patterns"][original]:
                    patterns["correction_patterns"][original][suggested] = 0

                patterns["correction_patterns"][original][suggested] += 1

        return {
            "success": True,
            "patterns": patterns
        }
    except Exception as e:
        return {"success": False, "error": f"Failed to analyze feedback patterns: {str(e)}"}


def store_user_feedback(uid: str, feedback_data: dict):
    """
    Store user feedback (bug reports or feature suggestions) in Firestore
    """
    try:
        db = get_firestore_client()
        if not db:
            return {"success": False, "error": "Failed to get Firestore client"}

        # Add metadata to feedback
        feedback_doc = {
            "uid": uid,
            "type": feedback_data.get("type"),  # 'bug' or 'feature'
            "title": feedback_data.get("title"),
            "description": feedback_data.get("description"),
            "priority": feedback_data.get("priority", "medium"),
            "userAgent": feedback_data.get("userAgent"),
            "url": feedback_data.get("url"),
            "status": "new",  # 'new', 'in_progress', 'resolved', 'closed'
            "created_at": firestore.SERVER_TIMESTAMP,
            "updated_at": firestore.SERVER_TIMESTAMP
        }

        # Add to user_feedback collection
        feedback_ref = db.collection("user_feedback")
        doc_ref = feedback_ref.add(feedback_doc)[1]

        print(f"📝 User feedback stored:")
        print(f"   User: {uid}")
        print(f"   Type: {feedback_data.get('type')}")
        print(f"   Title: {feedback_data.get('title')}")
        print(f"   Priority: {feedback_data.get('priority')}")
        print(f"   Feedback ID: {doc_ref.id}")

        return {"success": True, "feedback_id": doc_ref.id}

    except Exception as e:
        print(f"❌ Failed to store user feedback: {e}")
        return {"success": False, "error": f"Failed to store feedback: {str(e)}"}


def get_user_feedback(uid: str = None, limit: int = 100):
    """
    Get user feedback from Firestore
    If uid is provided, get feedback for that user only
    If uid is None, get all feedback (admin function)
    """
    try:
        db = get_firestore_client()
        if not db:
            return {"success": False, "error": "Failed to get Firestore client"}

        feedback_ref = db.collection("user_feedback")
        
        if uid:
            # Get feedback for specific user
            query = feedback_ref.where("uid", "==", uid).order_by("created_at", direction=firestore.Query.DESCENDING).limit(limit)
        else:
            # Get all feedback (admin)
            query = feedback_ref.order_by("created_at", direction=firestore.Query.DESCENDING).limit(limit)

        feedback_docs = query.stream()
        feedback_list = []

        for doc in feedback_docs:
            data = doc.to_dict()
            data["id"] = doc.id
            feedback_list.append(data)

        return {"success": True, "feedback": feedback_list}

    except Exception as e:
        return {"success": False, "error": f"Failed to get user feedback: {str(e)}"}


def update_feedback_status(feedback_id: str, status: str, admin_notes: str = None):
    """
    Update feedback status (admin function)
    """
    try:
        db = get_firestore_client()
        if not db:
            return {"success": False, "error": "Failed to get Firestore client"}

        feedback_ref = db.collection("user_feedback").document(feedback_id)
        
        update_data = {
            "status": status,
            "updated_at": firestore.SERVER_TIMESTAMP
        }
        
        if admin_notes:
            update_data["admin_notes"] = admin_notes

        feedback_ref.update(update_data)

        return {"success": True, "message": "Feedback status updated successfully"}

    except Exception as e:
        return {"success": False, "error": f"Failed to update feedback status: {str(e)}"}
