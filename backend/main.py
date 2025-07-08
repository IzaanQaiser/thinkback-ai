import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from router import router
from firebase import initialize_firebase
import re

# Always load .env from project root (one level up from backend/)
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
dotenv_path = os.path.join(project_root, ".env")
load_dotenv(dotenv_path=dotenv_path)

# Initialize Firebase Admin SDK
firebase_initialized = initialize_firebase()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services on startup"""
    if firebase_initialized:
        print("🚀 Thinkback.ai API started successfully with Firebase integration")
    else:
        print("⚠️  Thinkback.ai API started but Firebase initialization failed")
    yield


app = FastAPI(
    title="Thinkback.ai API",
    description="AI-powered personal memory system",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS (Cross-Origin Resource Sharing)
origins = [
    "http://localhost",
    "http://localhost:5173",
    "https://thinkback.ca",  # Production frontend
    "https://guacamole.thinkback.ca",  # Staging frontend (if needed)
    "https://thinkback-ai-staging.pages.dev",
    "https://thinkback-ai-testing.pages.dev"
]

# Custom CORS middleware to allow all preview subdomains for both staging and testing
class CustomCORSMiddleware(CORSMiddleware):
    def is_allowed_origin(self, origin: str) -> bool:
        if origin in origins:
            return True
        # Allow all preview subdomains for staging and testing
        if re.match(r"^https://[a-z0-9-]+\\.thinkback-ai-staging\\.pages\\.dev$", origin):
            return True
        if re.match(r"^https://[a-z0-9-]+\\.thinkback-ai-testing\\.pages\\.dev$", origin):
            return True
        return False

app.add_middleware(
    CustomCORSMiddleware,
    allow_origins=origins,  # This is still required for the base class
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include router
app.include_router(router)
