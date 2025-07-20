#!/usr/bin/env python3
"""
Script to install Playwright browsers at runtime if they're missing.
"""

import subprocess
import sys
import os


def install_browsers():
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


if __name__ == "__main__":
    success = install_browsers()
    sys.exit(0 if success else 1) 