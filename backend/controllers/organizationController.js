const asyncHandler = require('express-async-handler');
const Organization = require('../models/organizationModel');
const Department = require('../models/departmentModel');

// @desc    Create a new organization
// @route   POST /api/organizations
// @access  Private/Admin
const createOrganization = asyncHandler(async (req, res) => {
  const { name, description, logo, settings } = req.body;

  // Check if organization already exists
  const organizationExists = await Organization.findOne({ name });

  if (organizationExists) {
    res.status(400);
    throw new Error('Organization already exists');
  }

  // Create organization
  const organization = await Organization.create({
    name,
    description,
    logo,
    settings: settings || {},
  });

  res.status(201).json(organization);
});

// @desc    Get all organizations
// @route   GET /api/organizations
// @access  Private
const getOrganizations = asyncHandler(async (req, res) => {
  let query = {};
  
  // Filter by user's organization unless admin
  if (req.user.role !== 'admin') {
    query = { _id: req.user.organization };
  }
  
  const organizations = await Organization.find(query);
  
  res.json(organizations);
});

// @desc    Get organization by ID
// @route   GET /api/organizations/:id
// @access  Private
const getOrganization = asyncHandler(async (req, res) => {
  const organization = await Organization.findById(req.params.id);

  if (!organization) {
    res.status(404);
    throw new Error('Organization not found');
  }

  // Check if user belongs to this organization or is admin
  if (
    req.user.role !== 'admin' &&
    req.user.organization.toString() !== organization._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to access this organization');
  }

  res.json(organization);
});

// @desc    Update organization
// @route   PUT /api/organizations/:id
// @access  Private/Admin
const updateOrganization = asyncHandler(async (req, res) => {
  const { name, description, logo, settings } = req.body;

  const organization = await Organization.findById(req.params.id);

  if (!organization) {
    res.status(404);
    throw new Error('Organization not found');
  }

  organization.name = name || organization.name;
  organization.description = description || organization.description;
  organization.logo = logo || organization.logo;
  
  if (settings) {
    organization.settings = {
      ...organization.settings,
      ...settings,
    };
  }

  const updatedOrganization = await organization.save();

  res.json(updatedOrganization);
});

// @desc    Delete organization
// @route   DELETE /api/organizations/:id
// @access  Private/Admin
const deleteOrganization = asyncHandler(async (req, res) => {
  const organization = await Organization.findById(req.params.id);

  if (!organization) {
    res.status(404);
    throw new Error('Organization not found');
  }

  await organization.deleteOne();

  res.json({ message: 'Organization removed' });
});

// @desc    Create a new department
// @route   POST /api/organizations/:organizationId/departments
// @access  Private/Admin
const createDepartment = asyncHandler(async (req, res) => {
  const { name, description, settings } = req.body;
  const { organizationId } = req.params;

  // Check if organization exists
  const organization = await Organization.findById(organizationId);

  if (!organization) {
    res.status(404);
    throw new Error('Organization not found');
  }

  // Check if department with same name exists in this organization
  const departmentExists = await Department.findOne({
    name,
    organization: organizationId,
  });

  if (departmentExists) {
    res.status(400);
    throw new Error('Department already exists in this organization');
  }

  // Create department
  const department = await Department.create({
    name,
    description,
    organization: organizationId,
    settings: settings || {},
  });

  res.status(201).json(department);
});

// @desc    Get all departments in an organization
// @route   GET /api/organizations/:organizationId/departments
// @access  Private
const getDepartments = asyncHandler(async (req, res) => {
  const { organizationId } = req.params;

  // Check if organization exists
  const organization = await Organization.findById(organizationId);

  if (!organization) {
    res.status(404);
    throw new Error('Organization not found');
  }

  // Check if user belongs to this organization or is admin
  if (
    req.user.role !== 'admin' &&
    req.user.organization.toString() !== organizationId
  ) {
    res.status(403);
    throw new Error('Not authorized to access departments from this organization');
  }

  let query = { organization: organizationId };
  
  // If not admin or supervisor, only show user's department
  if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
    query._id = req.user.department;
  }
  
  const departments = await Department.find(query);
  
  res.json(departments);
});

// @desc    Get department by ID
// @route   GET /api/organizations/:organizationId/departments/:id
// @access  Private
const getDepartment = asyncHandler(async (req, res) => {
  const { organizationId, id } = req.params;

  const department = await Department.findOne({
    _id: id,
    organization: organizationId,
  });

  if (!department) {
    res.status(404);
    throw new Error('Department not found');
  }

  // Check if user belongs to this department, is a supervisor in this organization, or is admin
  if (
    req.user.role !== 'admin' &&
    req.user.role !== 'supervisor' &&
    req.user.department.toString() !== department._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to access this department');
  }

  res.json(department);
});

// @desc    Update department
// @route   PUT /api/organizations/:organizationId/departments/:id
// @access  Private/Admin
const updateDepartment = asyncHandler(async (req, res) => {
  const { name, description, settings } = req.body;
  const { organizationId, id } = req.params;

  const department = await Department.findOne({
    _id: id,
    organization: organizationId,
  });

  if (!department) {
    res.status(404);
    throw new Error('Department not found');
  }

  department.name = name || department.name;
  department.description = description || department.description;
  
  if (settings) {
    department.settings = {
      ...department.settings,
      ...settings,
    };
  }

  const updatedDepartment = await department.save();

  res.json(updatedDepartment);
});

// @desc    Delete department
// @route   DELETE /api/organizations/:organizationId/departments/:id
// @access  Private/Admin
const deleteDepartment = asyncHandler(async (req, res) => {
  const { organizationId, id } = req.params;

  const department = await Department.findOne({
    _id: id,
    organization: organizationId,
  });

  if (!department) {
    res.status(404);
    throw new Error('Department not found');
  }

  await department.deleteOne();

  res.json({ message: 'Department removed' });
});

// @desc    Get all organizations for public registration
// @route   GET /api/organizations/public
// @access  Public
const getOrganizationsPublic = asyncHandler(async (req, res) => {
  // Return all organizations for registration purposes
  const organizations = await Organization.find({});
  
  res.json(organizations);
});

// @desc    Get all departments in an organization for public registration
// @route   GET /api/organizations/:organizationId/departments/public
// @access  Public
const getDepartmentsPublic = asyncHandler(async (req, res) => {
  const { organizationId } = req.params;

  // Check if organization exists
  const organization = await Organization.findById(organizationId);

  if (!organization) {
    res.status(404);
    throw new Error('Organization not found');
  }

  // Return all departments for registration purposes
  const departments = await Department.find({ organization: organizationId });
  
  res.json(departments);
});

module.exports = {
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
  getDepartmentsPublic,
};