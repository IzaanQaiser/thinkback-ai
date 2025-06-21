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
async def change_password(uid: str, new_password: str):
    """Change user's password in Firebase Auth"""
    try:
        auth.update_user(uid, password=new_password)
        return {"success": True, "message": "Password updated successfully"}
    except auth.UserNotFoundError:
        return {"success": False, "error": "User not found"}
    except Exception as e:
        return {"success": False, "error": f"Failed to update password: {str(e)}"}
