# Deployment Guide for Thinkback.ai Backend

## Overview
This guide explains how to deploy the Python FastAPI backend to Firebase App Hosting (Cloud Run) using the `apphosting.yaml` configuration.

## Prerequisites
1. Firebase CLI installed: `npm install -g firebase-tools`
2. Google Cloud CLI installed
3. Firebase project created
4. Required environment variables and credentials

## Configuration Files

### apphosting.yaml
This file tells Firebase App Hosting to run your Python FastAPI application instead of looking for a Node.js entry point. Key configuration:

- `runtime: python311` - Specifies Python 3.11 runtime
- `entrypoint: uvicorn backend.main:app --host 0.0.0.0 --port $PORT` - Runs the FastAPI app
- `source.dir: "backend"` - Points to the backend directory

### Dockerfile
Optimized for Python FastAPI applications:
- Uses Python 3.11 slim image
- Installs dependencies from requirements.txt
- Runs uvicorn to serve the FastAPI app
- Listens on port 8080 (or $PORT environment variable)

## Environment Variables Required

### 1. OpenAI API Key
You need to set the `OPENAI_API_KEY` environment variable in your Firebase project:

```bash
# Set the environment variable in Firebase
firebase functions:config:set openai.api_key="your-openai-api-key"
```

### 2. Firebase Service Account
You need to provide the Firebase service account credentials. The backend expects the file at:
`infrastructure/credentials/service-account.json`

To get this file:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Place it in `infrastructure/credentials/service-account.json`

## Deployment Steps

### Quick Deploy (Recommended)
```bash
# Run the deployment script
./deploy.sh
```

### Manual Deployment

#### 1. Build the Frontend
```bash
cd frontend
npm run build
cd ..
```

#### 2. Deploy to Firebase App Hosting
```bash
# Deploy hosting (frontend)
firebase deploy --only hosting

# Deploy backend (uses apphosting.yaml)
firebase deploy --only functions
```

## Alternative: Direct Cloud Run Deployment

If you prefer to deploy directly to Cloud Run:

### 1. Build and Push Docker Image
```bash
# Build the image
docker build -t gcr.io/YOUR_PROJECT_ID/thinkback-backend .

# Push to Google Container Registry
docker push gcr.io/YOUR_PROJECT_ID/thinkback-backend
```

### 2. Deploy to Cloud Run
```bash
gcloud run deploy thinkback-backend \
  --image gcr.io/YOUR_PROJECT_ID/thinkback-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars OPENAI_API_KEY=your-openai-api-key
```

## Environment Variables in Cloud Run

Make sure to set these environment variables in your Cloud Run service:

- `OPENAI_API_KEY`: Your OpenAI API key
- `PORT`: Should be 8080 (already set in Dockerfile)

## Troubleshooting

### Error: Cannot find module '/workspace/index.js'
This error occurs when Firebase tries to run a Node.js application instead of Python. The `apphosting.yaml` file fixes this by:
1. Specifying `runtime: python311`
2. Setting the correct entrypoint for uvicorn
3. Pointing to the backend directory

### Firebase Service Account Not Found
Make sure the service account file exists at `infrastructure/credentials/service-account.json`

### OpenAI API Key Not Set
Ensure the `OPENAI_API_KEY` environment variable is set in your Cloud Run service configuration.

## File Structure After Deployment

```
/workspace/
├── backend/
│   ├── main.py              # FastAPI application entry point
│   └── [other backend files]
├── requirements.txt          # Python dependencies
├── infrastructure/
│   └── credentials/
│       └── service-account.json  # Firebase credentials
└── apphosting.yaml          # Firebase App Hosting configuration
```

The application will listen on port 8080 (or the PORT environment variable) and handle requests through the FastAPI framework using uvicorn.
