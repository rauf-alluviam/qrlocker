const asyncHandler = require('express-async-handler');
const DocumentRequest = require('../models/documentRequestModel');
const QRBundle = require('../models/qrBundleModel');
const { sendDocumentRequestNotification, sendRequestResponseEmail } = require('../utils/emailSender');
const User = require('../models/userModel');

// @desc    Create a document request from external user
// @route   POST /api/requests
// @access  Public
const createDocumentRequest = asyncHandler(async (req, res) => {
  const {
    requesterName,
    requesterEmail,
    organization,
    department,
    requestTitle,
    requestDescription,
  } = req.body;

  // Validate required fields
  if (!requesterName || !requesterEmail || !organization || !department || !requestTitle || !requestDescription) {
    res.status(400);
    throw new Error('Please fill all required fields');
  }

  // Create request
  const request = await DocumentRequest.create({
    requesterName,
    requesterEmail,
    organization,
    department,
    requestTitle,
    requestDescription,
    status: 'pending',
  });

  // Notify admin(s)
  try {
    // Find admin users for this organization
    const admins = await User.find({
      organization,
      role: 'admin',
    }).select('email');

    // Send notification to each admin
    for (const admin of admins) {
      await sendDocumentRequestNotification(admin.email, request);
    }
  } catch (error) {
    console.error('Error sending admin notification:', error);
    // Continue despite email error
  }

  res.status(201).json({
    success: true,
    message: 'Document request submitted successfully',
    requestId: request._id,
  });
});

// @desc    Get all document requests
// @route   GET /api/requests
// @access  Private/Admin/Supervisor
const getAllRequests = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.page) || 1;

  // Build query filters
  const queryFilters = {};
  
  if (req.user.role !== 'admin') {
    // Non-admin users can see requests from their organization
    queryFilters.organization = req.user.organization;
  }
  
  if (req.query.status) {
    queryFilters.status = req.query.status;
  }
  
  if (req.query.search) {
    queryFilters.$or = [
      { requesterName: { $regex: req.query.search, $options: 'i' } },
      { requesterEmail: { $regex: req.query.search, $options: 'i' } },
      { requestTitle: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const count = await DocumentRequest.countDocuments(queryFilters);
  
  const requests = await DocumentRequest.find(queryFilters)
    .populate('organization', 'name')
    .populate('department', 'name')
    .populate('assignedTo', 'name email')
    .populate('sharedQrBundle', 'title')
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    requests,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

// @desc    Get document request by ID
// @route   GET /api/requests/:id
// @access  Private/Admin/Supervisor
const getRequestById = asyncHandler(async (req, res) => {
  const request = await DocumentRequest.findById(req.params.id)
    .populate('organization', 'name')
    .populate('department', 'name')
    .populate('assignedTo', 'name email')
    .populate({
      path: 'sharedQrBundle',
      select: 'title description qrCodeUrl documents',
      populate: {
        path: 'documents',
        select: 'originalName fileType',
      },
    });

  if (!request) {
    res.status(404);
    throw new Error('Document request not found');
  }

  // Check if user has access to this request
  if (
    req.user.role !== 'admin' &&
    request.organization.toString() !== req.user.organization.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to access this request');
  }

  res.json(request);
});

// @desc    Get requests assigned to me
// @route   GET /api/requests/me
// @access  Private
const getMyRequests = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.page) || 1;

  const count = await DocumentRequest.countDocuments({
    assignedTo: req.user._id,
  });

  const requests = await DocumentRequest.find({ assignedTo: req.user._id })
    .populate('organization', 'name')
    .populate('department', 'name')
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    requests,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

// @desc    Update request status
// @route   PUT /api/requests/:id/status
// @access  Private/Admin/Supervisor
const updateRequestStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  if (!['pending', 'approved', 'rejected', 'fulfilled'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  const request = await DocumentRequest.findById(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error('Document request not found');
  }

  // Check if user has access to this request
  if (
    req.user.role !== 'admin' &&
    request.organization.toString() !== req.user.organization.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to update this request');
  }

  request.status = status;
  await request.save();

  res.json({
    message: `Request status updated to ${status}`,
    request,
  });
});

// @desc    Assign request to user
// @route   PUT /api/requests/:id/assign
// @access  Private/Admin/Supervisor
const assignRequest = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  const request = await DocumentRequest.findById(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error('Document request not found');
  }

  // Check if user has access to this request
  if (
    req.user.role !== 'admin' &&
    request.organization.toString() !== req.user.organization.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to update this request');
  }

  // Assign to self if no userId provided
  const assignedUserId = userId || req.user._id;

  // Verify assignee exists and is in the same organization
  const assignee = await User.findById(assignedUserId);
  if (!assignee) {
    res.status(404);
    throw new Error('Assignee not found');
  }
  
  if (assignee.organization.toString() !== request.organization.toString()) {
    res.status(400);
    throw new Error('Cannot assign to a user from a different organization');
  }

  request.assignedTo = assignedUserId;
  await request.save();

  const updatedRequest = await DocumentRequest.findById(req.params.id)
    .populate('assignedTo', 'name email');

  res.json({
    message: `Request assigned to ${updatedRequest.assignedTo.name}`,
    request: updatedRequest,
  });
});

// @desc    Respond to document request
// @route   POST /api/requests/:id/respond
// @access  Private/Admin/Supervisor
const respondToRequest = asyncHandler(async (req, res) => {
  const { responseMessage, status, qrBundleId } = req.body;

console.log('Responding to request:', req.params.id, responseMessage, status, qrBundleId);
console.log(req.body);
  if (!status || !['approved', 'rejected', 'fulfilled'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  const request = await DocumentRequest.findById(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error('Document request not found');
  }

  // Check if user has access to this request
  if (
    req.user.role !== 'admin' &&
    request.organization.toString() !== req.user.organization.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to respond to this request');
  }

  // Update request
  request.status = status;
  request.responseMessage = responseMessage;
  
  // If approved or fulfilled and QR bundle is provided, link it
  if ((status === 'approved' || status === 'fulfilled') && qrBundleId) {
    const qrBundle = await QRBundle.findById(qrBundleId);
    
    if (!qrBundle) {
      res.status(404);
      throw new Error('QR bundle not found');
    }
    
    request.sharedQrBundle = qrBundleId;
  }
  
  await request.save();

  // Send email notification to requester
  try {
    const isApproved = status === 'approved' || status === 'fulfilled';
    const qrBundle = request.sharedQrBundle 
      ? await QRBundle.findById(request.sharedQrBundle).populate('documents')
      : null;
    
    await sendRequestResponseEmail(
      request,
      isApproved,
      qrBundle?.qrCodeUrl
    );
  } catch (error) {
    console.error('Error sending response email:', error);
    // Continue despite email error
  }

  const updatedRequest = await DocumentRequest.findById(req.params.id)
    .populate('sharedQrBundle', 'title qrCodeUrl');

  res.json({
    message: `Response sent to requester`,
    request: updatedRequest,
  });
});

module.exports = {
  createDocumentRequest,
  getAllRequests,
  getRequestById,
  updateRequestStatus,
  assignRequest,
  respondToRequest,
  getMyRequests,
};