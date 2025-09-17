# Deployment

This folder contains all deployment-related files for the thinkback-ai application.

## Files

- `deploy.sh` - Main deployment script for Google Cloud Run
- `Dockerfile` - Docker configuration for containerizing the application
- `.dockerignore` - Files to exclude from Docker build context
- `apphosting.production.yaml` - Production app hosting configuration
- `apphosting.staging.yaml` - Staging app hosting configuration

## Usage

To deploy the application:

```bash
cd deployment
./deploy.sh
```

Make sure you have:
- Docker installed and running
- Google Cloud CLI installed and authenticated
- Proper permissions for the target project
