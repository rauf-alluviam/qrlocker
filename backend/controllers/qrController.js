const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const QRBundle = require('../models/qrBundleModel');
const Document = require('../models/documentModel');
const ScanLog = require('../models/scanLogModel');
const { generateAndUploadQR, verifySignature } = require('../utils/qrCodeGenerator');
const { sendPasscodeEmail } = require('../utils/emailSender');
// const { emitQRScanEvent, emitQRBundleStatusChange } = require('../utils/socketEvents');  

// @desc    Create a new QR bundle or reuse existing one
// @route   POST /api/qr
// @access  Private
const createQRBundle = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    documents,
    isPublic,
    hasPasscode,
    expiryDate,
    publishDate,
    maxViews,
    customMessage,
  } = req.body;

  // Check if documents exist and user has permission to include them
  if (documents && documents.length > 0) {
    // Check for duplicate document IDs
    const uniqueDocuments = [...new Set(documents)];
    if (uniqueDocuments.length !== documents.length) {
      res.status(400);
      throw new Error('Duplicate documents are not allowed in a QR bundle');
    }

    // Build permission query based on user role
    let permissionQuery = {
      _id: { $in: documents }
    };

    if (req.user.role === 'admin') {
      // Admins can include any document
      // No additional restrictions
    } else if (req.user.role === 'supervisor') {
      // Supervisors can include documents from their organization
      permissionQuery.$or = [
        { uploadedBy: req.user._id },
        { organization: req.user.organization }
      ];
    } else {
      // Regular users can include documents they uploaded or from their department/organization
      permissionQuery.$or = [
        { uploadedBy: req.user._id },
        { department: req.user.department },
        { organization: req.user.organization }
      ];
    }

    const docsCount = await Document.countDocuments(permissionQuery);

    if (docsCount !== documents.length) {
      res.status(400);
      throw new Error('One or more documents do not exist or you do not have permission to include them');
    }

    // Check for existing QR bundle with same user and documents for document sharing (reuse logic)
    // Only apply reuse logic for single document shares with standard parameters
    if (documents.length === 1 && isPublic === true && hasPasscode === false && !expiryDate && !maxViews) {
      const existingBundle = await QRBundle.findOne({
        creator: req.user._id,
        documents: { $size: 1, $all: documents },
        'accessControl.isPublic': true,
        'accessControl.hasPasscode': false,
        'accessControl.expiryDate': null,
        'accessControl.maxViews': 0,
        'approvalStatus.status': { $in: ['published', 'approved'] }
      });

      if (existingBundle) {
        // Update the timestamp to indicate recent activity
        existingBundle.updatedAt = new Date();
        
        // Update custom message if provided
        if (customMessage) {
          existingBundle.customMessage = customMessage;
        }
        
        await existingBundle.save();
        
        console.log(`Reusing existing QR bundle ${existingBundle._id} for user ${req.user._id} and document ${documents[0]}`);
        return res.status(200).json({
          ...existingBundle.toObject(),
          reused: true,
          message: 'Existing QR bundle reused with updated timestamp'
        });
      }
    }
  }

  // Generate a passcode if required
  let passcode = null;
  if (hasPasscode) {
    passcode = crypto.randomBytes(3).toString('hex').toUpperCase();
  }

  // Check if approval is required based on department settings
  let approvalStatus = {
    required: false,
    status: 'published'
  };

  // Create the QR bundle
  const qrBundle = await QRBundle.create({
    title,
    description,
    creator: req.user._id,
    documents: documents || [],
    accessControl: {
      isPublic: isPublic || false,
      hasPasscode: hasPasscode || false,
      passcode,
      expiryDate: expiryDate || null,
      publishDate: publishDate || new Date(),
      maxViews: maxViews || 0,
      currentViews: 0,
    },
    approvalStatus,
    customMessage: customMessage || '',
  });

  // Generate and upload QR code
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const { qrCodeUrl, signature } = await generateAndUploadQR(
    qrBundle.uuid,
    baseUrl
  );

  // Update QR bundle with QR code URL and signature
  qrBundle.qrCodeUrl = qrCodeUrl;
  qrBundle.hmacSignature = signature;
  await qrBundle.save();

  // Update documents to reference this bundle
  if (documents && documents.length > 0) {
    await Document.updateMany(
      { _id: { $in: documents } },
      { $set: { bundle: qrBundle._id } }
    );
  }

  console.log(`Created new QR bundle ${qrBundle._id} for user ${req.user._id}`);
  res.status(201).json(qrBundle);
});

