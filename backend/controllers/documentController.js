const asyncHandler = require('express-async-handler');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Document = require('../models/documentModel');
const { getSignedUrl, deleteFile, getObject, uploadObject } = require('../utils/s3');
const { generateAndUploadQR } = require('../utils/qrCodeGenerator');
const QRBundle = require('../models/qrBundleModel');


// @desc    Upload multiple documents
// @route   POST /api/documents/upload
// @access  Private
const uploadDocuments = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error('No files uploaded');
  }

  const uploadedDocuments = [];
  const errors = [];

  for (const file of req.files) {
    try {
      // Validate file was uploaded to S3 successfully
      if (!file.key || !file.location) {
        errors.push(`Failed to upload ${file.originalname} to S3`);
        continue;
      }

      // Check for duplicate document by same user (same name and size)
      if (req.user && req.user._id) {
        const existingDocument = await Document.findOne({
          originalName: file.originalname,
          fileSize: file.size,
          uploadedBy: req.user._id
        });

        if (existingDocument) {
          // Clean up the uploaded S3 file since we won't be using it
          try {
            await deleteFile(file.key);
          } catch (s3Error) {
            console.error(`Failed to delete S3 file ${file.key}:`, s3Error);
          }
          
          errors.push(`You have already uploaded this document: ${file.originalname}`);
          continue;
        }
      }

      const documentData = {
        originalName: file.originalname,
        fileName: path.basename(file.key),
        fileType: file.mimetype,
        fileSize: file.size,
        s3Key: file.key,
        s3Url: file.location,
        // Don't set qrId field - let it be undefined so partial index doesn't apply
        // Add optional fields from request body
        description: req.body.description || '',
        tags: req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : req.body.tags.split(',').map(tag => tag.trim())) : [],
      };
      
      // Add uploadedBy if user is available
      if (req.user && req.user._id) {
        documentData.uploadedBy = req.user._id;
        
        // Add organization and department if available
        if (req.user.organization) {
          documentData.organization = req.user.organization;
        }
        
        if (req.user.department) {
          documentData.department = req.user.department;
        }
      }
      
      // Explicitly setting uploadedBy if not available (for public uploads)
      if (!documentData.uploadedBy) {
        // Use a system user ID or null
        documentData.uploadedBy = null;
      }
      
      const document = await Document.create(documentData);

      uploadedDocuments.push(document);
    } catch (error) {
      console.error(`Error saving document ${file.originalname}:`, error);
      
      // Provide more specific error messages
      if (error.code === 11000) {
        if (error.keyPattern && error.keyPattern.qrId) {
          errors.push(`Failed to save ${file.originalname}: Duplicate QR ID constraint violation`);
        } else {
          errors.push(`Failed to save ${file.originalname}: Duplicate entry detected`);
        }
      } else {
        errors.push(`Failed to save ${file.originalname}: ${error.message}`);
      }
    }
  }

  // Return results
  const response = {
    message: `Successfully uploaded ${uploadedDocuments.length} document(s)`,
    documents: uploadedDocuments,
    totalUploaded: uploadedDocuments.length,
    totalRequested: req.files.length,
  };

  if (errors.length > 0) {
    response.errors = errors;
    response.message += ` with ${errors.length} error(s)`;
  }

  // Return 201 if any files were uploaded successfully, 400 if all failed
  const statusCode = uploadedDocuments.length > 0 ? 201 : 400;
  res.status(statusCode).json(response);
});

