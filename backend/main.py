import os
import asyncio
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from contextlib import asynccontextmanager
import threading
import time

# Global flag to track initialization status
initialization_complete = False
initialization_error = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting Thinkback Backend...")
    
    # Start initialization in background thread
    def initialize_backend():
        global initialization_complete, initialization_error
        try:
            print("🔧 Initializing backend components...")
            
            # Import and initialize Firebase
            from firebase import initialize_firebase
            if not initialize_firebase():
                raise Exception("Failed to initialize Firebase")
            print("✅ Firebase Admin SDK initialized successfully")
            
            # Check Playwright browsers (non-blocking)
            try:
                from playwright.sync_api import sync_playwright
                with sync_playwright() as p:
                    browser = p.chromium.launch(headless=True)
                    browser.close()
                print("✅ Playwright browsers are ready")
            except Exception as e:
                print(f"⚠️ Playwright browser check failed: {e}")
            
            initialization_complete = True
            print("✅ Backend initialization complete")
            
        except Exception as e:
            initialization_error = str(e)
            print(f"❌ Backend initialization failed: {e}")
    
    # Start initialization in background
    init_thread = threading.Thread(target=initialize_backend, daemon=True)
    init_thread.start()
    
    yield
    
    # Shutdown
    print("🛑 Shutting down Thinkback Backend...")

# Create FastAPI app with lifespan
app = FastAPI(
    title="Thinkback Backend API",
    description="Backend API for Thinkback - AI-powered content organization",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://thinkback-ai-testing.pages.dev",
        "https://thinkback-ai.pages.dev", 
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint that responds immediately
@app.get("/health")
async def health_check():
    return {"status": "healthy", "initialized": initialization_complete}

# Middleware to handle requests during initialization
@app.middleware("http")
async def initialization_middleware(request: Request, call_next):
    # Allow health checks and OPTIONS requests to pass through immediately
    if request.url.path == "/health" or request.method == "OPTIONS":
        return await call_next(request)
    
    # For other requests, wait for initialization (with timeout)
    if not initialization_complete:
        if initialization_error:
            return JSONResponse(
                status_code=503,
                content={
                    "detail": f"Service temporarily unavailable: {initialization_error}",
                    "retry_after": 5
                }
            )
        
        # Wait up to 10 seconds for initialization
        start_time = time.time()
        while not initialization_complete and (time.time() - start_time) < 10:
            await asyncio.sleep(0.1)
        
        if not initialization_complete:
            return JSONResponse(
                status_code=503,
                content={
                    "detail": "Service starting up, please retry in a few seconds",
                    "retry_after": 3
                }
            )
    
    return await call_next(request)

# Import and include routers
from router import router as api_router
app.include_router(api_router)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        access_log=True,
        log_level="info"
    )