// @desc    Get all QR bundles
// @route   GET /api/qr
// @access  Private/Admin/Supervisor
const getAllQRBundles = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.page) || 1;
  const groupBy = req.query.groupBy; // New grouping parameter

  // Build query filters
  const queryFilters = {};
  
  if (req.query.status) {
    queryFilters['approvalStatus.status'] = req.query.status;
  }
  
  if (req.query.search) {
    queryFilters.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  // Handle grouping
  if (groupBy && ['creator', 'organization', 'department', 'status', 'accessType'].includes(groupBy)) {
    let groupField;
    let populateFields = [];
    
    switch (groupBy) {
      case 'creator':
        groupField = '$creator';
        populateFields = [{ path: 'creator', select: 'name email' }];
        break;
      case 'organization':
        groupField = '$organization';
        populateFields = [{ path: 'organization', select: 'name' }];
        break;
      case 'department':
        groupField = '$department';
        populateFields = [{ path: 'department', select: 'name' }];
        break;
      case 'status':
        groupField = '$approvalStatus.status';
        break;
      case 'accessType':
        groupField = {
          $cond: {
            if: '$accessControl.isPublic',
            then: 'public',
            else: 'restricted'
          }
        };
        break;
    }

    // Aggregation pipeline for grouping
    const pipeline = [
      { $match: queryFilters },
      {
        $lookup: {
          from: 'users',
          localField: 'creator',
          foreignField: '_id',
          as: 'creator'
        }
      },
      { $unwind: { path: '$creator', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'organizations',
          localField: 'organization',
          foreignField: '_id',
          as: 'organization'
        }
      },
      { $unwind: { path: '$organization', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'departments',
          localField: 'department',
          foreignField: '_id',
          as: 'department'
        }
      },
      { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'documents',
          localField: 'documents',
          foreignField: '_id',
          as: 'documents'
        }
      },
      {
        $group: {
          _id: groupField,
          qrBundles: { $push: '$$ROOT' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ];

    const groupedResults = await QRBundle.aggregate(pipeline);
    const totalGroups = groupedResults.length;

    // Apply pagination to groups
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedGroups = groupedResults.slice(startIndex, endIndex);

    res.json({
      grouped: true,
      groupBy,
      groups: paginatedGroups.map(group => ({
        groupName: group._id?.name || group._id || 'Unassigned',
        groupId: group._id,
        count: group.count,
        qrBundles: group.qrBundles.slice(0, 5) // Limit bundles per group for performance
      })),
      page,
      pages: Math.ceil(totalGroups / pageSize),
      total: totalGroups,
      totalBundles: groupedResults.reduce((sum, group) => sum + group.count, 0)
    });
  } else {
    // Regular listing without grouping
    const count = await QRBundle.countDocuments(queryFilters);
    
    const qrBundles = await QRBundle.find(queryFilters)
      .populate('creator', 'name email')
      .populate('organization', 'name')
      .populate('department', 'name')
      .populate('documents', 'originalName fileType')
      .populate('approvalStatus.approver', 'name email')
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({
      grouped: false,
      qrBundles,
      page,
      pages: Math.ceil(count / pageSize),
      total: count,
    });
  }
});

// @desc    Get QR bundles by current user
// @route   GET /api/qr/me
// @access  Private
const getMyQRBundles = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.page) || 1;

  const count = await QRBundle.countDocuments({
    creator: req.user._id,
  });

  const qrBundles = await QRBundle.find({ creator: req.user._id })
    .populate('documents', 'originalName fileType')
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    qrBundles,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

// @desc    Get QR bundle by ID
// @route   GET /api/qr/:id
// @access  Private
const getQRBundleById = asyncHandler(async (req, res) => {
  // Validate if the provided ID is a valid MongoDB ObjectId
  const mongoose = require('mongoose');
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error('Invalid QR bundle ID format');
  }

  const qrBundle = await QRBundle.findById(req.params.id)
    .populate('creator', 'name email')
    .populate('documents', 'originalName fileType s3Key description')
    .populate('approvalStatus.approver', 'name email');

  if (!qrBundle) {
    res.status(404);
    throw new Error('QR bundle not found');
  }

  // Check if user has access to this QR bundle
  // if (
  //   req.user.role !== 'admin' &&
  //   qrBundle.creator.toString() !== req.user._id.toString()
  // ) {
  //   res.status(403);
  //   throw new Error('Not authorized to access this QR bundle');
  // }

  res.json(qrBundle);
});

