# S3 Static Hosting Setup for React App

## Problem
S3 static hosting doesn't handle React routing properly. When users access URLs like `/scan/uuid`, S3 looks for a file at that path instead of serving the React app.

## Solution
Configure S3 to redirect all requests to `index.html` so React Router can handle the routing.

## Step 1: S3 Bucket Configuration

### Via AWS Console:
1. Go to your S3 bucket: `snapcheckdata`
2. Go to **Properties** tab
3. Scroll down to **Static website hosting**
4. Click **Edit**
5. Configure:
   - **Static website hosting**: Enable
   - **Index document**: `index.html`
   - **Error document**: `index.html` ← This is the key!

### Via AWS CLI:
```bash
aws s3 website s3://snapcheckdata --index-document index.html --error-document index.html
```

## Step 2: Update Your Frontend URL

Keep your current FRONTEND_URL pointing to S3 static hosting:
```bash
FRONTEND_URL=http://snapcheckdata.s3-website.ap-south-1.amazonaws.com
```

## Step 3: Deploy Your React Build

1. Build your React app:
```bash
cd frontend
npm run build
```

2. Upload to S3:
```bash
aws s3 sync build/ s3://snapcheckdata --delete
```

## Step 4: Update QR Codes

Run the update script to fix existing QR codes:
```bash
cd backend
node update-qr-urls.js
```

## How it Works

1. User scans QR → Opens: `http://snapcheckdata.s3-website.ap-south-1.amazonaws.com/scan/uuid?sig=xxx`
2. S3 doesn't find `/scan/uuid` file
3. S3 serves `index.html` instead (error document)
4. React app loads and React Router handles the `/scan/uuid` route
5. React app makes API call to your backend at `http://192.168.1.63:9002`

## Important Notes

- Your backend still runs on `http://192.168.1.63:9002`
- Frontend is served from S3 static hosting
- API calls go from S3-hosted frontend to your backend server
- QR codes will work perfectly!

## Verification

After setup, test:
1. `http://snapcheckdata.s3-website.ap-south-1.amazonaws.com/` → Should load your app
2. `http://snapcheckdata.s3-website.ap-south-1.amazonaws.com/scan/test-uuid` → Should load your app and show QR scan page
3. QR codes should work without "NoSuchKey" errors
