const express = require('express');
const router = express.Router();
const {
  getQRScanStats,
  getDocumentViewStats,
  getTopQRBundles,
  getTopDocuments,
  getScansByTimeOfDay,
  getScansByLocation,
  getUserActivity,
  getBundleAnalytics,
  getSystemMetrics
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Basic analytics - accessible to all authenticated users
router.get('/scans', protect, getQRScanStats);
router.get('/views', protect, getDocumentViewStats);
router.get('/top-qr', protect, getTopQRBundles);
router.get('/top-documents', protect, getTopDocuments);

// Bundle-specific analytics
router.get('/bundle/:bundleId', protect, getBundleAnalytics);

// Advanced analytics - accessible to all authenticated users
router.get('/time-of-day', protect, getScansByTimeOfDay);
router.get('/location', protect, getScansByLocation);

// System metrics - admin only
router.get('/system', protect, authorize('admin'), getSystemMetrics);

// User specific analytics - accessible to all authenticated users
router.get('/user/:userId', protect, getUserActivity);

module.exports = router;