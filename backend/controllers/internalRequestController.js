const asyncHandler = require('express-async-handler');
const path = require('path');
const InternalRequest = require('../models/internalRequestModel');
const User = require('../models/userModel');
const QRBundle = require('../models/qrBundleModel');
const { sendInternalRequestNotification, sendInternalRequestResponseEmail } = require('../utils/emailSender');
const { uploadFile } = require('../utils/s3');

// @desc    Create an internal user-to-user request
// @route   POST /api/internal-requests
// @access  Private
const createInternalRequest = asyncHandler(async (req, res) => {
  const {
    requestTitle,
    requestDescription,
    recipients,
    priority,
    dueDate,
    category,
    tags,
    isUrgent
  } = req.body;

  // Debug logging

  // Validate required fields
  if (!requestTitle || !requestDescription || !recipients || recipients.length === 0) {
    res.status(400);
    throw new Error('Please fill all required fields and select at least one recipient');
  }

  // Validate recipients are valid users
  const recipientUsers = await User.find({ 
    _id: { $in: recipients }
  }).select('_id name email');

  
  
  const selfAsRecipient = recipients.includes(req.user._id.toString());

  
  if (selfAsRecipient) {

    res.status(400);
    throw new Error('Cannot send request to yourself');
  }

  if (recipientUsers.length !== recipients.length) {
    res.status(400);
    throw new Error('One or more recipients are invalid');
  }

  // Create request
  const request = await InternalRequest.create({
    requestTitle,
    requestDescription,
    requester: req.user._id,
    recipients,
    priority: priority || 'medium',
    dueDate: dueDate ? new Date(dueDate) : null,
    category: category || 'document_sharing',
    tags: tags || [],
    isUrgent: isUrgent || false,
    responses: recipients.map(recipientId => ({
      recipient: recipientId,
      status: 'pending'
    }))
  });

  // Populate request for response
  const populatedRequest = await InternalRequest.findById(request._id)
    .populate('requester', 'name email')
    .populate('recipients', 'name email')
    .populate('responses.recipient', 'name email');

  // Send notifications to recipients (async)
  try {
    for (const recipient of recipientUsers) {
      await sendInternalRequestNotification(recipient, populatedRequest, req.user);
    }
    
    await InternalRequest.findByIdAndUpdate(request._id, { notificationsSent: true });
  } catch (error) {
    console.error('Error sending notifications:', error);
    // Continue despite email error
  }

  res.status(201).json({
    success: true,
    message: 'Internal request created successfully',
    request: populatedRequest,
  });
});

