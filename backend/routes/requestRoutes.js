const express = require('express');
const router = express.Router();
const {
  createDocumentRequest,
  getAllRequests,
  getRequestById,
  updateRequestStatus,
  assignRequest,
  respondToRequest,
  getMyRequests
} = require('../controllers/requestController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public route to create a request
router.post('/', createDocumentRequest);

// Protected routes
router.get('/me', protect, getMyRequests);

// Routes accessible to all authenticated users
router.get('/', protect, getAllRequests);
router.get('/:id', protect, getRequestById);
router.put('/:id/status', protect, updateRequestStatus);
router.put('/:id/assign', protect, assignRequest);
router.post('/:id/respond', protect, respondToRequest);

module.exports = router;