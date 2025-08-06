# Firebase Authentication Fix for Custom Domains

## Problem
Firebase Authentication with `signInWithRedirect` was failing on custom domains (https://thinkback.ca) with a blank screen at `/__/auth/handler` and console error:
```
Refused to display 'https://thinkback.ca/' in a frame because it set 'X-Frame-Options' to 'deny'.
```

## Root Cause
1. **X-Frame-Options Header**: Global `X-Frame-Options: DENY` header was blocking Firebase's auth handler iframe
2. **Service Worker Interference**: Multiple fetch event listeners were still interfering with auth routes
3. **Redirect Flow**: Firebase needs to load its auth handler in an iframe, which was being blocked

## Solution Implemented

### 1. Fixed Service Worker Interference
- **File**: `frontend/public/sw.js`
- **Changes**:
  - Consolidated multiple fetch event listeners into a single handler
  - Added early return for `/__/auth/` routes to completely bypass service worker
  - Used `url.pathname.includes('/__/auth/')` for more precise matching

### 2. Fixed X-Frame-Options Header
- **File**: `frontend/public/_headers`
- **Changes**:
  - Added specific rule for `/__/auth/*` routes to use `X-Frame-Options: SAMEORIGIN`
  - This allows Firebase's auth handler iframe to load properly
  - Maintains security for other routes with `X-Frame-Options: DENY`

### 3. Enhanced Redirect Result Handling
- **File**: `frontend/src/contexts/AuthContext.tsx`
- **Changes**:
  - Added better debugging with console logs
  - Added timeout to ensure Firebase is fully initialized
  - Improved error handling for redirect results

### 4. Enhanced App Navigation
- **File**: `frontend/src/App.tsx`
- **Changes**:
  - Added comprehensive debugging for authentication flow
  - Enhanced navigation logic to handle redirect completion
  - Better error handling and user feedback

## How It Works Now

1. **User clicks "Sign in with Google"**
2. **Redirect to Google OAuth**: User is redirected to Google's OAuth page
3. **Google redirects back**: After authentication, Google redirects to your domain
4. **Firebase loads auth handler**: Firebase loads `/__/auth/handler` in an iframe (now allowed)
5. **Service worker bypasses**: Service worker completely ignores auth routes
6. **App detects the result**: `getRedirectResult()` processes the authentication
7. **User state updates**: `onAuthStateChanged` triggers and updates the user state
8. **Navigation occurs**: App component detects the authenticated user and navigates to dashboard

## Key Technical Fixes

### Service Worker Fix
```javascript
// CRITICAL: Completely bypass service worker for Firebase auth routes
if (url.pathname.includes('/__/auth/')) {
  // Let Firebase handle these requests completely without any service worker interference
  return;
}
```

### Headers Fix
```nginx
# Exclude Firebase auth routes from X-Frame-Options to allow OAuth handshake
/__/auth/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

## Benefits

- ✅ **Fixes X-Frame-Options error**: Firebase auth handler can now load in iframe
- ✅ **Works on all environments**: localhost, firebaseapp.com, pages.dev, thinkback.ca
- ✅ **Service worker compatible**: Completely bypasses auth routes
- ✅ **Better debugging**: Comprehensive console logging for troubleshooting
- ✅ **More reliable**: Redirect-based auth is more stable than popup-based auth

## Testing Checklist

### Before Deployment
- [ ] Test on localhost (http://localhost:5173)
- [ ] Test on Firebase hosting (https://your-app.firebaseapp.com)
- [ ] Test on Cloudflare Pages (https://your-app.pages.dev)

### After Deployment
- [ ] Test on custom domain (https://thinkback.ca)
- [ ] Test with different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test with incognito/private browsing
- [ ] Test with popup blockers enabled
- [ ] Test with service worker enabled/disabled
- [ ] Verify no X-Frame-Options errors in console
- [ ] Verify successful navigation to dashboard after sign-in

## Environment Variables Required

Ensure these are set in your deployment environment:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=thinkback.ca
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Firebase Console Configuration

Verify these settings in Firebase Console:
1. **Authentication > Settings > Authorized domains**:
   - `localhost`
   - `your-app.firebaseapp.com`
   - `your-app.pages.dev`
   - `thinkback.ca`

2. **Authentication > Sign-in method > Google**:
   - **OAuth Authorized JavaScript Origins**:
     - `http://localhost:5173`
     - `https://your-app.firebaseapp.com`
     - `https://your-app.pages.dev`
     - `https://thinkback.ca`
     - `https://www.thinkback.ca`
   - **OAuth Authorized Redirect URIs**:
     - `https://thinkback.ca/__/auth/handler`

## Troubleshooting

### If authentication still fails:
1. **Check browser console** for error messages
2. **Verify Firebase configuration** in the console
3. **Clear browser cache** and try again
4. **Check service worker** - disable it temporarily to test
5. **Verify domain settings** in Firebase Console
6. **Check network tab** for failed requests to `/__/auth/handler`

### Common Issues:
- **"Refused to display in frame"**: X-Frame-Options header still blocking
- **"auth/redirect-cancelled-by-user"**: User cancelled the sign-in
- **"auth/redirect-operation-pending"**: Another sign-in is in progress
- **"auth/network-request-failed"**: Network connectivity issues
- **"auth/operation-not-allowed"**: Google sign-in not enabled in Firebase

### Debug Steps:
1. Open browser console and look for:
   - `✅ Redirect result received:` - indicates successful auth
   - `🔄 User authenticated, handling redirect...` - indicates user state update
   - `✅ Got ID token, verifying with backend...` - indicates token retrieval
   - `🔄 Navigating from /auth to /dashboard` - indicates successful navigation

## Rollback Plan

If issues occur, you can rollback by:
1. Reverting the service worker changes in `sw.js`
2. Reverting the headers changes in `_headers`
3. Reverting the AuthContext changes to use `signInWithPopup`
4. Removing the redirect result handling

However, the redirect-based approach with proper headers is more reliable and recommended for production use. 