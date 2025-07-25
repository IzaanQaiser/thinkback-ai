#!/usr/bin/env python3
"""
Setup script for LinkedIn credentials.
This script helps you configure LinkedIn credentials for job scraping.
"""

import os
import getpass
from pathlib import Path

def setup_linkedin_credentials():
    """Interactive setup for LinkedIn credentials."""
    print("🔐 LinkedIn Credentials Setup")
    print("=" * 40)
    print()
    print("This script will help you configure LinkedIn credentials for job scraping.")
    print("Your credentials will be stored as environment variables.")
    print()
    
    # Get credentials from user
    email = input("Enter your LinkedIn email: ").strip()
    password = getpass.getpass("Enter your LinkedIn password: ").strip()
    
    if not email or not password:
        print("❌ Email and password are required.")
        return False
    
    # Create .env file in the backend directory
    backend_dir = Path(__file__).parent
    env_file = backend_dir / ".env"
    
    # Read existing .env file if it exists
    existing_vars = {}
    if env_file.exists():
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    existing_vars[key] = value
    
    # Update with LinkedIn credentials
    existing_vars['LINKEDIN_EMAIL'] = email
    existing_vars['LINKEDIN_PASSWORD'] = password
    
    # Write .env file
    with open(env_file, 'w') as f:
        f.write("# LinkedIn Credentials for Job Scraping\n")
        f.write("# This file contains sensitive information - keep it secure!\n\n")
        for key, value in existing_vars.items():
            f.write(f"{key}={value}\n")
    
    print(f"✅ Credentials saved to {env_file}")
    print()
    print("📝 Next steps:")
    print("1. Make sure to add .env to your .gitignore file to keep credentials secure")
    print("2. Test the job scraper with: python test_linkedin_job_scraper.py")
    print()
    
    return True

def test_credentials():
    """Test if credentials are properly configured."""
    print("🧪 Testing LinkedIn credentials...")
    
    try:
        from credentials.linkedin_credentials import has_linkedin_credentials, get_linkedin_credentials
        
        if has_linkedin_credentials():
            credentials = get_linkedin_credentials()
            print(f"✅ Credentials found:")
            print(f"   Email: {credentials['email']}")
            print(f"   Password: {'*' * len(credentials['password'])}")
            return True
        else:
            print("❌ No credentials found")
            return False
            
    except Exception as e:
        print(f"❌ Error testing credentials: {e}")
        return False

if __name__ == "__main__":
    print("🚀 LinkedIn Credentials Setup")
    print()
    
    # Check if credentials already exist
    if test_credentials():
        print()
        response = input("Credentials already exist. Do you want to update them? (y/n): ")
        if response.lower() != 'y':
            print("Setup cancelled.")
            exit(0)
    
    print()
    if setup_linkedin_credentials():
        print("🎉 Setup completed successfully!")
    else:
        print("❌ Setup failed.") 