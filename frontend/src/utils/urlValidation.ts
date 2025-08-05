// URL validation utility for the save process

export interface URLValidationResult {
  isValid: boolean;
  error?: string;
  platform?: string;
}

// Supported platforms and their URL patterns
const SUPPORTED_PLATFORMS = {
  'YouTube Video': [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=/,
    /^https?:\/\/(www\.)?youtu\.be\//
  ],
  'YouTube Shorts': [
    /^https?:\/\/(www\.)?youtube\.com\/shorts\//
  ],
  'Instagram Post': [
    /^https?:\/\/(www\.)?instagram\.com\/p\//
  ],
  'Instagram Reel': [
    /^https?:\/\/(www\.)?instagram\.com\/reels?\//
  ],
  'Twitter/X Post': [
    /^https?:\/\/(www\.)?twitter\.com\/[^\/]+\/status\//,
    /^https?:\/\/(www\.)?x\.com\/[^\/]+\/status\//
  ],
  'LinkedIn Post': [
    /^https?:\/\/(www\.)?linkedin\.com\/posts\//,
    /^https?:\/\/(www\.)?linkedin\.com\/feed\/update\//
  ],
  'LinkedIn Job': [
    /^https?:\/\/(www\.)?linkedin\.com\/jobs\/view\//
  ],
  'Reddit Post': [
    /^https?:\/\/(www\.)?reddit\.com\/r\/[^\/]+\/comments\//
  ],
  'TikTok Video': [
    /^https?:\/\/(www\.)?tiktok\.com\/@[^\/]+\/video\//
  ]
};

export function validateURL(url: string): URLValidationResult {
  // Basic URL format validation
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      error: 'Please enter a valid URL'
    };
  }

  // Trim whitespace
  const trimmedUrl = url.trim();
  
  if (!trimmedUrl) {
    return {
      isValid: false,
      error: 'Please enter a URL'
    };
  }

  // Check if it's a valid URL format
  try {
    new URL(trimmedUrl);
  } catch {
    return {
      isValid: false,
      error: 'Please enter a valid URL (e.g., https://youtube.com/watch?v=...)'
    };
  }

  // Check if it's an HTTP/HTTPS URL
  if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    return {
      isValid: false,
      error: 'Please enter a URL that starts with http:// or https://'
    };
  }

  // Check if it's supported by our platform
  let detectedPlatform: string | undefined;
  
  for (const [platform, patterns] of Object.entries(SUPPORTED_PLATFORMS)) {
    for (const pattern of patterns) {
      if (pattern.test(trimmedUrl)) {
        detectedPlatform = platform;
        break;
      }
    }
    if (detectedPlatform) break;
  }

  if (!detectedPlatform) {
    return {
      isValid: false,
      error: 'This URL is not from a supported platform. We support YouTube, Instagram, Twitter/X, LinkedIn, Reddit, and TikTok.',
      platform: 'Unknown'
    };
  }

  return {
    isValid: true,
    platform: detectedPlatform
  };
}

export function getSupportedPlatforms(): string[] {
  return Object.keys(SUPPORTED_PLATFORMS);
}

export function isURLFromSupportedPlatform(url: string): boolean {
  const result = validateURL(url);
  return result.isValid && result.platform !== 'Unknown';
} 