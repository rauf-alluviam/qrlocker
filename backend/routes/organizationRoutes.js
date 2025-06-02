const express = require('express');
const router = express.Router();
const {
  createOrganization,
  getOrganizations,
  getOrganization,
  updateOrganization,
  deleteOrganization,
  createDepartment,
  getDepartments,
  getDepartment,
  updateDepartment,
  deleteDepartment,
  getOrganizationsPublic,
  getDepartmentsPublic
} = require('../controllers/organizationController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Organization routes
router.route('/')
  .post(protect, authorize('admin'), createOrganization)
  .get(protect, getOrganizations);

// Public route for registration - get organizations without auth
router.route('/public')
  .get(getOrganizationsPublic);

router.route('/:id')
  .get(protect, getOrganization)
  .put(protect, authorize('admin'), updateOrganization)
  .delete(protect, authorize('admin'), deleteOrganization);

// Department routes - accessible to all authenticated users for viewing
router.route('/:organizationId/departments')
  .post(protect, authorize('admin'), createDepartment)
  .get(protect, getDepartments);

// Public route for registration - get departments without auth
router.route('/:organizationId/departments/public')
  .get(getDepartmentsPublic);

router.route('/:organizationId/departments/:id')
  .get(protect, getDepartment)
  .put(protect, authorize('admin'), updateDepartment)
  .delete(protect, authorize('admin'), deleteDepartment);

module.exports = router;