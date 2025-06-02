const asyncHandler = require('express-async-handler');
const ScanLog = require('../models/scanLogModel');
const QRBundle = require('../models/qrBundleModel');
const Document = require('../models/documentModel');

// Helper to apply user role based filters
const getRoleBasedFilters = (user) => {
  // Admin can see everything
  if (user.role === 'admin') {
    return {};
  }
  
  // Supervisor can see their organization
  if (user.role === 'supervisor') {
    return { organization: user.organization };
  }
  
  // Regular users can see their department data and organization-wide data
  return { 
    $or: [
      { department: user.department },
      { organization: user.organization }
    ]
  };
};

// @desc    Get QR scan statistics
// @route   GET /api/analytics/scans
// @access  Private
const getQRScanStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  // Parse dates or use defaults (last 30 days)
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate ? new Date(startDate) : new Date(end - 30 * 24 * 60 * 60 * 1000);
  
  // Get base filters based on user role
  let filters = getRoleBasedFilters(req.user);
  
  // Add date range filter
  filters.timestamp = { $gte: start, $lte: end };
  
  // Get total scans
  const totalScans = await ScanLog.countDocuments({
    ...filters,
    action: 'scan',
  });
  
  // Get total views
  const totalViews = await ScanLog.countDocuments({
    ...filters,
    action: 'view',
  });
  
  // Get total downloads
  const totalDownloads = await ScanLog.countDocuments({
    ...filters,
    action: 'download',
  });
  
  // Get daily stats
  const dailyStats = await ScanLog.aggregate([
    { $match: filters },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          action: "$action"
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id.date": 1 } }
  ]);
  
  // Format daily stats
  const formattedDailyStats = {};
  dailyStats.forEach(stat => {
    const { date, action } = stat._id;
    if (!formattedDailyStats[date]) {
      formattedDailyStats[date] = { scans: 0, views: 0, downloads: 0 };
    }
    formattedDailyStats[date][action] = stat.count;
  });
  
  res.json({
    totalScans,
    totalViews,
    totalDownloads,
    dailyStats: Object.entries(formattedDailyStats).map(([date, stats]) => ({
      date,
      ...stats
    }))
  });
});

