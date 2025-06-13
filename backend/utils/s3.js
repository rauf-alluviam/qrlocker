const { S3Client, GetObjectCommand, DeleteObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const multerS3 = require('multer-s3-v3');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

// Create S3 client with the new SDK v3
const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  region: process.env.AWS_REGION
});

// S3 storage engine for Multer with direct v3 SDK integration
const s3Storage = multerS3({
  s3: s3Client,
  bucket: process.env.AWS_S3_BUCKET_NAME || process.env.AWS_BUCKET_NAME,
  acl: 'public-read',
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    try {
      // Use the original filename instead of generating a new one
      const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      
      // Check if user exists (authentication still required)
      if (!req.user && req.path !== '/api/media/upload') {
        return cb(new Error('User authentication required for file upload'));
      }
      
      // Upload directly to uploads/ folder, bypassing organization/department structure
      const filePath = `uploads/${safeName}`;
      console.log(`Generated S3 key: ${filePath}`);
      cb(null, filePath);
    
    } catch (error) {
      console.error('Error generating S3 key:', error);
      cb(error);
    }
  },
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
});

// Generate unique filename
const generateUniqueFileName = (originalname) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalname);
  return `${timestamp}-${randomString}${extension}`;
};

// Setup multer for file uploads
const upload = multer({
  storage: s3Storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10, // Maximum 10 files at once
  },
  fileFilter: (req, file, cb) => {
    // Allow document file types
    const allowedFileTypes = [
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', 
      '.ppt', '.pptx', '.txt', '.csv', '.rtf',
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
      '.zip', '.rar', '.7z',
      '.mp4', '.avi', '.mov', '.wmv', '.flv',
      '.mp3', '.wav', '.aac', '.flac'
    ];
    
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedFileTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} is not allowed. Allowed types: ${allowedFileTypes.join(', ')}`));
    }
  },
});

// Function to delete a file from S3
const deleteFile = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME || process.env.AWS_BUCKET_NAME,
      Key: key,
    });
    
    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw error;
  }
};

// Function to manually upload a file to S3 (useful for direct uploads)
const uploadFile = async (buffer, key, contentType) => {
  try {
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: process.env.AWS_S3_BUCKET_NAME || process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: 'private'
      }
    });

    const result = await upload.done();
    return result;
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw error;
  }
};

// Function to get direct S3 URL (no expiration)
const getDirectS3Url = (key) => {
  try {
    const bucketName = process.env.AWS_S3_BUCKET_NAME || process.env.AWS_BUCKET_NAME;
    const region = process.env.AWS_REGION;
    
    // Construct direct S3 URL
    const directUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
    return directUrl;
  } catch (error) {
    console.error('Error generating direct S3 URL:', error);
    throw error;
  }
};

module.exports = {
  s3Client,
  upload,
  getDirectS3Url,
  deleteFile,
  generateUniqueFileName,
  uploadFile
};