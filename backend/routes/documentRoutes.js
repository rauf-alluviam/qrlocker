const express = require('express');
const router = express.Router();
const { 
  uploadDocuments,
  getAllDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  getMyDocuments,
  optimizeImage,
  getDocumentSignedUrl,
  downloadDocument,
  shareDocument
} = require('../controllers/documentController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { upload } = require('../utils/s3');

// Protected routes
router.post(
  '/upload', 
  protect, 
  upload.array('documents', 10), 
  uploadDocuments
);

router.get('/me', protect, getMyDocuments);
router.get('/:id/url', protect, getDocumentSignedUrl);
router.post('/:id/optimize', protect, optimizeImage);
router.get('/:id/download', protect, downloadDocument);
router.post('/:id/share', protect, shareDocument);

router.route('/:id')
  .get(protect, getDocumentById)
  .put(protect, updateDocument)
  .delete(protect, deleteDocument);

// Routes accessible to all authenticated users
router.get(
  '/', 
  protect, 
  getAllDocuments
);

module.exports = router;