// @desc    Get all documents
// @route   GET /api/documents
// @access  Private/Admin
const getAllDocuments = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.page) || 1;
  const groupBy = req.query.groupBy; // New grouping parameter

  // Build query based on filters
  const queryFilters = {};
  
  if (req.query.organization) {
    queryFilters.organization = req.query.organization;
  }
  
  if (req.query.department) {
    queryFilters.department = req.query.department;
  }
  
  if (req.query.fileType) {
    queryFilters.fileType = { $regex: req.query.fileType, $options: 'i' };
  }
  
  if (req.query.search) {
    queryFilters.$or = [
      { originalName: { $regex: req.query.search, $options: 'i' } },
      { tags: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  // Handle grouping
  if (groupBy && ['uploadedBy', 'organization', 'department', 'fileType', 'tags'].includes(groupBy)) {
    let groupField;
    
    switch (groupBy) {
      case 'uploadedBy':
        groupField = '$uploadedBy';
        break;
      case 'organization':
        groupField = '$organization';
        break;
      case 'department':
        groupField = '$department';
        break;
      case 'fileType':
        groupField = {
          $switch: {
            branches: [
              { case: { $regexMatch: { input: '$fileType', regex: /pdf/ } }, then: 'PDF' },
              { case: { $regexMatch: { input: '$fileType', regex: /image/ } }, then: 'Images' },
              { case: { $regexMatch: { input: '$fileType', regex: /word|doc/ } }, then: 'Word Documents' },
              { case: { $regexMatch: { input: '$fileType', regex: /excel|sheet/ } }, then: 'Spreadsheets' },
              { case: { $regexMatch: { input: '$fileType', regex: /powerpoint|presentation/ } }, then: 'Presentations' },
              { case: { $regexMatch: { input: '$fileType', regex: /video/ } }, then: 'Videos' },
              { case: { $regexMatch: { input: '$fileType', regex: /audio/ } }, then: 'Audio' }
            ],
            default: 'Other'
          }
        };
        break;
      case 'tags':
        // Group by first tag if exists, otherwise 'No Tags'
        groupField = {
          $cond: {
            if: { $and: [{ $isArray: '$tags' }, { $gt: [{ $size: '$tags' }, 0] }] },
            then: { $arrayElemAt: ['$tags', 0] },
            else: 'No Tags'
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
          localField: 'uploadedBy',
          foreignField: '_id',
          as: 'uploadedBy'
        }
      },
      { $unwind: { path: '$uploadedBy', preserveNullAndEmptyArrays: true } },
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
        $group: {
          _id: groupField,
          documents: { $push: '$$ROOT' },
          count: { $sum: 1 },
          totalSize: { $sum: '$fileSize' }
        }
      },
      { $sort: { count: -1 } }
    ];

    const groupedResults = await Document.aggregate(pipeline);
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
        totalSize: group.totalSize,
        documents: group.documents.slice(0, 5) // Limit documents per group for performance
      })),
      page,
      pages: Math.ceil(totalGroups / pageSize),
      total: totalGroups,
      totalDocuments: groupedResults.reduce((sum, group) => sum + group.count, 0)
    });
  } else {
    // Regular listing without grouping
    const count = await Document.countDocuments(queryFilters);
    
    const documents = await Document.find(queryFilters)
      .populate('uploadedBy', 'name email')
      .populate('organization', 'name')
      .populate('department', 'name')
      .populate('bundle', 'title')
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({
      grouped: false,
      documents,
      page,
      pages: Math.ceil(count / pageSize),
      total: count,
    });
  }
});

// @desc    Get documents by department
// @route   GET /api/documents/department/:departmentId
// @access  Private
const getDocumentsByDepartment = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.page) || 1;

  const count = await Document.countDocuments({
    department: req.params.departmentId,
  });

  const documents = await Document.find({ department: req.params.departmentId })
    .populate('uploadedBy', 'name email')
    .populate('organization', 'name')
    .populate('department', 'name')
    .populate('bundle', 'title')
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    documents,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

