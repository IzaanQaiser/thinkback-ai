import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from router import router
from firebase import initialize_firebase
import re
from starlette.responses import Response
from starlette.types import ASGIApp, Receive, Scope, Send
from starlette.middleware.cors import ALL_METHODS

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
class CustomCORSMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # Extract origin from headers
        headers = dict(scope.get("headers") or [])
        origin = None
        for k, v in headers.items():
            if k == b"origin":
                origin = v.decode()
                break

        # Check if origin is allowed
        is_allowed = False
        if origin in origins:
            is_allowed = True
        elif origin and (re.match(r"^https://[a-z0-9-]+\.thinkback-ai-staging\.pages\.dev$", origin) or 
                        re.match(r"^https://[a-z0-9-]+\.thinkback-ai-testing\.pages\.dev$", origin)):
            is_allowed = True

        # Handle OPTIONS preflight requests
        if scope["method"] == "OPTIONS":
            response_headers = {}
            if is_allowed and origin:
                response_headers.update({
                    "access-control-allow-origin": origin,
                    "access-control-allow-credentials": "true",
                    "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
                    "access-control-allow-headers": "*",
                })
            response = Response(status_code=200, headers=response_headers)
            await response(scope, receive, send)
            return

        # For non-OPTIONS requests, add CORS headers if origin is allowed
        if is_allowed and origin:
            async def send_wrapper(message):
                if message["type"] == "http.response.start":
                    headers = dict(message["headers"])
                    headers[b"access-control-allow-origin"] = origin.encode()
                    headers[b"access-control-allow-credentials"] = b"true"
                    message["headers"] = list(headers.items())
                await send(message)
            await self.app(scope, receive, send_wrapper)
        else:
            await self.app(scope, receive, send)

app.add_middleware(CustomCORSMiddleware)

# Include router
app.include_router(router)
