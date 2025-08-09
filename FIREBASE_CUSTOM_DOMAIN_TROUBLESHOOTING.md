# Firebase Authentication Custom Domain Troubleshooting Guide

## Current Issue
You're experiencing a blank screen at `https://thinkback.ca/__/auth/handler` when trying to sign in with Google on your custom domain.

## Step-by-Step Troubleshooting

### 1. **Test the Debug Configuration**
1. Go to your app at `https://thinkback.ca/auth`
2. Click the "Debug Firebase Config" button
3. Check the browser console for the output
4. Verify that the expected redirect URI matches what's in Google Cloud Console

### 2. **Verify Google Cloud Console Configuration**

#### OAuth 2.0 Client ID Settings
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services > Credentials**
3. Find your OAuth 2.0 Client ID for your web application
4. Click on it to edit

#### Authorized JavaScript Origins
Make sure these are added:
```
http://localhost:5173
https://thinkback.ca
https://www.thinkback.ca
```

#### Authorized Redirect URIs
Make sure this EXACT URI is added:
```
https://thinkback.ca/__/auth/handler
```

**Important**: The redirect URI must match exactly - no trailing slashes, no extra parameters.

### 3. **Verify Firebase Console Configuration**

#### Authentication > Settings > Authorized Domains
Make sure these domains are listed:
```
localhost
thinkback.ca
www.thinkback.ca
```

#### Authentication > Sign-in Method > Google
1. Make sure Google sign-in is enabled
2. Check that the OAuth client ID matches your Google Cloud Console client ID

### 4. **Check Environment Variables**
Verify your `.env` file or deployment environment has:
```
VITE_FIREBASE_AUTH_DOMAIN=thinkback.ca
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_PROJECT_ID=your_project_id
```

### 5. **Test the Authentication Flow**

#### Step 1: Clear Browser Data
1. Clear browser cache and cookies for `thinkback.ca`
2. Open browser developer tools
3. Go to `https://thinkback.ca/auth`

#### Step 2: Monitor the Flow
1. Click "Sign in with Google"
2. Watch the browser console for these messages:
   - `🔍 Checking for redirect result...`
   - `📍 Current URL: https://thinkback.ca/__/auth/handler?...`
   - `🔧 Firebase config: {...}`

#### Step 3: Check Network Tab
1. In developer tools, go to Network tab
2. Look for requests to `/__/auth/handler`
3. Check the response status and headers

### 6. **Common Issues and Solutions**

#### Issue: "Refused to display in frame"
**Solution**: This should be fixed by the `X-Frame-Options: SAMEORIGIN` header for `/__/auth/*` routes.

#### Issue: Redirect URI mismatch
**Symptoms**: 
- User gets redirected to Google OAuth
- After authentication, they land on a blank page
- Console shows "No redirect result found"

**Solution**: 
1. Double-check the redirect URI in Google Cloud Console
2. Make sure it's exactly: `https://thinkback.ca/__/auth/handler`
3. Remove any duplicate entries

#### Issue: Service Worker Interference
**Symptoms**: Authentication works in incognito mode but not in normal mode

**Solution**: 
1. The service worker should bypass `/__/auth/` routes
2. Try disabling the service worker temporarily to test

#### Issue: CORS or CSP Issues
**Symptoms**: Network errors in console

**Solution**: 
1. Check that your domain is in Firebase authorized domains
2. Verify no Content Security Policy is blocking the auth flow

### 7. **Advanced Debugging**

#### Check Firebase SDK Version
Make sure you're using a recent version of Firebase SDK (v9+).

#### Test with Different Browsers
Try the authentication flow in:
- Chrome
- Firefox
- Safari
- Edge

#### Test with Different Modes
- Normal browsing
- Incognito/Private mode
- With extensions disabled

### 8. **Alternative Solutions**

#### Option 1: Use Popup Instead of Redirect
If redirect continues to fail, you can temporarily switch to popup:
```typescript
// In AuthContext.tsx, change signInWithGoogle to:
const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
};
```

#### Option 2: Check for DNS Issues
1. Verify DNS propagation for `thinkback.ca`
2. Check if there are any CDN or proxy issues
3. Test with a different domain temporarily

### 9. **Verification Checklist**

After making changes, verify:

- [ ] Google Cloud Console has correct redirect URI
- [ ] Firebase Console has correct authorized domains
- [ ] Environment variables are set correctly
- [ ] Service worker bypasses auth routes
- [ ] Headers allow SAMEORIGIN for auth routes
- [ ] Authentication works in incognito mode
- [ ] No console errors during auth flow
- [ ] Network requests to `/__/auth/handler` return 200 OK

### 10. **Getting Help**

If the issue persists:

1. **Collect Debug Information**:
   - Screenshot of Google Cloud Console OAuth settings
   - Screenshot of Firebase Console authorized domains
   - Browser console logs during auth attempt
   - Network tab requests during auth flow

2. **Test on Different Environment**:
   - Try the same configuration on a different domain
   - Test with Firebase's default domain temporarily

3. **Check Firebase Status**:
   - Visit [Firebase Status Page](https://status.firebase.google.com/)
   - Check for any ongoing issues

## Expected Behavior

When working correctly, the flow should be:

1. User clicks "Sign in with Google"
2. Browser redirects to Google OAuth page
3. User authenticates with Google
4. Google redirects to `https://thinkback.ca/__/auth/handler`
5. Firebase processes the authentication
6. User is redirected to `/dashboard`
7. Console shows: `✅ Redirect result received: user@example.com`

## Rollback Plan

If you need to rollback changes:
1. Remove the debug button from AuthPage.tsx
2. Revert any changes to AuthContext.tsx
3. Switch back to popup authentication if needed
4. Remove the enhanced debugging logs 