from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from firebase import verify_id_token

router = APIRouter()


@router.get("/ping")
async def ping():
    return {"message": "pong"}


@router.post("/verify-token")
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
    result = await verify_id_token(token)

    if not result["success"]:
        raise HTTPException(status_code=401, detail=result["error"])

    return {"message": "Token verified successfully", "user": result["user"]}
