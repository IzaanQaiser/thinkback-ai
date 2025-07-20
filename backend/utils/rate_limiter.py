"""
Rate limiting utilities for API calls with exponential backoff and jitter.
"""

import time
import random
import logging
from typing import Callable, Any, Optional
from functools import wraps

logger = logging.getLogger(__name__)


class RateLimiter:
    """Rate limiter with exponential backoff and jitter."""
    
    def __init__(self, max_retries: int = 3, base_delay: float = 1.0, max_delay: float = 60.0):
        self.max_retries = max_retries
        self.base_delay = base_delay
        self.max_delay = max_delay
    
    def get_delay(self, attempt: int) -> float:
        """Calculate delay with exponential backoff and jitter."""
        # Exponential backoff: base_delay * 2^attempt
        delay = min(self.base_delay * (2 ** attempt), self.max_delay)
        
        # Add jitter (±25% random variation)
        jitter = delay * 0.25 * random.uniform(-1, 1)
        return max(0.1, delay + jitter)
    
    def should_retry(self, status_code: int, attempt: int) -> bool:
        """Determine if a request should be retried based on status code."""
        # Retry on 429 (rate limit), 500-599 (server errors), and some 400s
        retryable_codes = {429, 500, 502, 503, 504, 408, 429}
        return status_code in retryable_codes and attempt < self.max_retries


def with_retry(max_retries: int = 3, base_delay: float = 1.0):
    """Decorator to add retry logic to API calls."""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            limiter = RateLimiter(max_retries, base_delay)
            
            for attempt in range(max_retries + 1):
                try:
                    result = func(*args, **kwargs)
                    
                    # If the function returns a tuple (response, status_code)
                    if isinstance(result, tuple) and len(result) == 2:
                        response, status_code = result
                        
                        if limiter.should_retry(status_code, attempt):
                            delay = limiter.get_delay(attempt)
                            logger.warning(f"API call failed with status {status_code}, retrying in {delay:.2f}s (attempt {attempt + 1}/{max_retries + 1})")
                            time.sleep(delay)
                            continue
                        
                        return response
                    
                    # If the function returns just the response
                    return result
                    
                except Exception as e:
                    if attempt < max_retries:
                        delay = limiter.get_delay(attempt)
                        logger.warning(f"API call failed with exception: {e}, retrying in {delay:.2f}s (attempt {attempt + 1}/{max_retries + 1})")
                        time.sleep(delay)
                        continue
                    else:
                        logger.error(f"API call failed after {max_retries + 1} attempts: {e}")
                        raise
            
            return None
        
        return wrapper
    return decorator


def twitter_api_call_with_retry(func: Callable) -> Callable:
    """Specialized decorator for Twitter API calls with appropriate retry logic."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        limiter = RateLimiter(max_retries=3, base_delay=5.0, max_delay=60.0)
        
        for attempt in range(4):  # 0, 1, 2, 3 = 4 attempts
            try:
                result = func(*args, **kwargs)
                
                # Check if result is a tuple (response, status_code)
                if isinstance(result, tuple) and len(result) == 2:
                    response, status_code = result
                    
                    if status_code == 429:  # Rate limited
                        if attempt < 3:
                            delay = limiter.get_delay(attempt)
                            print(f"   ⏳ Rate limited (429). Waiting {delay:.1f}s before retry...")
                            time.sleep(delay)
                            continue
                        else:
                            print(f"   ❌ Rate limit exceeded after {attempt + 1} attempts")
                            return None
                    
                    elif status_code >= 500:  # Server error
                        if attempt < 3:
                            delay = limiter.get_delay(attempt)
                            print(f"   ⏳ Server error ({status_code}). Waiting {delay:.1f}s before retry...")
                            time.sleep(delay)
                            continue
                        else:
                            print(f"   ❌ Server error after {attempt + 1} attempts")
                            return None
                    
                    elif status_code == 404:  # Not found
                        print(f"   ❌ Resource not found (404)")
                        return None
                    
                    elif status_code != 200:  # Other error
                        print(f"   ❌ API returned status {status_code}")
                        return None
                    
                    return response
                
                # If result is not a tuple, assume success
                return result
                
            except Exception as e:
                if attempt < 3:
                    delay = limiter.get_delay(attempt)
                    print(f"   ⏳ Request failed: {e}. Waiting {delay:.1f}s before retry...")
                    time.sleep(delay)
                    continue
                else:
                    print(f"   ❌ Request failed after {attempt + 1} attempts: {e}")
                    return None
        
        return None
    
    return wrapper 