// @desc    Get my documents
// @route   GET /api/documents/me
// @access  Private
const getMyDocuments = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.page) || 1;
  const groupBy = req.query.groupBy; // New grouping parameter

  const queryFilters = { uploadedBy: req.user._id };
  
  // Add search filter
  if (req.query.search) {
    queryFilters.$or = [
      { originalName: { $regex: req.query.search, $options: 'i' } },
      { tags: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  // Add fileType filter
  if (req.query.fileType) {
    queryFilters.fileType = { $regex: req.query.fileType, $options: 'i' };
  }

  // Handle grouping
  if (groupBy && ['fileType', 'tags', 'createdDate'].includes(groupBy)) {
    let groupField;
    
    switch (groupBy) {
      case 'fileType':
        groupField = {
          $switch: {
            branches: [
              { case: { $regexMatch: { input: '$fileType', regex: /pdf/ } }, then: 'PDF' },
              { case: { $regexMatch: { input: '$fileType', regex: /image/ } }, then: 'Images' },
              { case: { $regexMatch: { input: '$fileType', regex: /word|doc/ } }, then: 'Word Documents' },
              { case: { $regexMatch: { input: '$fileType', regex: /excel|sheet/ } }, then: 'Spreadsheets' },
              { case: { $regexMatch: { input: '$fileType', regex: /powerpoint|presentation/ } }, then: 'Presentations' },
              { case: { $regexMatch: { input: '$fileType', regex: /video/ } }, then: 'Videos' },
              { case: { $regexMatch: { input: '$fileType', regex: /audio/ } }, then: 'Audio' }
            ],
            default: 'Other'
          }
        };
        break;
      case 'tags':
        groupField = {
          $cond: {
            if: { $and: [{ $isArray: '$tags' }, { $gt: [{ $size: '$tags' }, 0] }] },
            then: { $arrayElemAt: ['$tags', 0] },
            else: 'No Tags'
          }
        };
        break;
      case 'createdDate':
        groupField = {
          $dateToString: { 
            format: '%Y-%m', 
            date: '$createdAt' 
          }
        };
        break;
    }

    // Aggregation pipeline for grouping
    const pipeline = [
      { $match: queryFilters },
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
        $group: {
          _id: groupField,
          documents: { $push: '$$ROOT' },
          count: { $sum: 1 },
          totalSize: { $sum: '$fileSize' }
        }
      },
      { $sort: { count: -1 } }
    ];

    const groupedResults = await Document.aggregate(pipeline);
    const totalGroups = groupedResults.length;

    // Apply pagination to groups
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedGroups = groupedResults.slice(startIndex, endIndex);

    res.json({
      grouped: true,
      groupBy,
      groups: paginatedGroups.map(group => ({
        groupName: group._id || 'Unassigned',
        groupId: group._id,
        count: group.count,
        totalSize: group.totalSize,
        documents: group.documents.slice(0, 5)
      })),
      page,
      pages: Math.ceil(totalGroups / pageSize),
      total: totalGroups,
      totalDocuments: groupedResults.reduce((sum, group) => sum + group.count, 0)
    });
  } else {
    // Regular listing without grouping
    const count = await Document.countDocuments(queryFilters);

    const documents = await Document.find(queryFilters)
      .populate('organization', 'name')
      .populate('department', 'name')
      .populate('bundle', 'title')
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({
      grouped: false,
      documents,
      page,
      pages: Math.ceil(count / pageSize),
      total: count,
    });
  }
});

// @desc    Get document by ID
// @route   GET /api/documents/:id
// @access  Private
const getDocumentById = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id)
    .populate('uploadedBy', 'name email')
    .populate('organization', 'name')
    .populate('department', 'name')
    .populate('bundle', 'title description')
    .populate('relatedDocuments', 'originalName fileType');

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  // Check if user has access to this document
  if (
    req.user.role !== 'admin' &&
    document.department.toString() !== req.user.department.toString() &&
    document.uploadedBy.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to access this document');
  }

  res.json(document);
});

// @desc    Get signed URL for document
// @route   GET /api/documents/:id/url
// @access  Private
const getDocumentSignedUrl = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  // Check if user has access to this document - now allowing all authenticated users
  if (
    req.user.role !== 'admin' &&
    req.user.role !== 'supervisor' &&
    req.user.role !== 'user' &&
    document.department.toString() !== req.user.department.toString() &&
    document.uploadedBy.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to access this document');
  }

  const url = await getSignedUrl(document.s3Key);
  res.json({ url });
});

// @desc    Update document
// @route   PUT /api/documents/:id
// @access  Private
const updateDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  // Check ownership or admin/supervisor/user privileges
  if (
    document.uploadedBy.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin' &&
    req.user.role !== 'supervisor' &&
    req.user.role !== 'user'
  ) {
    res.status(403);
    throw new Error('Not authorized to update this document');
  }

  // Update fields
  document.description = req.body.description || document.description;
  
  if (req.body.tags) {
    document.tags = Array.isArray(req.body.tags) 
      ? req.body.tags 
      : req.body.tags.split(',').map(tag => tag.trim());
  }

  if (req.body.relatedDocuments) {
    document.relatedDocuments = req.body.relatedDocuments;
  }

  const updatedDocument = await document.save();
  
  res.json(updatedDocument);
});

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
const deleteDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  // Check ownership or admin privileges
  if (
    document.uploadedBy.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to delete this document');
  }

  // Delete from S3
  await deleteFile(document.s3Key);

  // Delete from database
  await document.deleteOne();

  res.json({ message: 'Document removed' });
});

