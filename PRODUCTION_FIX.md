# QR Code URL Fix for Production

## Problem Identified
The QR codes in production are pointing to S3 static website URLs instead of your actual application URL, causing 404 "NoSuchKey" errors.

## Root Cause
The `FRONTEND_URL` environment variable in production is set to:
```
FRONTEND_URL=http://qrlocker.s3-website.ap-south-1.amazonaws.com
```

This causes QR codes to generate URLs like:
```
http://qrlocker.s3-website.ap-south-1.amazonaws.com/scan/600e5f44-b165-467e-b64f-2a2a66809c23?sig=...
```

S3 static hosting treats this as a file path and looks for a key `scan/600e5f44-b165-467e-b64f-2a2a66809c23` in S3, which doesn't exist.

## Solution
Update your production environment variable `FRONTEND_URL` to point to your actual application URL.

### Option 1: Use Your Domain Name
If you have a custom domain:
```bash
FRONTEND_URL=https://yourdomain.com
```

### Option 2: Use Your Application Server URL
If your app runs on a server (EC2, etc.):
```bash
FRONTEND_URL=https://your-server-ip-or-domain:3000
```

### Option 3: Use Load Balancer/Reverse Proxy URL
If you have a load balancer or reverse proxy:
```bash
FRONTEND_URL=https://your-load-balancer-url
```

## Implementation Steps

### Step 1: Update Environment Variable
1. Log into your production server/platform
2. Update the environment variable:
   ```bash
   export FRONTEND_URL=https://your-actual-app-url
   ```
   or update your `.env` file or deployment configuration

### Step 2: Restart Your Application
```bash
# Restart your backend service
pm2 restart qrlocker-backend
# or
systemctl restart qrlocker
# or docker restart if using containers
```

### Step 3: Regenerate Existing QR Codes (Optional)
For existing QR bundles with wrong URLs, you can either:

1. **Wait for natural regeneration** - When users create new QR bundles, they'll have correct URLs
2. **Run a database update script** - Update existing QR bundles (see script below)

### QR Code URL Update Script (Optional)
Create a script to update existing QR codes:

```javascript
// update-qr-urls.js
const mongoose = require('mongoose');
const QRBundle = require('./models/qrBundleModel');
const { generateAndUploadQR } = require('./utils/qrCodeGenerator');

async function updateQRUrls() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const correctBaseUrl = process.env.FRONTEND_URL; // Make sure this is set correctly
    const bundles = await QRBundle.find({});
    
    console.log(`Found ${bundles.length} QR bundles to update`);
    
    for (const bundle of bundles) {
      try {
        const { qrCodeUrl, signature } = await generateAndUploadQR(
          bundle.uuid,
          correctBaseUrl
        );
        
        bundle.qrCodeUrl = qrCodeUrl;
        bundle.hmacSignature = signature;
        await bundle.save();
        
        console.log(`Updated QR bundle: ${bundle.title}`);
      } catch (error) {
        console.error(`Error updating bundle ${bundle._id}:`, error);
      }
    }
    
    console.log('QR URL update completed');
    process.exit(0);
  } catch (error) {
    console.error('Error updating QR URLs:', error);
    process.exit(1);
  }
}

updateQRUrls();
```

## Verification
After making the changes:

1. Create a new QR bundle
2. Check that the generated QR code URL points to your correct application URL
3. Test scanning the QR code to ensure it works properly

## Architecture Recommendation
For production, consider this setup:

```
[User] → [Load Balancer/CDN] → [Frontend App] ← API calls → [Backend API]
                ↓
        [S3 for file storage only]
```

- **Frontend**: Served from your application server, not S3 static hosting
- **S3**: Used only for file storage (documents, QR code images)
- **FRONTEND_URL**: Points to your load balancer or app server URL

This ensures proper React routing and API communication.
