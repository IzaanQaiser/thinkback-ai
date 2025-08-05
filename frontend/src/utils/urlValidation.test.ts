import { validateURL, isURLFromSupportedPlatform } from './urlValidation';

// Simple test function to verify URL validation
export function testURLValidation() {
  const testCases = [
    {
      url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      expected: { isValid: true, platform: 'YouTube Video' }
    },
    {
      url: 'https://youtube.com/shorts/dQw4w9WgXcQ',
      expected: { isValid: true, platform: 'YouTube Shorts' }
    },
    {
      url: 'https://instagram.com/p/ABC123',
      expected: { isValid: true, platform: 'Instagram Post' }
    },
    {
      url: 'https://twitter.com/username/status/123456',
      expected: { isValid: true, platform: 'Twitter/X Post' }
    },
    {
      url: 'https://x.com/username/status/123456',
      expected: { isValid: true, platform: 'Twitter/X Post' }
    },
    {
      url: 'https://reddit.com/r/programming/comments/123456',
      expected: { isValid: true, platform: 'Reddit Post' }
    },
    {
      url: 'https://tiktok.com/@user/video/123456',
      expected: { isValid: true, platform: 'TikTok Video' }
    },
    {
      url: 'https://linkedin.com/posts/123456',
      expected: { isValid: true, platform: 'LinkedIn Post' }
    },
    {
      url: 'invalid-url',
      expected: { isValid: false, error: 'Please enter a valid URL (e.g., https://youtube.com/watch?v=...)' }
    },
    {
      url: 'https://unsupported-platform.com/video/123',
      expected: { isValid: false, platform: 'Unknown' }
    },
    {
      url: '',
      expected: { isValid: false, error: 'Please enter a URL' }
    }
  ];

  console.log('🧪 Testing URL validation...');
  
  testCases.forEach((testCase, index) => {
    const result = validateURL(testCase.url);
    const passed = result.isValid === testCase.expected.isValid && 
                   result.platform === testCase.expected.platform;
    
    console.log(`Test ${index + 1}: ${passed ? '✅' : '❌'} ${testCase.url}`);
    if (!passed) {
      console.log(`  Expected: ${JSON.stringify(testCase.expected)}`);
      console.log(`  Got: ${JSON.stringify(result)}`);
    }
  });
  
  console.log('✅ URL validation tests completed');
}

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment - expose for testing
  (window as any).testURLValidation = testURLValidation;
} 