// @desc    Get QR bundle by UUID (public access)
// @route   GET /api/qr/view/:uuid
// @access  Public
const getQRBundleByUuid = asyncHandler(async (req, res) => {
  const { uuid } = req.params;
  const signature = req.query.sig;
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  // Debug logging - Log the received UUID and signature

  
  // Generate the expected signature for comparison
  const expectedSignature = require('../utils/qrCodeGenerator').generateSignature(uuid);
  console.log('Expected signature:', expectedSignature);
  
  // Verify the signature
  const isValid = signature && require('../utils/qrCodeGenerator').verifySignature(uuid, signature);
  console.log('Signature valid?', isValid);
  
  // In development, make the signature optional for API testing
  // In production, always require a valid signature
  const isDevelopmentTest = isDevelopment && 
    (req.headers['user-agent']?.includes('insomnia') || 
     req.headers['user-agent']?.includes('postman') || 
     req.headers['user-agent']?.includes('curl'));
  
  // Also check if this is a frontend React app request
  const isFromReactApp = req.headers['origin']?.includes('localhost') || 
                         req.headers['referer']?.includes('localhost');
                         
  const skipSignatureCheck = isDevelopment && (isDevelopmentTest || isFromReactApp);


  // Verify signature unless allowed to skip
  if (!skipSignatureCheck && (!signature || !isValid)) {
    res.status(400);
    throw new Error('Invalid QR code signature');
  }

  const qrBundle = await QRBundle.findOne({ uuid });

  if (!qrBundle) {
    res.status(404);
    throw new Error('QR bundle not found');
  }

  // Check if QR bundle is accessible
  if (!qrBundle.isAccessible()) {
    res.status(403);
    throw new Error('This QR bundle is not currently accessible');
  }

  // Log the scan
  const scanLog = await ScanLog.create({
    qrBundle: qrBundle._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    action: 'scan',
  });

  // Emit real-time scan event
  if (req.io) {
    emitQRScanEvent(req.io, qrBundle, {
      timestamp: scanLog.timestamp,
      action: 'scan',
      ipAddress: req.ip,
      success: true
    });
  }

  // Return limited info if passcode protected
  if (qrBundle.accessControl.hasPasscode) {
    return res.json({
      _id: qrBundle._id,
      title: qrBundle.title,
      description: qrBundle.description,
      uuid: qrBundle.uuid,
      hasPasscode: true,
      customMessage: qrBundle.customMessage,
      accessControl: {
        showLockStatus: qrBundle.accessControl.showLockStatus || false,
      },
    });
  }

  // Increment view count if not passcode protected
  qrBundle.accessControl.currentViews += 1;
  await qrBundle.save();

  // Get document info
  const documents = await Document.find({
    _id: { $in: qrBundle.documents },
  }).select('originalName fileType s3Key description tags');

  res.json({
    _id: qrBundle._id,
    title: qrBundle.title,
    description: qrBundle.description,
    uuid: qrBundle.uuid,
    documents,
    accessControl: {
      isPublic: qrBundle.accessControl.isPublic,
      hasPasscode: false, // Don't send passcode info
      expiryDate: qrBundle.accessControl.expiryDate,
      publishDate: qrBundle.accessControl.publishDate,
      maxViews: qrBundle.accessControl.maxViews,
      currentViews: qrBundle.accessControl.currentViews,
    },
    customMessage: qrBundle.customMessage,
  });
});

