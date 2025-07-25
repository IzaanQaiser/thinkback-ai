#!/usr/bin/env python3
"""
LinkedIn credentials configuration for job scraping.
"""

import os
from typing import Optional, Dict, Any
from pathlib import Path

# Try to load from .env file
def load_env_file():
    """Load environment variables from .env file."""
    env_file = Path(__file__).parent.parent / ".env"
    if env_file.exists():
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key] = value

# Load .env file
load_env_file()

# LinkedIn credentials - these should be set as environment variables
# or you can set them directly here (not recommended for production)
LINKEDIN_EMAIL = os.getenv('LINKEDIN_EMAIL', '')
LINKEDIN_PASSWORD = os.getenv('LINKEDIN_PASSWORD', '')

# Alternative: You can set credentials directly here (for testing)
# LINKEDIN_EMAIL = "your-email@example.com"
# LINKEDIN_PASSWORD = "your-password"

def get_linkedin_credentials() -> Dict[str, str]:
    """
    Get LinkedIn credentials from environment variables or direct assignment.
    
    Returns:
        Dict with 'email' and 'password' keys
    """
    if not LINKEDIN_EMAIL or not LINKEDIN_PASSWORD:
        raise ValueError(
            "LinkedIn credentials not found. Please set LINKEDIN_EMAIL and "
            "LINKEDIN_PASSWORD environment variables, or set them directly in "
            "this file for testing. Run setup_linkedin_credentials.py to configure."
        )
    
    return {
        'email': LINKEDIN_EMAIL,
        'password': LINKEDIN_PASSWORD
    }

def has_linkedin_credentials() -> bool:
    """
    Check if LinkedIn credentials are available.
    
    Returns:
        True if credentials are available, False otherwise
    """
    try:
        get_linkedin_credentials()
        return True
    except ValueError:
        return False

# LinkedIn login URLs
LINKEDIN_LOGIN_URL = "https://www.linkedin.com/login"
LINKEDIN_SESSION_URL = "https://www.linkedin.com/checkpoint/lg/login"

# LinkedIn job page selectors (updated based on actual page structure)
JOB_SELECTORS = {
    'company_name': [
        'a[data-testid="job-details-company-name"]',
        'a[data-testid="job-details-company"]',
        'span[data-testid="job-details-company-name"]',
        'span[data-testid="job-details-company"]',
        'a[class*="company-name"]',
        'span[class*="company-name"]',
        'div[class*="company-name"] a',
        'div[class*="company-name"] span',
        'a[class*="job-details-company"]',
        'span[class*="job-details-company"]',
        'div[class*="job-details-company"] a',
        'div[class*="job-details-company"] span',
        # Additional selectors for different page layouts
        'a[class*="job-details__company-name"]',
        'span[class*="job-details__company-name"]',
        'div[class*="job-details__company"] a',
        'div[class*="job-details__company"] span',
        'a[class*="job-details-company-name"]',
        'span[class*="job-details-company-name"]',
    ],
    'position_title': [
        'h1[data-testid="job-details-job-title"]',
        'h1[data-testid="job-title"]',
        'h1[class*="job-title"]',
        'h1[class*="job-details-title"]',
        'div[class*="job-title"] h1',
        'div[class*="job-details-title"] h1',
        'h1[class*="job-details-job-title"]',
        'h1[class*="job-title"]',
        'div[data-testid="job-details-job-title"] h1',
        'div[data-testid="job-title"] h1',
        # Additional selectors for different page layouts
        'h1[class*="job-details__job-title"]',
        'h1[class*="job-details__title"]',
        'div[class*="job-details__job-title"] h1',
        'div[class*="job-details__title"] h1',
        'h1[class*="job-details-job-title"]',
        'h1[class*="job-details-title"]',
    ],
    'company_logo': [
        'img[data-testid="job-details-company-logo"]',
        'img[data-testid="company-logo"]',
        'img[class*="company-logo"]',
        'img[class*="job-details-company-logo"]',
        'div[class*="company-logo"] img',
        'div[class*="job-details-company-logo"] img',
        'img[alt*="company logo"]',
        'img[alt*="logo"]',
        # Additional selectors for different page layouts
        'img[class*="job-details__company-logo"]',
        'div[class*="job-details__company-logo"] img',
        'img[class*="job-details-company-logo"]',
        'img[class*="job-details-company-logo"]',
    ]
} 