// @desc    Get all internal requests (sent and received)
// @route   GET /api/internal-requests
// @access  Private
const getAllInternalRequests = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.page) || 1;
  const { type, status, search } = req.query;

  // Build query filters
  let queryFilters = {};

  // Filter by type (sent/received)
  if (type === 'sent') {
    queryFilters.requester = req.user._id;
  } else if (type === 'received') {
    queryFilters.recipients = req.user._id;
  } else {
    // Both sent and received
    queryFilters.$or = [
      { requester: req.user._id },
      { recipients: req.user._id }
    ];
  }

  // Filter by status
  if (status && status !== 'all') {
    queryFilters.status = status;
  }

  // Search filter
  if (search) {
    queryFilters.$and = queryFilters.$and || [];
    queryFilters.$and.push({
      $or: [
        { requestTitle: { $regex: search, $options: 'i' } },
        { requestDescription: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ]
    });
  }

  const count = await InternalRequest.countDocuments(queryFilters);
  
  const requests = await InternalRequest.find(queryFilters)
    .populate('requester', 'name email')
    .populate('recipients', 'name email')
    .populate('responses.recipient', 'name email')
    .populate('responses.sharedQrBundle', 'title qrCodeUrl')
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

// @desc    Get internal request by ID
// @route   GET /api/internal-requests/:id
// @access  Private
const getInternalRequestById = asyncHandler(async (req, res) => {
  const request = await InternalRequest.findOne({
    _id: req.params.id,
    $or: [
      { requester: req.user._id },
      { recipients: req.user._id }
    ]
  }).populate('requester recipients responses.recipient');

  if (!request) {
    res.status(404);
    throw new Error('Internal request not found');
  }

  // Check if user has access to this request (requester or recipient)
  const hasAccess = request.requester._id.toString() === req.user._id.toString() ||
                   request.recipients.some(recipient => recipient._id.toString() === req.user._id.toString());

  if (!hasAccess) {
    res.status(403);
    throw new Error('Not authorized to access this request');
  }

  res.json(request);
});

// @desc    Respond to internal request
// @route   POST /api/internal-requests/:id/respond
// @access  Private
const respondToInternalRequest = asyncHandler(async (req, res) => {
  const { status, responseMessage, qrBundleId } = req.body;
 
  const documents = req.files ? req.files['documents'] : [];

  // Validate status
  if (!status || !['accepted', 'declined'].includes(status)) {
    res.status(400);
    throw new Error('Invalid response status');
  }

  // If accepting, require either documents, documentIds, or QR bundle
  if (status === 'accepted' && (!documents || documents.length === 0) && !qrBundleId && !req.body.documentIds) {
  
    // Allow empty acceptance for backward compatibility - removed error
  }

  const request = await InternalRequest.findById(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error('Internal request not found');
  }

  // Check if user is a recipient of this request
  const isRecipient = request.recipients.some(recipientId => 
    recipientId.toString() === req.user._id.toString()
  );

  if (!isRecipient) {
    res.status(403);
    throw new Error('Not authorized to respond to this request');
  }

  // Find existing response or create new one
  let responseIndex = request.responses.findIndex(r => 
    r.recipient.toString() === req.user._id.toString()
  );

  if (responseIndex === -1) {
    res.status(400);
    throw new Error('No pending response found for this user');
  }

  // Handle file uploads if present
  let uploadedDocuments = [];
  let createdDocumentIds = [];
  
  // Check if document IDs were submitted (new approach)
  if (req.body.documentIds) {
    try {
      const Document = require('../models/documentModel');
      // Parse the documentIds from the request
      const documentIds = JSON.parse(req.body.documentIds);
      
      if (Array.isArray(documentIds) && documentIds.length > 0) {
        // Get the documents from the database
        const documents = await Document.find({ _id: { $in: documentIds } });
        
        if (documents.length > 0) {
          createdDocumentIds = documents.map(doc => doc._id);
          
          // Format documents for the response
          uploadedDocuments = documents.map(doc => ({
            fileName: doc.originalName,
            fileType: doc.fileType,
            fileSize: doc.fileSize,
            fileUrl: doc.s3Url,
            key: doc.s3Key,
            documentId: doc._id
          }));
        }
      }
    } catch (error) {
      res.status(500);
      throw new Error('Error processing document IDs: ' + error.message);
    }
  }
  // Fallback to traditional file upload approach if documentIds is not provided
  else if (documents && documents.length > 0) {
    try {
      const Document = require('../models/documentModel');
      
      // Upload documents to S3 or your storage system
      uploadedDocuments = await Promise.all(documents.map(async (file) => {
        const result = await uploadFile(file);
        
        // Create a Document model entry for each file
        const documentData = {
          originalName: file.originalname,
          fileName: path.basename(result.Key),
          fileType: file.mimetype,
          fileSize: file.size,
          s3Key: result.Key,
          s3Url: result.Location,
          uploadedBy: req.user._id,
          organization: req.user.organization,
          department: req.user.department,
          description: `Uploaded as response to request: ${request.requestTitle}`,
          tags: ['internal-request', 'response']
        };
        
        // Save document to database
        const document = await Document.create(documentData);
        createdDocumentIds.push(document._id);
        
        // Return document metadata for the internal request response
        return {
          fileName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          fileUrl: result.Location,
          key: result.Key,
          documentId: document._id // Store reference to the Document model
        };
      }));
    } catch (error) {
      res.status(500);
      throw new Error('Error uploading documents: ' + error.message);
    }
  }

  // Validate QR bundle if provided
  let qrBundle;
  if (status === 'accepted' && qrBundleId) {
    qrBundle = await QRBundle.findById(qrBundleId);
    
    if (!qrBundle) {
      res.status(404);
      throw new Error('QR bundle not found');
    }

    // Check if user owns the QR bundle or has permission to share it
    if (qrBundle.creator.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to share this QR bundle');
    }
  }

  // Update response
  request.responses[responseIndex] = {
    ...request.responses[responseIndex].toObject(),
    status,
    responseMessage: responseMessage || '',
    sharedQrBundle: status === 'accepted' && qrBundleId ? qrBundleId : undefined,
    documents: status === 'accepted' && uploadedDocuments.length > 0 ? uploadedDocuments : undefined,
    respondedAt: new Date()
  };

  // Update overall request status
  request.updateStatus();
  
  await request.save();

  // Send notification to requester
  try {
    const populatedRequest = await InternalRequest.findById(request._id)
      .populate('requester', 'name email')
      .populate('recipients', 'name email')
      .populate('responses.recipient', 'name email')
      .populate('responses.sharedQrBundle', 'title qrCodeUrl');

    const responseData = populatedRequest.responses.find(r => 
      r.recipient._id.toString() === req.user._id.toString()
    );

    await sendInternalRequestResponseEmail(
      populatedRequest.requester,
      populatedRequest,
      responseData,
      req.user
    );
  } catch (error) {
    console.error('Error sending response email:', error);
    // Continue despite email error
  }

  const updatedRequest = await InternalRequest.findById(req.params.id)
    .populate('requester', 'name email')
    .populate('recipients', 'name email')
    .populate('responses.recipient', 'name email')
    .populate('responses.sharedQrBundle', 'title qrCodeUrl');

  res.json({
    message: `Response sent successfully`,
    request: updatedRequest,
  });
});

// @desc    Update internal request (requester only)
// @route   PUT /api/internal-requests/:id
// @access  Private
const updateInternalRequest = asyncHandler(async (req, res) => {
  const { requestTitle, requestDescription, priority, dueDate, category, tags, isUrgent } = req.body;

  const request = await InternalRequest.findById(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error('Internal request not found');
  }

  // Check if user is the requester
  if (request.requester.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only the requester can update this request');
  }

  // Only allow updates if request is still pending
  if (request.status !== 'pending') {
    res.status(400);
    throw new Error('Cannot update request that has been responded to');
  }

  // Update allowed fields
  if (requestTitle) request.requestTitle = requestTitle;
  if (requestDescription) request.requestDescription = requestDescription;
  if (priority) request.priority = priority;
  if (dueDate !== undefined) request.dueDate = dueDate ? new Date(dueDate) : null;
  if (category) request.category = category;
  if (tags) request.tags = tags;
  if (isUrgent !== undefined) request.isUrgent = isUrgent;

  await request.save();

  const updatedRequest = await InternalRequest.findById(request._id)
    .populate('requester', 'name email')
    .populate('recipients', 'name email')
    .populate('responses.recipient', 'name email');

  res.json({
    message: 'Request updated successfully',
    request: updatedRequest,
  });
});

// @desc    Delete internal request
// @route   DELETE /api/internal-requests/:id
// @access  Private
const deleteInternalRequest = asyncHandler(async (req, res) => {
  const request = await InternalRequest.findById(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error('Internal request not found');
  }

  // Check if user is the requester or an admin
  if (request.requester.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only the requester or admin can delete this request');
  }

  // Actually delete the request from the database
  await request.deleteOne();

  res.json({
    message: 'Request deleted successfully',
  });
});

// @desc    Cancel internal request (change status to cancelled)
// @route   PATCH /api/internal-requests/:id/cancel
// @access  Private
const cancelInternalRequest = asyncHandler(async (req, res) => {
  const request = await InternalRequest.findById(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error('Internal request not found');
  }

  // Check if user is the requester
  if (request.requester.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only the requester can cancel this request');
  }

  // Only allow cancellation if request is still pending
  if (request.status !== 'pending') {
    res.status(400);
    throw new Error('Can only cancel pending requests');
  }

  request.status = 'cancelled';
  await request.save();

  res.json({
    message: 'Request cancelled successfully',
    request
  });
});

// @desc    Delete all internal requests (admin only)
// @route   DELETE /api/internal-requests/delete-all
// @access  Private/Admin
const deleteAllRequests = asyncHandler(async (req, res) => {
  // Only admin can delete all requests
  // if (req.user.role !== 'admin') {
  //   res.status(403);
  //   throw new Error('Only administrators can delete all requests');
  // }

  // Delete all requests
  await InternalRequest.deleteMany({});

  res.json({
    message: 'All requests deleted successfully',
  });
});

// @desc    Get internal request statistics
// @route   GET /api/internal-requests/stats
// @access  Private
const getInternalRequestStats = asyncHandler(async (req, res) => {
  // Get stats for current user
  const userId = req.user._id;

  // Sent requests stats
  const sentStats = await InternalRequest.aggregate([
    { $match: { requester: userId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Received requests stats (where user is recipient)
  const receivedStats = await InternalRequest.aggregate([
    { $match: { recipients: userId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Pending responses (where user needs to respond)
  const pendingResponses = await InternalRequest.countDocuments({
    recipients: userId,
    'responses': {
      $elemMatch: {
        recipient: userId,
        status: 'pending'
      }
    }
  });

  // Overdue requests (sent by user)
  const overdueRequests = await InternalRequest.countDocuments({
    requester: userId,
    dueDate: { $lt: new Date() },
    status: { $in: ['pending', 'partially_fulfilled'] }
  });

  res.json({
    sent: sentStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {}),
    received: receivedStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {}),
    pendingResponses,
    overdueRequests
  });
});

module.exports = {
  createInternalRequest,
  getAllInternalRequests,
  getInternalRequestById,
  respondToInternalRequest,
  updateInternalRequest,
  deleteInternalRequest,
  cancelInternalRequest,
  deleteAllRequests,
  getInternalRequestStats,
};