// @desc    Verify passcode for QR bundle
// @route   POST /api/qr/verify-passcode/:uuid
// @access  Public
const verifyPasscode = asyncHandler(async (req, res) => {
  const { uuid } = req.params;
  const { passcode } = req.body;

  const qrBundle = await QRBundle.findOne({ uuid });

  if (!qrBundle) {
    res.status(404);
    throw new Error('QR bundle not found');
  }

  // Check if QR bundle is accessible
  if (!qrBundle.isAccessible()) {
    res.status(403);
    throw new Error('This QR bundle is not currently accessible');
  }

  // Check passcode
  if (
    !qrBundle.accessControl.hasPasscode ||
    qrBundle.accessControl.passcode !== passcode
  ) {
    // Log failed attempt
    const failedScanLog = await ScanLog.create({
      qrBundle: qrBundle._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      action: 'passcode_attempt',
      success: false,
    });

    // Emit real-time event for failed passcode attempt
    if (req.io) {
      emitQRScanEvent(req.io, qrBundle, {
        timestamp: failedScanLog.timestamp,
        action: 'passcode_failed',
        ipAddress: req.ip,
        success: false
      });
    }

    res.status(401);
    throw new Error('Invalid passcode');
  }

  // Log successful passcode verification
  const successScanLog = await ScanLog.create({
    qrBundle: qrBundle._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    action: 'passcode_attempt',
    success: true,
  });

  // Emit real-time event for successful passcode verification
  if (req.io) {
    emitQRScanEvent(req.io, qrBundle, {
      timestamp: successScanLog.timestamp,
      action: 'passcode_verified',
      ipAddress: req.ip,
      success: true
    });
  }

  // Increment view count
  qrBundle.accessControl.currentViews += 1;
  await qrBundle.save();

  // Get document info
  const documents = await Document.find({
    _id: { $in: qrBundle.documents },
  }).select('originalName fileType s3Key description tags');

  res.json({
    _id: qrBundle._id,
    title: qrBundle.title,
    description: qrBundle.description,
    uuid: qrBundle.uuid,
    documents,
    accessControl: {
      isPublic: qrBundle.accessControl.isPublic,
      hasPasscode: true,
      showLockStatus: qrBundle.accessControl.showLockStatus || false,
      expiryDate: qrBundle.accessControl.expiryDate,
      publishDate: qrBundle.accessControl.publishDate,
      maxViews: qrBundle.accessControl.maxViews,
      currentViews: qrBundle.accessControl.currentViews,
    },
    customMessage: qrBundle.customMessage,
  });
});

// @desc    Update QR bundle
// @route   PUT /api/qr/:id
// @access  Private
const updateQRBundle = asyncHandler(async (req, res) => {
  const qrBundle = await QRBundle.findById(req.params.id);

  if (!qrBundle) {
    res.status(404);
    throw new Error('QR bundle not found');
  }

  // Check ownership or admin/supervisor/user privileges
  if (
    qrBundle.creator.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin' &&
    req.user.role !== 'supervisor' &&
    req.user.role !== 'user'
  ) {
    res.status(403);
    throw new Error('Not authorized to update this QR bundle');
  }

  // Update allowed fields
  if (req.body.title) qrBundle.title = req.body.title;
  if (req.body.description) qrBundle.description = req.body.description;
  if (req.body.customMessage !== undefined) qrBundle.customMessage = req.body.customMessage;

  // Update documents if provided
  if (req.body.documents) {
    // Check for duplicate document IDs
    const uniqueDocuments = [...new Set(req.body.documents)];
    if (uniqueDocuments.length !== req.body.documents.length) {
      res.status(400);
      throw new Error('Duplicate documents are not allowed in a QR bundle');
    }

    // Check if documents exist and user has permission to include them
    // Build permission query based on user role
    let permissionQuery = {
      _id: { $in: req.body.documents }
    };

    if (req.user.role === 'admin') {
      // Admins can include any document
      // No additional restrictions
    } else if (req.user.role === 'supervisor') {
      // Supervisors can include documents from their organization
      permissionQuery.$or = [
        { uploadedBy: req.user._id },
        { organization: req.user.organization }
      ];
    } else {
      // Regular users can include documents they uploaded or from their department/organization
      permissionQuery.$or = [
        { uploadedBy: req.user._id },
        { department: req.user.department },
        { organization: req.user.organization }
      ];
    }

    const docsCount = await Document.countDocuments(permissionQuery);

    if (docsCount !== req.body.documents.length) {
      res.status(400);
      throw new Error('One or more documents do not exist or you do not have permission to include them');
    }

    // Update the existing documents to remove bundle reference
    await Document.updateMany(
      { bundle: qrBundle._id },
      { $unset: { bundle: 1 } }
    );

    // Set new documents
    qrBundle.documents = req.body.documents;

    // Update new documents to reference this bundle
    await Document.updateMany(
      { _id: { $in: req.body.documents } },
      { $set: { bundle: qrBundle._id } }
    );
  }

  // Update access control settings
  if (req.body.accessControl) {
    const ac = req.body.accessControl;
    
    if (ac.isPublic !== undefined) qrBundle.accessControl.isPublic = ac.isPublic;
    if (ac.expiryDate) qrBundle.accessControl.expiryDate = ac.expiryDate;
    if (ac.publishDate) qrBundle.accessControl.publishDate = ac.publishDate;
    if (ac.maxViews !== undefined) qrBundle.accessControl.maxViews = ac.maxViews;
    if (ac.showLockStatus !== undefined) qrBundle.accessControl.showLockStatus = ac.showLockStatus;
    
    // Handle passcode changes
    if (ac.hasPasscode !== undefined) {
      qrBundle.accessControl.hasPasscode = ac.hasPasscode;
      
      // Generate new passcode if enabled and not provided
      if (ac.hasPasscode && !ac.passcode) {
        qrBundle.accessControl.passcode = crypto.randomBytes(3).toString('hex').toUpperCase();
      } else if (ac.hasPasscode && ac.passcode) {
        qrBundle.accessControl.passcode = ac.passcode;
      }
    }
  }

  const updatedQRBundle = await qrBundle.save();

  // Emit real-time event for QR bundle update
  if (req.io) {
    emitQRBundleStatusChange(req.io, updatedQRBundle, 'updated');
  }

  res.json(updatedQRBundle);
});

