# Firebase Configuration for Custom Domain

To use `thinkback.ca` as your Firebase auth domain, update your environment variables:

## Required Environment Variables

Create a `.env` file in the `frontend/` directory with:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=thinkback.ca
VITE_FIREBASE_PROJECT_ID=ninth-arena-461723
VITE_FIREBASE_STORAGE_BUCKET=ninth-arena-461723.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# API Configuration
VITE_API_URL=https://your-backend-api-url.com
```

## Firebase Console Steps

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`ninth-arena-461723`)
3. Navigate to **Authentication** → **Settings** → **Authorized domains**
4. Add `thinkback.ca` to the authorized domains list
5. Also add `www.thinkback.ca` if needed

## Verification

After making these changes:
1. The Google sign-in popup should show "Sign in to continue to thinkback.ca"
2. The authentication flow will work with your custom domain 