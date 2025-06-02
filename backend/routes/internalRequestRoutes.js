const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});
const {
  createInternalRequest,
  getAllInternalRequests,
  getInternalRequestById,
  respondToInternalRequest,
  updateInternalRequest,
  cancelInternalRequest,
  deleteAllRequests,
  getInternalRequestStats,
} = require('../controllers/internalRequestController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Stats route (place before :id routes)
router.get('/stats', getInternalRequestStats);

// Special route for deleting all requests
router.delete('/delete-all', deleteAllRequests);

// CRUD routes
router.route('/')
  .get(getAllInternalRequests)
  .post(createInternalRequest);

router.route('/:id')
  .get(getInternalRequestById)
  .put(updateInternalRequest)
  .delete(cancelInternalRequest);

// Response route
router.post('/:id/respond', upload.array('documents'), respondToInternalRequest);

module.exports = router;