// @desc    Delete QR bundle
// @route   DELETE /api/qr/:id
// @access  Private
const deleteQRBundle = asyncHandler(async (req, res) => {
  const qrBundle = await QRBundle.findById(req.params.id);

  if (!qrBundle) {
    res.status(404);
    throw new Error('QR bundle not found');
  }

  // Check ownership or admin/supervisor/user privileges
  if (
    qrBundle.creator.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin' &&
    req.user.role !== 'supervisor' &&
    req.user.role !== 'user'
  ) {
    res.status(403);
    throw new Error('Not authorized to delete this QR bundle');
  }

  // Update documents to remove bundle reference
  await Document.updateMany(
    { bundle: qrBundle._id },
    { $unset: { bundle: 1 } }
  );

  // Delete QR bundle
  await qrBundle.deleteOne();

  // Emit real-time event for QR bundle deletion
  if (req.io) {
    emitQRBundleStatusChange(req.io, qrBundle, 'deleted');
  }

  res.json({ message: 'QR bundle removed' });
});

// @desc    Regenerate passcode for QR bundle
// @route   POST /api/qr/:id/regenerate-passcode
// @access  Private
const regeneratePasscode = asyncHandler(async (req, res) => {
  const qrBundle = await QRBundle.findById(req.params.id);

  if (!qrBundle) {
    res.status(404);
    throw new Error('QR bundle not found');
  }

  // Check ownership or admin privileges
  if (
    qrBundle.creator.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin' &&
    req.user.role !== 'supervisor'
  ) {
    res.status(403);
    throw new Error('Not authorized to regenerate passcode for this QR bundle');
  }

  // Enable passcode if not already enabled
  qrBundle.accessControl.hasPasscode = true;
  
  // Generate new passcode
  qrBundle.accessControl.passcode = crypto.randomBytes(3).toString('hex').toUpperCase();
  
  await qrBundle.save();

  res.json({
    message: 'Passcode regenerated successfully',
    passcode: qrBundle.accessControl.passcode,
  });
});

// @desc    Send passcode by email
// @route   POST /api/qr/:id/send-passcode
// @access  Private
const sendPasscodeByEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const qrBundle = await QRBundle.findById(req.params.id);

  if (!qrBundle) {
    res.status(404);
    throw new Error('QR bundle not found');
  }

  // Check ownership or admin/supervisor/user privileges
  if (
    qrBundle.creator.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin' &&
    req.user.role !== 'supervisor' &&
    req.user.role !== 'user'
  ) {
    res.status(403);
    throw new Error('Not authorized to share this QR bundle');
  }

  // Check if passcode is enabled
  if (!qrBundle.accessControl.hasPasscode) {
    res.status(400);
    throw new Error('This QR bundle does not have a passcode enabled');
  }

  // Send email with passcode
  await sendPasscodeEmail(email, qrBundle.accessControl.passcode, qrBundle);

  res.json({
    message: `Passcode sent to ${email} successfully`,
  });
});

