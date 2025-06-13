# Direct S3 URLs Implementation Guide

## Overview
The QRLocker system has been updated to use direct S3 URLs instead of pre-signed URLs for document access. This eliminates expiration issues and provides more reliable document access through QR codes.

## Changes Made

### Backend Changes

#### 1. S3 Configuration (`/backend/utils/s3.js`)
- **Storage ACL**: Changed from `'private'` to `'public-read'` for new uploads
- **New Function**: Added `getDirectS3Url(key)` for generating direct S3 URLs
- **CloudFront Support**: Optional CloudFront domain support via `CLOUDFRONT_DOMAIN` environment variable

```javascript
// New function for direct S3 URLs
const getDirectS3Url = (key) => {
  if (process.env.CLOUDFRONT_DOMAIN) {
    return `https://${process.env.CLOUDFRONT_DOMAIN}/${key}`;
  }
  return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
};
```

#### 2. Document Controller (`/backend/controllers/documentController.js`)
- **getDocumentSignedUrl()**: Now returns direct S3 URLs
- **downloadDocument()**: Updated to use direct S3 URLs without expiration

### Frontend Changes

#### 1. Document Preview Modal (`/frontend/src/components/Documents/DocumentPreviewModal.js`)
- Updated variable names from `signedUrl` to `documentUrl` for clarity
- Backend API calls remain the same but now receive direct URLs

#### 2. Document View (`/frontend/src/pages/Documents/DocumentView.js`)
- Added state management for document URLs
- Updated image preview to fetch direct URLs when needed

## Environment Variables

### Required Variables
```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your_bucket_name

# Optional: CloudFront Distribution
CLOUDFRONT_DOMAIN=your_cloudfront_domain.cloudfront.net
```

### New Optional Variable
- `CLOUDFRONT_DOMAIN`: If set, all document URLs will use this CloudFront domain instead of direct S3 URLs

## S3 Bucket Configuration

### Bucket Policy for Public Read Access
Your S3 bucket needs a policy that allows public read access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

### CORS Configuration
Ensure your S3 bucket has proper CORS configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

## Migration Process

### 1. Update Existing Documents
Run the migration script to update existing private documents to public:

```bash
cd backend
node migrate-documents-to-public.js
```

This script will:
- Connect to your database
- Find all existing documents
- Update their S3 ACL from private to public-read
- Process documents in batches to avoid API limits

### 2. CloudFront Setup (Optional but Recommended)

#### Benefits of CloudFront:
- Global edge locations for faster access
- Better caching
- Reduced S3 costs
- HTTPS by default

#### Setup Steps:
1. Create a CloudFront distribution
2. Set origin to your S3 bucket
3. Add the domain to your environment variables
4. Update your DNS if using a custom domain

## API Endpoints

### Document URL Endpoints
- `GET /api/documents/:id/url` - Returns direct S3 URL
- `GET /api/documents/:id/download` - Returns direct S3 URL for download

### Response Format
```json
{
  "url": "https://bucket-name.s3.region.amazonaws.com/path/to/file.pdf",
  "signedUrl": "https://bucket-name.s3.region.amazonaws.com/path/to/file.pdf"
}
```

## Benefits

### 1. No Expiration Issues
- QR codes work indefinitely (as long as the document exists)
- No need to regenerate URLs

### 2. Better Performance
- Direct access to S3 or CloudFront
- No server-side processing for URL generation

### 3. Simplified Architecture
- Fewer API calls
- Reduced server load

### 4. Better User Experience
- Faster document loading
- More reliable access

## Security Considerations

### 1. Public Access
- All documents are now publicly accessible if someone has the direct URL
- Consider this when storing sensitive documents

### 2. Access Control
- The application still controls which documents are shared via QR codes
- URL access is separate from application-level permissions

### 3. URL Obfuscation
- S3 keys are UUIDs which provide some security through obscurity
- Direct URLs are not easily guessable

## Troubleshooting

### 1. Images Not Loading
- Check S3 bucket public access settings
- Verify bucket policy allows public read
- Check CORS configuration

### 2. HTTPS Issues
- Use CloudFront for HTTPS
- Or ensure your application supports mixed content

### 3. Migration Failures
- Check AWS credentials
- Verify S3 permissions
- Review CloudWatch logs for detailed errors

## Rollback Plan

If needed, you can rollback by:
1. Reverting the code changes
2. Updating S3 bucket policy to remove public access
3. Setting individual object ACLs back to private

However, this would break existing QR codes that were generated with direct URLs.

## Testing

### 1. Test Document Upload
```bash
# Upload a test document and verify it gets public-read ACL
curl -X POST /api/documents/upload -F "file=@test.pdf"
```

### 2. Test Direct URL Access
```bash
# Should return the document without authentication
curl -I "https://bucket-name.s3.region.amazonaws.com/path/to/file.pdf"
```

### 3. Test QR Code Access
- Generate a QR code for a document
- Scan it from a different device/network
- Verify document loads without issues
