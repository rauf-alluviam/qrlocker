const express = require('express');
const multer = require('multer');
const multerS3 = require('multer-s3-v3');
const { s3Client } = require('../utils/s3');
const path = require('path');
const crypto = require('crypto');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Generate unique filename
const generateUniqueFileName = (originalname) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalname);
  return `${timestamp}-${randomString}${extension}`;
};

// Configure S3 storage for media files
const mediaStorage = multerS3({
  s3: s3Client,
  bucket: process.env.AWS_BUCKET_NAME,
  acl: 'private', // Keep private for security
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: function (req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  },
  key: function (req, file, cb) {
    try {
      // Use the original filename instead of generating a new one
      const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      
      // Allow public media upload without authentication
      // Upload directly to media/ folder
      const filePath = `media/${safeName}`;
      console.log(`Generated S3 key for media: ${filePath}`);
      cb(null, filePath);
    
    } catch (error) {
      console.error('Error generating S3 key for media:', error);
      cb(error);
    }
  }
});

// Create multer instance with storage configuration
const upload = multer({
  storage: mediaStorage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  },
  fileFilter: function (req, file, cb) {
    // Accept images, videos, and documents
    const allowedTypes = [
      // Images
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
      // Videos
      '.mp4', '.mov', '.avi', '.webm', '.wmv', '.flv',
      // Documents
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', 
      '.ppt', '.pptx', '.txt', '.csv', '.rtf'
    ];
    
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, videos, and documents are allowed.'), false);
    }
  }
});

// @route   POST api/media/upload
// @desc    Upload media files
// @access  Private
router.post('/upload', protect, upload.array('media', 5), (req, res) => {
  try {
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Return file information including S3 location
    const uploadedFiles = files.map(file => ({
      originalName: file.originalname,
      filename: file.key,
      location: file.location,
      bucket: file.bucket,
      key: file.key,
      size: file.size,
      mimeType: file.mimetype
    }));

    res.json({ 
      message: 'Files uploaded successfully',
      files: uploadedFiles,
      urls: files.map(file => file.location) // For backward compatibility
    });
  } catch (err) {
    console.error('Error uploading files:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Error handler for multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 100MB.' });
    }
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
});

module.exports = router;
