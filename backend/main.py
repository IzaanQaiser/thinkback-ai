import os
import subprocess
from contextlib import asynccontextmanager
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


def install_playwright_browsers():
    """Install Playwright browsers if they're missing."""
    try:
        print("🔧 Checking Playwright browser installation...")
        
        # Check if browsers are installed
        result = subprocess.run(
            ["playwright", "install", "--dry-run", "chromium"],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("✅ Playwright browsers are already installed")
            return True
        else:
            print("❌ Playwright browsers not found, installing...")
            
            # Install browsers
            install_result = subprocess.run(
                ["playwright", "install", "chromium"],
                capture_output=True,
                text=True
            )
            
            if install_result.returncode == 0:
                print("✅ Playwright browsers installed successfully")
                return True
            else:
                print(f"❌ Failed to install browsers: {install_result.stderr}")
                return False
                
    except Exception as e:
        print(f"❌ Error checking/installing browsers: {e}")
        return False


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services on startup"""
    # Install Playwright browsers
    install_playwright_browsers()
    
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
    "https://thinkback-ai-testing.pages.dev",
    "https://testing.thinkback.ca",
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
