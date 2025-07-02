import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from router import router
from firebase import initialize_firebase

# Always load .env from project root (one level up from backend/)
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
dotenv_path = os.path.join(project_root, ".env")
load_dotenv(dotenv_path=dotenv_path)

# Initialize Firebase Admin SDK
firebase_initialized = initialize_firebase()

app = FastAPI(
    title="Thinkback.ai API",
    description="AI-powered personal memory system",
    version="0.1.0",
)

# CORS (Cross-Origin Resource Sharing)
origins = [
    "http://localhost",
    "http://localhost:5173",  # React frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