// @desc    Optimize image with Sharp
// @route   POST /api/documents/:id/optimize
// @access  Private
const optimizeImage = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  // Check if document is an image
  const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!imageTypes.includes(document.fileType)) {
    res.status(400);
    throw new Error('Document is not an image');
  }

  try {
    // Get the image from S3
    const s3Object = await getObject(document.s3Key);

    // Process with Sharp
    const quality = req.body.quality || 80;
    const width = req.body.width || null;
    const height = req.body.height || null;
    
    let sharpInstance = sharp(s3Object.Body);
    
    if (width || height) {
      sharpInstance = sharpInstance.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }
    
    let outputBuffer;
    
    if (document.fileType === 'image/jpeg') {
      outputBuffer = await sharpInstance.jpeg({ quality }).toBuffer();
    } else if (document.fileType === 'image/png') {
      outputBuffer = await sharpInstance.png({ quality }).toBuffer();
    } else if (document.fileType === 'image/webp') {
      outputBuffer = await sharpInstance.webp({ quality }).toBuffer();
    } else {
      // Convert other formats to webp
      outputBuffer = await sharpInstance.webp({ quality }).toBuffer();
      document.fileType = 'image/webp';
    }

    // Generate optimized file key
    const optimizedKey = `${path.dirname(document.s3Key)}/optimized-${path.basename(document.s3Key)}`;
    
    // Upload optimized image to S3
    const uploadResult = await uploadObject(optimizedKey, outputBuffer, document.fileType);

    // Update document with optimized URL
    document.optimizedUrl = uploadResult.Location;
    await document.save();

    res.json({
      message: 'Image optimized successfully',
      originalSize: s3Object.ContentLength,
      optimizedSize: outputBuffer.length,
      reductionPercentage: ((s3Object.ContentLength - outputBuffer.length) / s3Object.ContentLength * 100).toFixed(2),
      document,
    });
  } catch (error) {
    console.error('Image optimization error:', error);
    res.status(500);
    throw new Error(`Image optimization failed: ${error.message}`);
  }
});

// @desc    Download document
// @route   GET /api/documents/:id/download
// @access  Private
const downloadDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  // Check if user has access to this document
  if (
    req.user.role !== 'admin' &&
    document.department.toString() !== req.user.department.toString() &&
    document.uploadedBy.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to access this document');
  }

  try {
    // Generate signed URL for download
    const downloadUrl = await getSignedUrl(document.s3Key, 3600); // 1 hour expiry
    
    res.json({ 
      downloadUrl,
      fileName: document.originalName,
      fileSize: document.fileSize,
      fileType: document.fileType
    });
  } catch (error) {
    console.error('Error generating download URL:', error);
    res.status(500);
    throw new Error('Failed to generate download URL');
  }
});

// @desc    Share document by creating a QR bundle or reusing existing one
// @route   POST /api/documents/:id/share
// @access  Private
const shareDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  // Check if user has access to this document
  if (
    req.user.role !== 'admin' &&
    document.department.toString() !== req.user.department.toString() &&
    document.uploadedBy?.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to share this document');
  }

  const { 
    isPublic = true, 
    hasPasscode = false, 
    expiryDate,
    maxViews = 0,
    customMessage = `Shared document: ${document.originalName}`
  } = req.body;

  // Check for existing QR bundle with same user and document for standard sharing parameters (reuse logic)
  if (isPublic === true && hasPasscode === false && !expiryDate && maxViews === 0) {
    const existingBundle = await QRBundle.findOne({
      creator: req.user._id,
      documents: { $size: 1, $all: [document._id] },
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
      
      console.log(`Reusing existing QR bundle ${existingBundle._id} for user ${req.user._id} and document ${document._id}`);
      return res.status(200).json({
        message: 'Document shared successfully (reused existing QR code)',
        qrBundle: {
          ...existingBundle.toObject(),
          reused: true
        }
      });
    }
  }

  // Generate a passcode if required
  let passcode = null;
  if (hasPasscode) {
    passcode = crypto.randomBytes(3).toString('hex').toUpperCase();
  }

  // Create QR bundle
  const qrBundle = await QRBundle.create({
    title: `Shared: ${document.originalName}`,
    description: `Shared document: ${document.originalName}`,
    creator: req.user._id,
    organization: req.user.organization,
    department: req.user.department,
    documents: [document._id],
    accessControl: {
      isPublic,
      hasPasscode,
      passcode,
      expiryDate: expiryDate || null,
      publishDate: new Date(),
      maxViews,
      currentViews: 0,
    },
    approvalStatus: {
      required: false,
      status: 'published'
    },
    customMessage,
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

  // Update document to reference this bundle
  document.bundle = qrBundle._id;
  await document.save();

  console.log(`Created new QR bundle ${qrBundle._id} for user ${req.user._id} and document ${document._id}`);
  res.status(201).json({ 
    message: 'Document shared successfully',
    qrBundle
  });
});

module.exports = {
  uploadDocuments,
  getAllDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  getDocumentsByDepartment,
  getMyDocuments,
  optimizeImage,
  getDocumentSignedUrl,
  downloadDocument,
  shareDocument,
};