// @desc    Approve QR bundle
// @route   POST /api/qr/:id/approve
// @access  Private/Admin/Supervisor
const approveQRBundle = asyncHandler(async (req, res) => {
  const qrBundle = await QRBundle.findById(req.params.id);

  if (!qrBundle) {
    res.status(404);
    throw new Error('QR bundle not found');
  }

  // Update approval status
  qrBundle.approvalStatus.status = 'approved';
  qrBundle.approvalStatus.approver = req.user._id;
  qrBundle.approvalStatus.approvalDate = Date.now();
  qrBundle.approvalStatus.approvalNotes = req.body.notes || '';

  await qrBundle.save();

  // Emit real-time event for QR bundle approval
  if (req.io) {
    emitQRBundleStatusChange(req.io, qrBundle, 'approved');
  }

  res.json({
    message: 'QR bundle approved successfully',
    qrBundle,
  });
});

// @desc    Reject QR bundle
// @route   POST /api/qr/:id/reject
// @access  Private/Admin/Supervisor
const rejectQRBundle = asyncHandler(async (req, res) => {
  const qrBundle = await QRBundle.findById(req.params.id);

  if (!qrBundle) {
    res.status(404);
    throw new Error('QR bundle not found');
  }

  // Require rejection notes
  if (!req.body.notes) {
    res.status(400);
    throw new Error('Please provide rejection notes');
  }

  // Update approval status
  qrBundle.approvalStatus.status = 'rejected';
  qrBundle.approvalStatus.approver = req.user._id;
  qrBundle.approvalStatus.approvalDate = Date.now();
  qrBundle.approvalStatus.approvalNotes = req.body.notes;

  await qrBundle.save();

  // Emit real-time event for QR bundle rejection
  if (req.io) {
    emitQRBundleStatusChange(req.io, qrBundle, 'rejected');
  }

  res.json({
    message: 'QR bundle rejected',
    qrBundle,
  });
});

// @desc    Get QR bundle scan logs
// @route   GET /api/qr/:id/scan-logs
// @access  Private
const getQRBundleScanLogs = asyncHandler(async (req, res) => {
  const qrBundle = await QRBundle.findById(req.params.id);

  if (!qrBundle) {
    res.status(404);
    throw new Error('QR bundle not found');
  }

  // Check access permissions
  if (
    req.user.role !== 'admin' &&
    qrBundle.creator.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to view scan logs for this QR bundle');
  }

  const { page = 1, limit = 20, action } = req.query;
  const skip = (page - 1) * limit;

  // Build filter
  let filter = { qrBundle: req.params.id };
  if (action) {
    filter.action = action;
  }

  // Get scan logs with pagination
  const [scanLogs, total] = await Promise.all([
    ScanLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name email')
      .populate('documentId', 'originalName'),
    ScanLog.countDocuments(filter)
  ]);

  res.json({
    scanLogs: scanLogs.map(log => ({
      id: log._id,
      action: log.action,
      timestamp: log.timestamp,
      user: log.user ? {
        id: log.user._id,
        name: log.user.name,
        email: log.user.email
      } : null,
      document: log.documentId ? {
        id: log.documentId._id,
        name: log.documentId.originalName
      } : null,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      geoLocation: log.geoLocation,
      success: log.success
    })),
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / limit),
      total,
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  });
});

