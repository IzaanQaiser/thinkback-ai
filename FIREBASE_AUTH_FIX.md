# Firebase Authentication Fix for Custom Domains

## Problem
Firebase Authentication with `signInWithPopup` was failing on custom domains (https://thinkback.ca) while working on localhost and firebaseapp.com. The popup would open, redirect to `/__/auth/handler`, and then go blank without completing the authentication.

## Root Cause
1. **Popup Authentication Issues**: `signInWithPopup` has known compatibility issues with custom domains, especially when service workers are involved
2. **Service Worker Interference**: The service worker was potentially caching or interfering with Firebase auth handler routes
3. **Redirect Flow**: Custom domains work better with redirect-based authentication

## Solution Implemented

### 1. Switch from Popup to Redirect Authentication
- **File**: `frontend/src/contexts/AuthContext.tsx`
- **Changes**:
  - Replaced `signInWithPopup` with `signInWithRedirect`
  - Added `getRedirectResult` import and handling
  - Added redirect result handling in `useEffect`

### 2. Update Service Worker
- **File**: `frontend/public/sw.js`
- **Changes**:
  - Added exclusion for Firebase auth handler routes (`/__/auth/handler`, `/__/auth/callback`, `/__/auth/redirect`)
  - Prevents service worker from interfering with authentication flow

### 3. Update Authentication Pages
- **Files**: `frontend/src/pages/AuthPage.tsx`, `frontend/src/pages/SignupPage.tsx`
- **Changes**:
  - Removed immediate navigation after sign-in
  - Let redirect flow handle the authentication process
  - Updated error handling for redirect-based flow

### 4. Enhanced App Component
- **File**: `frontend/src/App.tsx`
- **Changes**:
  - Added redirect result handling
  - Automatic navigation to dashboard after successful authentication
  - Token verification after redirect

### 5. Improved Error Handling
- **File**: `frontend/src/utils/errors.ts`
- **Changes**:
  - Added error mappings for redirect-based authentication errors
  - Better user feedback for various authentication scenarios

## How It Works Now

1. **User clicks "Sign in with Google"**
2. **Redirect to Google OAuth**: User is redirected to Google's OAuth page
3. **Google redirects back**: After authentication, Google redirects to your domain
4. **Firebase handles the redirect**: Firebase processes the authentication result
5. **App detects the result**: `getRedirectResult()` in AuthContext processes the result
6. **User state updates**: `onAuthStateChanged` triggers and updates the user state
7. **Navigation occurs**: App component detects the authenticated user and navigates to dashboard

## Benefits

- ✅ **Works on all environments**: localhost, firebaseapp.com, pages.dev, thinkback.ca
- ✅ **More reliable**: Redirect-based auth is more stable than popup-based auth
- ✅ **Better UX**: No popup blockers or window focus issues
- ✅ **Service worker compatible**: Properly excludes auth routes from caching
- ✅ **Error handling**: Comprehensive error messages for various scenarios

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

### Common Issues:
- **"auth/redirect-cancelled-by-user"**: User cancelled the sign-in
- **"auth/redirect-operation-pending"**: Another sign-in is in progress
- **"auth/network-request-failed"**: Network connectivity issues
- **"auth/operation-not-allowed"**: Google sign-in not enabled in Firebase

## Rollback Plan

If issues occur, you can rollback by:
1. Reverting the AuthContext changes to use `signInWithPopup`
2. Removing the redirect result handling
3. Reverting the service worker changes
4. Updating the authentication pages to handle popup flow

However, the redirect-based approach is more reliable and recommended for production use. 