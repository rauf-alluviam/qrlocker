const express = require('express');
const router = express.Router();
const { 
  createQRBundle,
  getAllQRBundles,
  getQRBundleById,
  updateQRBundle,
  deleteQRBundle,
  getQRBundleByUuid,
  verifyPasscode,
  regeneratePasscode,
  sendPasscodeByEmail,
  approveQRBundle,
  rejectQRBundle,
  getMyQRBundles,
  getQRBundleScanLogs,
  getQRBundleMetrics,
  generateAnalyticsReport
} = require('../controllers/qrController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes
router.get('/view/:uuid', getQRBundleByUuid);
router.post('/verify-passcode/:uuid', verifyPasscode);

// Protected routes
router.post('/', protect, createQRBundle);
router.get('/me', protect, getMyQRBundles);
router.post('/:id/regenerate-passcode', protect, regeneratePasscode);
router.post('/:id/send-passcode', protect, sendPasscodeByEmail);

router.route('/:id')
  .get(protect, getQRBundleById)
  .put(protect, updateQRBundle)
  .delete(protect, deleteQRBundle);

// Routes accessible to all authenticated users
router.get('/', protect, getAllQRBundles);
router.post('/:id/approve', protect, approveQRBundle);
router.post('/:id/reject', protect, rejectQRBundle);

// Analytics and tracking routes
router.get('/:id/scan-logs', protect, getQRBundleScanLogs);
router.get('/:id/metrics', protect, getQRBundleMetrics);
router.get('/:id/analytics-report', protect, generateAnalyticsReport);

module.exports = router;