// @desc    Get QR bundle performance metrics
// @route   GET /api/qr/:id/metrics
// @access  Private
const getQRBundleMetrics = asyncHandler(async (req, res) => {
  const qrBundle = await QRBundle.findById(req.params.id)
    .populate('documents', 'originalName fileType fileSize');

  if (!qrBundle) {
    res.status(404);
    throw new Error('QR bundle not found');
  }

  // Check access permissions
  if (
    req.user.role !== 'admin' &&
    req.user.role !== 'supervisor' &&
    req.user.role !== 'user' &&
    qrBundle.creator.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to view metrics for this QR bundle');
  }

  const { timeframe = '7d' } = req.query;
  
  // Calculate date range
  const now = new Date();
  const timeMap = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000
  };
  
  const startDate = new Date(now - (timeMap[timeframe] || timeMap['7d']));

  // Get comprehensive metrics
  const [
    activityStats,
    uniqueUsers,
    deviceBreakdown,
    timeDistribution,
    documentStats,
    conversionMetrics
  ] = await Promise.all([
    // Activity breakdown
    ScanLog.aggregate([
      { 
        $match: { 
          qrBundle: qrBundle._id,
          timestamp: { $gte: startDate }
        }
      },
      { $group: { _id: "$action", count: { $sum: 1 } } }
    ]),

    // Unique users/visitors
    ScanLog.aggregate([
      { 
        $match: { 
          qrBundle: qrBundle._id,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            user: "$user",
            ip: "$ipAddress"
          }
        }
      },
      { $count: "uniqueVisitors" }
    ]),

    // Device/browser breakdown
    ScanLog.aggregate([
      { 
        $match: { 
          qrBundle: qrBundle._id,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: "$userAgent",
          count: { $sum: 1 },
          firstSeen: { $min: "$timestamp" },
          lastSeen: { $max: "$timestamp" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),

    // Time distribution
    ScanLog.aggregate([
      { 
        $match: { 
          qrBundle: qrBundle._id,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $hour: "$timestamp" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]),

    // Document-specific stats
    ScanLog.aggregate([
      { 
        $match: { 
          qrBundle: qrBundle._id,
          documentId: { $exists: true },
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: "$documentId",
          views: { $sum: 1 },
          uniqueUsers: { $addToSet: "$user" }
        }
      },
      {
        $lookup: {
          from: 'documents',
          localField: '_id',
          foreignField: '_id',
          as: 'document'
        }
      },
      { $unwind: '$document' },
      {
        $project: {
          documentId: '$_id',
          name: '$document.originalName',
          fileType: '$document.fileType',
          views: 1,
          uniqueUsers: { $size: '$uniqueUsers' }
        }
      },
      { $sort: { views: -1 } }
    ]),

    // Conversion metrics
    ScanLog.aggregate([
      { $match: { qrBundle: qrBundle._id } },
      {
        $group: {
          _id: null,
          totalScans: {
            $sum: { $cond: [{ $eq: ["$action", "scan"] }, 1, 0] }
          },
          totalViews: {
            $sum: { $cond: [{ $eq: ["$action", "view"] }, 1, 0] }
          },
          totalDownloads: {
            $sum: { $cond: [{ $eq: ["$action", "download"] }, 1, 0] }
          },
          passcodeAttempts: {
            $sum: { $cond: [{ $eq: ["$action", "passcode_attempt"] }, 1, 0] }
          },
          successfulPasscodes: {
            $sum: { 
              $cond: [
                { 
                  $and: [
                    { $eq: ["$action", "passcode_attempt"] },
                    { $eq: ["$success", true] }
                  ]
                }, 
                1, 
                0
              ]
            }
          }
        }
      }
    ])
  ]);

  // Format activity stats
  const activities = activityStats.reduce((acc, stat) => {
    acc[stat._id] = stat.count;
    return acc;
  }, {});

  // Format time distribution
  const hourlyActivity = Array(24).fill(0);
  timeDistribution.forEach(hour => {
    hourlyActivity[hour._id] = hour.count;
  });

  // Calculate performance scores
  const totalActivity = Object.values(activities).reduce((sum, count) => sum + count, 0);
  const engagementScore = totalActivity > 0 ? 
    ((activities.view || 0) + (activities.download || 0)) / totalActivity * 100 : 0;

  const conversion = conversionMetrics[0] || {};
  const conversionRates = {
    scanToView: conversion.totalScans ? 
      (conversion.totalViews / conversion.totalScans * 100).toFixed(2) : 0,
    viewToDownload: conversion.totalViews ? 
      (conversion.totalDownloads / conversion.totalViews * 100).toFixed(2) : 0,
    passcodeSuccess: conversion.passcodeAttempts ? 
      (conversion.successfulPasscodes / conversion.passcodeAttempts * 100).toFixed(2) : 0
  };

  res.json({
    bundle: {
      id: qrBundle._id,
      title: qrBundle.title,
      created: qrBundle.createdAt,
      totalDocuments: qrBundle.documents.length,
      isActive: qrBundle.isAccessible(),
      accessControl: {
        isPublic: qrBundle.accessControl.isPublic,
        hasPasscode: qrBundle.accessControl.hasPasscode,
        maxViews: qrBundle.accessControl.maxViews,
        currentViews: qrBundle.accessControl.currentViews,
        expiryDate: qrBundle.accessControl.expiryDate
      }
    },
    timeframe,
    summary: {
      totalActivity,
      uniqueVisitors: uniqueUsers[0]?.uniqueVisitors || 0,
      engagementScore: engagementScore.toFixed(2),
      topHour: hourlyActivity.indexOf(Math.max(...hourlyActivity))
    },
    activities,
    conversionRates,
    hourlyActivity,
    deviceBreakdown: deviceBreakdown.map(device => ({
      userAgent: device._id,
      count: device.count,
      firstSeen: device.firstSeen,
      lastSeen: device.lastSeen
    })),
    documentStats,
    generatedAt: now
  });
});

// @desc    Generate QR bundle analytics report
// @route   POST /api/qr/:id/generate-report
// @access  Private
const generateAnalyticsReport = asyncHandler(async (req, res) => {
  const qrBundle = await QRBundle.findById(req.params.id)
    .populate('creator', 'name email')
    .populate('documents', 'originalName fileType fileSize');

  if (!qrBundle) {
    res.status(404);
    throw new Error('QR bundle not found');
  }

  // Check access permissions
  if (
    req.user.role !== 'admin' &&
    req.user.role !== 'supervisor' &&
    req.user.role !== 'user' &&
    qrBundle.creator.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to generate report for this QR bundle');
  }

  const { startDate, endDate, includeDetails = true } = req.body;
  
  // Set date range
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate ? new Date(startDate) : new Date(end - 30 * 24 * 60 * 60 * 1000);

  // Generate comprehensive report data
  const reportData = {
    metadata: {
      generatedAt: new Date(),
      generatedBy: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email
      },
      period: { start, end },
      bundle: {
        id: qrBundle._id,
        title: qrBundle.title,
        description: qrBundle.description,
        creator: qrBundle.creator,
        createdAt: qrBundle.createdAt,
        documentsCount: qrBundle.documents.length,
        accessControl: qrBundle.accessControl
      }
    }
  };

  // Get activity summary
  const activitySummary = await ScanLog.aggregate([
    { 
      $match: { 
        qrBundle: qrBundle._id,
        timestamp: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: "$action",
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: "$user" },
        uniqueIPs: { $addToSet: "$ipAddress" }
      }
    }
  ]);

  reportData.summary = {
    totalActivity: activitySummary.reduce((sum, item) => sum + item.count, 0),
    activities: activitySummary.reduce((acc, item) => {
      acc[item._id] = {
        count: item.count,
        uniqueUsers: item.uniqueUsers.filter(u => u).length,
        uniqueIPs: item.uniqueIPs.length
      };
      return acc;
    }, {})
  };

  if (includeDetails) {
    // Get detailed activity logs
    const detailedLogs = await ScanLog.find({
      qrBundle: qrBundle._id,
      timestamp: { $gte: start, $lte: end }
    })
    .sort({ timestamp: -1 })
    .populate('user', 'name email')
    .populate('documentId', 'originalName')
    .limit(1000); // Limit for performance

    reportData.detailedActivity = detailedLogs.map(log => ({
      timestamp: log.timestamp,
      action: log.action,
      user: log.user ? {
        name: log.user.name,
        email: log.user.email
      } : 'Anonymous',
      document: log.documentId?.originalName || null,
      ipAddress: log.ipAddress,
      location: log.geoLocation,
      success: log.success
    }));

    // Get geographic distribution
    const geoData = await ScanLog.aggregate([
      { 
        $match: { 
          qrBundle: qrBundle._id,
          timestamp: { $gte: start, $lte: end },
          'geoLocation.country': { $exists: true }
        }
      },
      {
        $group: {
          _id: {
            country: "$geoLocation.country",
            city: "$geoLocation.city"
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    reportData.geographic = geoData.map(geo => ({
      country: geo._id.country,
      city: geo._id.city,
      accessCount: geo.count
    }));
  }

  res.json({
    message: 'Analytics report generated successfully',
    report: reportData
  });
});

module.exports = {
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
  generateAnalyticsReport,
};