// @desc    Get document view statistics
// @route   GET /api/analytics/views
// @access  Private
const getDocumentViewStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  // Parse dates or use defaults (last 30 days)
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate ? new Date(startDate) : new Date(end - 30 * 24 * 60 * 60 * 1000);
  
  // Get base filters based on user role
  let filters = getRoleBasedFilters(req.user);
  
  // Add date range filter
  filters.timestamp = { $gte: start, $lte: end };
  filters.action = 'view';
  
  // Get document views
  const documentViews = await ScanLog.aggregate([
    { $match: filters },
    { $group: { _id: "$documentId", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
  
  // Get document details
  const documentIds = documentViews.map(doc => doc._id).filter(id => id);
  const documents = await Document.find({ _id: { $in: documentIds } })
    .select('originalName fileType');
  
  // Map document details to views
  const documentViewsWithDetails = documentViews.map(view => {
    const document = documents.find(
      doc => doc._id.toString() === view._id?.toString()
    );
    return {
      documentId: view._id,
      documentName: document ? document.originalName : 'Unknown Document',
      fileType: document ? document.fileType : null,
      views: view.count
    };
  });
  
  res.json({
    documentViews: documentViewsWithDetails
  });
});

// @desc    Get top QR bundles by scan count
// @route   GET /api/analytics/top-qr
// @access  Private
const getTopQRBundles = asyncHandler(async (req, res) => {
  // Get base filters based on user role
  let filters = getRoleBasedFilters(req.user);
  
  // Get top QR bundles
  const topQRBundles = await ScanLog.aggregate([
    { $match: filters },
    { $group: { _id: "$qrBundle", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
  
  // Get QR bundle details
  const bundleIds = topQRBundles.map(bundle => bundle._id);
  const bundles = await QRBundle.find({ _id: { $in: bundleIds } })
    .select('title description qrCodeUrl accessControl.currentViews');
  
  // Map bundle details to scan counts
  const topQRBundlesWithDetails = topQRBundles.map(bundle => {
    const bundleDetails = bundles.find(
      b => b._id.toString() === bundle._id.toString()
    );
    return {
      bundleId: bundle._id,
      title: bundleDetails ? bundleDetails.title : 'Unknown Bundle',
      description: bundleDetails ? bundleDetails.description : '',
      qrCodeUrl: bundleDetails ? bundleDetails.qrCodeUrl : '',
      currentViews: bundleDetails ? bundleDetails.accessControl.currentViews : 0,
      scans: bundle.count
    };
  });
  
  res.json({
    topQRBundles: topQRBundlesWithDetails
  });
});

// @desc    Get top documents by view count
// @route   GET /api/analytics/top-documents
// @access  Private
const getTopDocuments = asyncHandler(async (req, res) => {
  // Get base filters based on user role
  let filters = getRoleBasedFilters(req.user);
  
  // Add view action filter
  filters.action = 'view';
  filters.documentId = { $exists: true, $ne: null };
  
  // Get top documents
  const topDocuments = await ScanLog.aggregate([
    { $match: filters },
    { $group: { _id: "$documentId", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
  
  // Get document details
  const documentIds = topDocuments.map(doc => doc._id);
  const documents = await Document.find({ _id: { $in: documentIds } })
    .select('originalName fileType s3Key uploadedBy')
    .populate('uploadedBy', 'name');
  
  // Map document details to view counts
  const topDocumentsWithDetails = topDocuments.map(doc => {
    const document = documents.find(
      d => d._id.toString() === doc._id.toString()
    );
    return {
      documentId: doc._id,
      name: document ? document.originalName : 'Unknown Document',
      fileType: document ? document.fileType : '',
      uploadedBy: document?.uploadedBy?.name || 'Unknown User',
      views: doc.count
    };
  });
  
  res.json({
    topDocuments: topDocumentsWithDetails
  });
});

// @desc    Get scans by time of day
// @route   GET /api/analytics/time-of-day
// @access  Private/Admin/Supervisor
const getScansByTimeOfDay = asyncHandler(async (req, res) => {
  // Get base filters based on user role
  let filters = getRoleBasedFilters(req.user);
  
  // Get scans by hour
  const scansByHour = await ScanLog.aggregate([
    { $match: filters },
    {
      $group: {
        _id: { $hour: "$timestamp" },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  // Format the results for all 24 hours
  const hourlyData = Array(24).fill(0);
  scansByHour.forEach(hour => {
    hourlyData[hour._id] = hour.count;
  });
  
  res.json({
    hourlyData
  });
});

// @desc    Get scans by geographic location
// @route   GET /api/analytics/location
// @access  Private/Admin/Supervisor
const getScansByLocation = asyncHandler(async (req, res) => {
  // Get base filters based on user role
  let filters = getRoleBasedFilters(req.user);
  
  // Add filter for scans with location data
  filters['geoLocation.country'] = { $exists: true, $ne: null };
  
  // Get scans by country
  const scansByCountry = await ScanLog.aggregate([
    { $match: filters },
    {
      $group: {
        _id: "$geoLocation.country",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
  
  // Get scans by city
  const scansByCity = await ScanLog.aggregate([
    { $match: filters },
    {
      $group: {
        _id: {
          country: "$geoLocation.country",
          city: "$geoLocation.city"
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
  
  res.json({
    byCountry: scansByCountry.map(country => ({
      country: country._id || 'Unknown',
      count: country.count
    })),
    byCity: scansByCity.map(city => ({
      country: city._id.country || 'Unknown',
      city: city._id.city || 'Unknown',
      count: city.count
    }))
  });
});

// @desc    Get user activity
// @route   GET /api/analytics/user/:userId
// @access  Private/Admin/Supervisor
const getUserActivity = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  // Get base filters based on user role
  let filters = getRoleBasedFilters(req.user);
  
  // Add user filter
  filters.user = userId;
  
  // Get total activity count
  const totalActivity = await ScanLog.countDocuments(filters);
  
  // Get activity by type
  const activityByType = await ScanLog.aggregate([
    { $match: filters },
    {
      $group: {
        _id: "$action",
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Get recent activity
  const recentActivity = await ScanLog.find(filters)
    .sort({ timestamp: -1 })
    .limit(10)
    .populate({
      path: 'qrBundle',
      select: 'title',
    })
    .populate({
      path: 'documentId',
      select: 'originalName',
    });
  
  res.json({
    totalActivity,
    activityByType: activityByType.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    recentActivity: recentActivity.map(activity => ({
      id: activity._id,
      action: activity.action,
      timestamp: activity.timestamp,
      qrBundle: activity.qrBundle?.title || 'Unknown Bundle',
      document: activity.documentId?.originalName || null,
      success: activity.success
    }))
  });
});

// @desc    Get department activity
// @route   GET /api/analytics/department/:departmentId
// @access  Private
const getDepartmentActivity = asyncHandler(async (req, res) => {
  const { departmentId } = req.params;
  const { startDate, endDate } = req.query;
  
  // Parse dates or use defaults (last 30 days)
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate ? new Date(startDate) : new Date(end - 30 * 24 * 60 * 60 * 1000);
  
  // Filters
  const filters = {
    department: departmentId,
    timestamp: { $gte: start, $lte: end }
  };
  
  // Get total counts
  const totalDocuments = await Document.countDocuments({ department: departmentId });
  const totalBundles = await QRBundle.countDocuments({ department: departmentId });
  const totalScans = await ScanLog.countDocuments({
    ...filters,
    action: 'scan'
  });
  const totalViews = await ScanLog.countDocuments({
    ...filters,
    action: 'view'
  });
  
  // Get trend data
  const activityByDay = await ScanLog.aggregate([
    { $match: filters },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          action: "$action"
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id.date": 1 } }
  ]);
  
  // Format trend data
  const trendData = {};
  activityByDay.forEach(day => {
    const { date, action } = day._id;
    if (!trendData[date]) {
      trendData[date] = { scans: 0, views: 0, downloads: 0 };
    }
    trendData[date][action] = day.count;
  });
  
  res.json({
    departmentId,
    totalDocuments,
    totalBundles,
    totalScans,
    totalViews,
    trendData: Object.entries(trendData).map(([date, data]) => ({
      date,
      ...data
    }))
  });
});

// @desc    Get advanced QR bundle analytics
// @route   GET /api/analytics/bundle/:bundleId
// @access  Private
const getBundleAnalytics = asyncHandler(async (req, res) => {
  const { bundleId } = req.params;
  const { startDate, endDate } = req.query;
  
  // Parse dates or use defaults (last 30 days)
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate ? new Date(startDate) : new Date(end - 30 * 24 * 60 * 60 * 1000);
  
  // Get bundle details
  const bundle = await QRBundle.findById(bundleId)
    .populate('creator', 'name')
    .populate('organization', 'name')
    .populate('department', 'name');
  
  if (!bundle) {
    res.status(404);
    throw new Error('QR bundle not found');
  }
  
  // Check access permissions
  if (
    req.user.role !== 'admin' &&
    bundle.department.toString() !== req.user.department.toString() &&
    bundle.creator._id.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to view analytics for this bundle');
  }
  
  const filters = {
    qrBundle: bundleId,
    timestamp: { $gte: start, $lte: end }
  };
  
  // Get comprehensive analytics
  const [
    activityStats,
    dailyActivity,
    deviceTypes,
    locations,
    documentAccess,
    conversionFunnel
  ] = await Promise.all([
    // Activity breakdown
    ScanLog.aggregate([
      { $match: filters },
      { $group: { _id: "$action", count: { $sum: 1 } } }
    ]),
    
    // Daily activity trend
    ScanLog.aggregate([
      { $match: filters },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
            action: "$action"
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.date": 1 } }
    ]),
    
    // Device/browser analysis
    ScanLog.aggregate([
      { $match: filters },
      {
        $group: {
          _id: {
            userAgent: "$userAgent"
          },
          count: { $sum: 1 },
          lastSeen: { $max: "$timestamp" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),
    
    // Geographic distribution
    ScanLog.aggregate([
      { 
        $match: { 
          ...filters,
          'geoLocation.country': { $exists: true, $ne: null }
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
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]),
    
    // Document-specific access
    ScanLog.aggregate([
      { 
        $match: { 
          ...filters,
          documentId: { $exists: true, $ne: null }
        }
      },
      { $group: { _id: "$documentId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
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
          fileName: '$document.originalName',
          fileType: '$document.fileType',
          accessCount: '$count'
        }
      }
    ]),
    
    // Conversion funnel analysis
    ScanLog.aggregate([
      { $match: { qrBundle: bundle._id } },
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
          },
          failedPasscodes: {
            $sum: { 
              $cond: [
                { 
                  $and: [
                    { $eq: ["$action", "passcode_attempt"] },
                    { $eq: ["$success", false] }
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
  const activityBreakdown = activityStats.reduce((acc, stat) => {
    acc[stat._id] = stat.count;
    return acc;
  }, {});
  
  // Format daily trends
  const dailyTrends = {};
  dailyActivity.forEach(day => {
    const { date, action } = day._id;
    if (!dailyTrends[date]) {
      dailyTrends[date] = { scans: 0, views: 0, downloads: 0 };
    }
    dailyTrends[date][action] = day.count;
  });
  
  // Calculate conversion rates
  const funnel = conversionFunnel[0] || {};
  const conversionRates = {
    scanToView: funnel.totalScans ? (funnel.totalViews / funnel.totalScans * 100).toFixed(2) : 0,
    viewToDownload: funnel.totalViews ? (funnel.totalDownloads / funnel.totalViews * 100).toFixed(2) : 0,
    passcodeSuccess: (funnel.successfulPasscodes + funnel.failedPasscodes) ? 
      (funnel.successfulPasscodes / (funnel.successfulPasscodes + funnel.failedPasscodes) * 100).toFixed(2) : 0
  };
  
  res.json({
    bundle: {
      id: bundle._id,
      title: bundle.title,
      creator: bundle.creator.name,
      organization: bundle.organization?.name,
      department: bundle.department?.name,
      createdAt: bundle.createdAt,
      currentViews: bundle.accessControl.currentViews,
      maxViews: bundle.accessControl.maxViews
    },
    period: { startDate: start, endDate: end },
    activityBreakdown,
    dailyTrends: Object.entries(dailyTrends).map(([date, data]) => ({
      date,
      ...data
    })),
    deviceTypes: deviceTypes.map(device => ({
      userAgent: device._id.userAgent,
      count: device.count,
      lastSeen: device.lastSeen
    })),
    locations: locations.map(loc => ({
      country: loc._id.country || 'Unknown',
      city: loc._id.city || 'Unknown',
      count: loc.count
    })),
    documentAccess,
    conversionFunnel: {
      ...funnel,
      conversionRates
    },
    generatedAt: new Date()
  });
});

// @desc    Get system performance metrics
// @route   GET /api/analytics/system
// @access  Private/Admin
const getSystemMetrics = asyncHandler(async (req, res) => {
  // Only allow admin access
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Admin access required');
  }
  
  const { timeframe = '24h' } = req.query;
  
  // Calculate time range
  const now = new Date();
  const timeMap = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  };
  
  const startTime = new Date(now - (timeMap[timeframe] || timeMap['24h']));
  
  // Get system-wide metrics
  const [
    totalUsers,
    activeUsers,
    totalOrganizations,
    totalDepartments,
    systemActivity,
    errorRates,
    storageUsage,
    apiPerformance
  ] = await Promise.all([
    // Total users
    require('../models/userModel').countDocuments({}),
    
    // Active users (logged in in last 24h)
    ScanLog.aggregate([
      { 
        $match: { 
          user: { $exists: true },
          timestamp: { $gte: new Date(now - 24 * 60 * 60 * 1000) }
        }
      },
      { $group: { _id: "$user" } },
      { $count: "activeUsers" }
    ]),
    
    // Organizations and departments
    require('../models/organizationModel').countDocuments({}),
    require('../models/departmentModel').countDocuments({}),
    
    // System activity breakdown
    ScanLog.aggregate([
      { $match: { timestamp: { $gte: startTime } } },
      {
        $group: {
          _id: "$action",
          count: { $sum: 1 },
          successRate: {
            $avg: { $cond: ["$success", 1, 0] }
          }
        }
      }
    ]),
    
    // Error rates by time
    ScanLog.aggregate([
      { 
        $match: { 
          timestamp: { $gte: startTime },
          success: false
        }
      },
      {
        $group: {
          _id: {
            hour: { $hour: "$timestamp" },
            action: "$action"
          },
          errorCount: { $sum: 1 }
        }
      }
    ]),
    
    // Storage usage
    Document.aggregate([
      {
        $group: {
          _id: null,
          totalSize: { $sum: "$fileSize" },
          totalFiles: { $sum: 1 },
          avgFileSize: { $avg: "$fileSize" }
        }
      }
    ]),
    
    // API response times (simulated - would need actual logging)
    ScanLog.aggregate([
      { $match: { timestamp: { $gte: startTime } } },
      {
        $group: {
          _id: { $hour: "$timestamp" },
          requestCount: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ])
  ]);
  
  res.json({
    timeframe,
    systemOverview: {
      totalUsers,
      activeUsers: activeUsers[0]?.activeUsers || 0,
      totalOrganizations,
      totalDepartments,
      uptime: process.uptime()
    },
    activityMetrics: systemActivity.map(activity => ({
      action: activity._id,
      count: activity.count,
      successRate: (activity.successRate * 100).toFixed(2)
    })),
    storage: storageUsage[0] || { totalSize: 0, totalFiles: 0, avgFileSize: 0 },
    performance: {
      apiRequestsPerHour: apiPerformance.map(p => ({
        hour: p._id,
        requests: p.requestCount
      })),
      errorRates: errorRates
    },
    generatedAt: now
  });
});

module.exports = {
  getQRScanStats,
  getDocumentViewStats,
  getTopQRBundles,
  getTopDocuments,
  getScansByTimeOfDay,
  getScansByLocation,
  getUserActivity,
  getDepartmentActivity,
  getBundleAnalytics,
  getSystemMetrics,
};