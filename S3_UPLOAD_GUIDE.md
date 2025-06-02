# Document Upload System - S3 Integration

## Overview
The QRLocker application uses AWS S3 for document storage with the following flow:

1. **Client uploads files** → Frontend sends files to `/api/documents/upload`
2. **Multer + S3 middleware** → Files are uploaded directly to S3 bucket
3. **Database storage** → S3 URLs and metadata are saved to MongoDB
4. **File access** → Documents are accessed via signed URLs for security

## System Architecture

### 1. S3 Upload Configuration (`/backend/utils/s3.js`)
```javascript
// S3 storage with automatic file organization
const s3Storage = multerS3({
  s3: s3,
  bucket: process.env.AWS_BUCKET_NAME,
  acl: 'private',
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    // Files are organized by: documents/{org}/{dept}/{unique-filename}
    const fileName = generateUniqueFileName(file.originalname);
    const filePath = `documents/${req.user.organization}/${req.user.department}/${fileName}`;
    cb(null, filePath);
  }
});
```

### 2. Upload Route (`/backend/routes/documentRoutes.js`)
```javascript
router.post(
  '/upload', 
  protect,                           // Authentication middleware
  upload.array('documents', 10),     // S3 upload middleware (max 10 files)
  uploadDocuments                    // Controller function
);
```

### 3. Upload Controller (`/backend/controllers/documentController.js`)
```javascript
const uploadDocuments = asyncHandler(async (req, res) => {
  // Files are already uploaded to S3 by middleware
  // Controller saves metadata to database
  for (const file of req.files) {
    const document = await Document.create({
      originalName: file.originalname,
      fileName: path.basename(file.key),
      fileType: file.mimetype,
      fileSize: file.size,
      s3Key: file.key,              // S3 object key
      s3Url: file.location,         // S3 URL
      uploadedBy: req.user._id,
      organization: req.user.organization,
      department: req.user.department,
    });
  }
});
```

## File Access Methods

### 1. Download via Signed URL
```javascript
// GET /api/documents/:id/download
const downloadDocument = async (req, res) => {
  const document = await Document.findById(req.params.id);
  const downloadUrl = await getSignedUrl(document.s3Key, 3600); // 1 hour expiry
  res.json({ downloadUrl });
};
```

### 2. View via Signed URL
```javascript
// GET /api/documents/:id/url
const getDocumentSignedUrl = async (req, res) => {
  const document = await Document.findById(req.params.id);
  const url = await getSignedUrl(document.s3Key);
  res.json({ url });
};
```

## Security Features

1. **Private S3 bucket** - Files are not publicly accessible
2. **Signed URLs** - Temporary access with expiration
3. **Authentication required** - All endpoints protected
4. **Department-based access control** - Users can only access their department's files
5. **File type validation** - Only allowed file types can be uploaded

## Supported File Types

- **Documents**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, RTF
- **Images**: JPG, JPEG, PNG, GIF, WEBP, SVG
- **Archives**: ZIP, RAR, 7Z
- **Media**: MP4, AVI, MOV, WMV, FLV, MP3, WAV, AAC, FLAC

## File Size Limits

- **Maximum file size**: 50MB per file
- **Maximum files per upload**: 10 files
- **Total upload limit**: Determined by request timeout

## Environment Variables Required

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your_bucket_name
```

## File Organization in S3

```
your-bucket/
├── documents/
│   ├── {organizationId}/
│   │   ├── {departmentId}/
│   │   │   ├── {timestamp}-{random}.pdf
│   │   │   ├── {timestamp}-{random}.docx
│   │   │   └── ...
│   │   └── ...
│   └── ...
├── qrcodes/
│   ├── {uuid}.png
│   └── ...
└── optimized/
    ├── optimized-{filename}
    └── ...
```

## Frontend Integration

### Upload Example
```javascript
const formData = new FormData();
formData.append('documents', file1);
formData.append('documents', file2);
formData.append('description', 'Optional description');
formData.append('tags', 'tag1,tag2,tag3');

const response = await api.post('/documents/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

### Download Example
```javascript
const response = await api.get(`/documents/${documentId}/download`);
window.open(response.data.downloadUrl, '_blank');
```

## Testing

Run the S3 connection test:
```bash
cd backend
node test-upload.js
```

This will verify:
- AWS credentials are configured
- S3 connection is working
- Target bucket exists and is accessible
