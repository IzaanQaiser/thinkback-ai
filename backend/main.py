from fastapi import FastAPI
from router import router
from firebase import initialize_firebase

# Initialize Firebase Admin SDK
firebase_initialized = initialize_firebase()

app = FastAPI(
    title="Thinkback.ai API",
    description="AI-powered personal memory system",
    version="0.1.0",
)

# Include router
app.include_router(router)


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    if firebase_initialized:
        print("🚀 Thinkback.ai API started successfully with Firebase integration")
    else:
        print("⚠️  Thinkback.ai API started but Firebase initialization failed")
