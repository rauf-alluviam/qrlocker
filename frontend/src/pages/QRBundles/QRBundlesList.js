import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  QrCodeIcon, 
  EyeIcon, 
  TrashIcon, 
  FunnelIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  DocumentIcon,
  ClockIcon,
  LockClosedIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const QRBundlesList = () => {
  const { user } = useAuthStore();
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    isPublic: '',
    hasPasscode: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [groupBy, setGroupBy] = useState('');
  const [groupedData, setGroupedData] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  const fetchBundles = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filters.status && { status: filters.status }),
        ...(filters.isPublic && { isPublic: filters.isPublic }),
        ...(filters.hasPasscode && { hasPasscode: filters.hasPasscode }),
        ...(groupBy && { groupBy: groupBy })
      });

      const response = await api.get(`/qr?${params}`);
      
      if (groupBy && response.data.groups) {
        setGroupedData({
          groups: response.data.groups,
          total: response.data.total,
          page: response.data.page,
          pages: response.data.pages
        });
        setBundles([]);
        setExpandedGroups(new Set(response.data.groups.map(group => group._id)));
      } else {
        setBundles(response.data.qrBundles || []);
        setGroupedData(null);
        setPagination({
          page: response.data.page,
          pages: response.data.pages,
          total: response.data.total
        });
      }
    } catch (error) {
      toast.error('Failed to fetch QR bundles');
      console.error('Error fetching bundles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBundles(currentPage);
  }, [currentPage, searchTerm, filters, groupBy]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchBundles(1);
  };

  const toggleGroup = (groupId) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const handleGroupByChange = (value) => {
    setGroupBy(value);
    setCurrentPage(1);
    setExpandedGroups(new Set());
  };

  const getGroupDisplayName = (group, groupByField) => {
    if (!group._id) return 'Ungrouped';
    
    switch (groupByField) {
      case 'creator':
        return group._id.name || group._id.email || 'Unknown Creator';
      case 'organization':
        return group._id.name || 'Unknown Organization';
      case 'department':
        return group._id.name || 'Unknown Department';
      case 'status':
        return group._id.charAt(0).toUpperCase() + group._id.slice(1);
      case 'accessType':
        return group._id === 'public' ? 'Public Access' : 'Restricted Access';
      default:
        return group._id.toString();
    }
  };

  const handleDeleteBundle = async (bundleId) => {
    if (!window.confirm('Are you sure you want to delete this QR bundle?')) {
      return;
    }

    try {
      await api.delete(`/qr/${bundleId}`);
      toast.success('QR bundle deleted successfully');
      fetchBundles(currentPage);
    } catch (error) {
      toast.error('Failed to delete QR bundle');
      console.error('Error deleting bundle:', error);
    }
  };

  const getStatusBadge = (bundle) => {
    const { approvalStatus, accessControl } = bundle;
    
    if (approvalStatus.status === 'pending') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <ClockIcon className="h-3 w-3 mr-1" />
          <span className="hidden sm:inline">Pending Approval</span>
          <span className="sm:hidden">Pending</span>
        </span>
      );
    }
    
    if (approvalStatus.status === 'rejected') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircleIcon className="h-3 w-3 mr-1" />
          Rejected
        </span>
      );
    }
    
    if (accessControl.expiryDate && new Date(accessControl.expiryDate) < new Date()) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
          Expired
        </span>
      );
    }
    
    if (accessControl.maxViews > 0 && accessControl.currentViews >= accessControl.maxViews) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
          <span className="hidden sm:inline">View Limit Reached</span>
          <span className="sm:hidden">Limit Reached</span>
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircleIcon className="h-3 w-3 mr-1" />
        Active
      </span>
    );
  };

  const getAccessIcon = (bundle) => {
    if (bundle.accessControl.hasPasscode) {
      return <LockClosedIcon className="h-4 w-4 text-orange-500" title="Password Protected" />;
    }
    if (bundle.accessControl.isPublic) {
      return <GlobeAltIcon className="h-4 w-4 text-blue-500" title="Public Access" />;
    }
    return <LockClosedIcon className="h-4 w-4 text-gray-500" title="Restricted Access" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">QR Bundles</h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
                Manage your QR code bundles ({pagination.total || 0} total)
              </p>
            </div>
            <Link
              to="/qr-bundles/create"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 w-full sm:w-auto"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Create QR Bundle</span>
              <span className="sm:hidden">Create Bundle</span>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <form onSubmit={handleSearch} className="space-y-4 sm:space-y-0 sm:flex sm:gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search QR bundles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={groupBy}
                onChange={(e) => handleGroupByChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">No Grouping</option>
                <option value="creator">Group by Creator</option>
                <option value="organization">Group by Organization</option>
                <option value="department">Group by Department</option>
                <option value="status">Group by Status</option>
                <option value="accessType">Group by Access Type</option>
              </select>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <FunnelIcon className="h-5 w-5 mr-2" />
                Filters
              </button>
            </div>
          </form>

          {showFilters && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="published">Published</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Access Type
                  </label>
                  <select
                    value={filters.isPublic}
                    onChange={(e) => setFilters({ ...filters, isPublic: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Access</option>
                    <option value="true">Public</option>
                    <option value="false">Restricted</option>
                  </select>
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password Protection
                  </label>
                  <select
                    value={filters.hasPasscode}
                    onChange={(e) => setFilters({ ...filters, hasPasscode: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Protection</option>
                    <option value="true">Password Protected</option>
                    <option value="false">No Password</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bundles List */}
        {loading ? (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-12 w-12 sm:h-16 sm:w-16 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : groupedData ? (
          // Grouped Display
          <div className="space-y-6">
            {groupedData.groups.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-8 sm:p-12 text-center">
                <QrCodeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No QR bundles found</h3>
                <p className="text-gray-500 mb-6">
                  Try adjusting your search criteria
                </p>
              </div>
            ) : (
              groupedData.groups.map((group) => (
                <div key={group._id || 'ungrouped'} className="bg-white shadow rounded-lg overflow-hidden">
                  <div 
                    className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleGroup(group._id || 'ungrouped')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <Squares2X2Icon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {getGroupDisplayName(group, groupBy)}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                          {group.count} bundle{group.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {expandedGroups.has(group._id || 'ungrouped') ? (
                        <ChevronUpIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                  
                  {expandedGroups.has(group._id || 'ungrouped') && (
                    <div className="p-4 sm:p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                        {group.items.map((bundle) => (
                          <div key={bundle._id} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-2 min-w-0 flex-1">
                                {getAccessIcon(bundle)}
                                <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">
                                  {bundle.title}
                                </h3>
                              </div>
                              <div className="flex space-x-1 flex-shrink-0 ml-2">
                                <Link
                                  to={`/qr-bundles/${bundle._id}`}
                                  className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                  title="View details"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </Link>
                                {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'supervisor' || user?.role === 'user' || bundle.creator === user?._id) && (
                                  <button
                                    onClick={() => handleDeleteBundle(bundle._id)}
                                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                    title="Delete"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* QR Code Preview */}
                            {bundle.qrCodeUrl && (
                              <div className="mb-4 flex justify-center">
                                <img
                                  src={bundle.qrCodeUrl}
                                  alt={`QR Code for ${bundle.title}`}
                                  className="h-16 w-16 sm:h-20 sm:w-20 border border-gray-200 rounded"
                                />
                              </div>
                            )}

                            {/* Status Badge */}
                            <div className="mb-3">
                              {getStatusBadge(bundle)}
                            </div>

                            {/* Description */}
                            {bundle.description && (
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {bundle.description}
                              </p>
                            )}

                            {/* Stats */}
                            <div className="space-y-2 text-sm text-gray-500">
                              <div className="flex items-center justify-between">
                                <span className="flex items-center">
                                  <DocumentIcon className="h-4 w-4 mr-1" />
                                  <span className="hidden sm:inline">Documents</span>
                                  <span className="sm:hidden">Docs</span>
                                </span>
                                <span>{bundle.documents?.length || 0}</span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span>Views</span>
                                <span className="text-xs sm:text-sm">
                                  {bundle.accessControl.currentViews}
                                  {bundle.accessControl.maxViews > 0 && ` / ${bundle.accessControl.maxViews}`}
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span>Created</span>
                                <span className="text-xs sm:text-sm">
                                  {format(new Date(bundle.createdAt), 'MMM dd, yyyy')}
                                </span>
                              </div>
                              
                              {bundle.accessControl.expiryDate && (
                                <div className="flex items-center justify-between">
                                  <span>Expires</span>
                                  <span className={`text-xs sm:text-sm ${new Date(bundle.accessControl.expiryDate) < new Date() ? 'text-red-600' : ''}`}>
                                    {format(new Date(bundle.accessControl.expiryDate), 'MMM dd, yyyy')}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Quick Actions */}
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <Link
                                to={`/qr-bundles/${bundle._id}`}
                                className="w-full inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                              >
                                <span className="hidden sm:inline">View Details</span>
                                <span className="sm:hidden">View</span>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {group.hasMore && (
                        <div className="mt-4 text-center">
                          <p className="text-sm text-gray-500">
                            Showing {group.items.length} of {group.count} bundles in this group
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
            
            {/* Pagination for grouped view */}
            {groupedData.pages > 1 && (
              <div className="bg-white px-4 sm:px-6 py-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg shadow space-y-3 sm:space-y-0">
                <div className="text-sm text-gray-700 text-center sm:text-left">
                  Page {groupedData.page} of {groupedData.pages} ({groupedData.total} total)
                </div>
                <div className="flex justify-center sm:justify-end space-x-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === groupedData.pages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : !bundles || bundles.length === 0 ? (
          // Empty state for ungrouped view
          <div className="bg-white shadow rounded-lg p-8 sm:p-12 text-center">
            <QrCodeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No QR bundles found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filters.status || filters.isPublic || filters.hasPasscode
                ? 'Try adjusting your search criteria'
                : 'Get started by creating your first QR bundle'}
            </p>
            <Link
              to="/qr-bundles/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create QR Bundle
            </Link>
          </div>
        ) : (
          // Ungrouped view (original display)
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 p-4 sm:p-6">
              {bundles.map((bundle) => (
                <div key={bundle._id} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      {getAccessIcon(bundle)}
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">
                        {bundle.title}
                      </h3>
                    </div>
                    <div className="flex space-x-1 flex-shrink-0 ml-2">
                      <Link
                        to={`/qr-bundles/${bundle._id}`}
                        className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                        title="View details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Link>
                      {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'supervisor' || user?.role === 'user' || bundle.creator === user?._id) && (
                        <button
                          onClick={() => handleDeleteBundle(bundle._id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* QR Code Preview */}
                  {bundle.qrCodeUrl && (
                    <div className="mb-4 flex justify-center">
                      <img
                        src={bundle.qrCodeUrl}
                        alt={`QR Code for ${bundle.title}`}
                        className="h-16 w-16 sm:h-20 sm:w-20 border border-gray-200 rounded"
                      />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="mb-3">
                    {getStatusBadge(bundle)}
                  </div>

                  {/* Description */}
                  {bundle.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {bundle.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <DocumentIcon className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Documents</span>
                        <span className="sm:hidden">Docs</span>
                      </span>
                      <span>{bundle.documents?.length || 0}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>Views</span>
                      <span className="text-xs sm:text-sm">
                        {bundle.accessControl.currentViews}
                        {bundle.accessControl.maxViews > 0 && ` / ${bundle.accessControl.maxViews}`}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>Created</span>
                      <span className="text-xs sm:text-sm">
                        {format(new Date(bundle.createdAt), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    
                    {bundle.accessControl.expiryDate && (
                      <div className="flex items-center justify-between">
                        <span>Expires</span>
                        <span className={`text-xs sm:text-sm ${new Date(bundle.accessControl.expiryDate) < new Date() ? 'text-red-600' : ''}`}>
                          {format(new Date(bundle.accessControl.expiryDate), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Link
                      to={`/qr-bundles/${bundle._id}`}
                      className="w-full inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <span className="hidden sm:inline">View Details</span>
                      <span className="sm:hidden">View</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-4 sm:px-6 py-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="text-sm text-gray-700 text-center sm:text-left">
                  Page {pagination.page} of {pagination.pages}
                </div>
                <div className="flex justify-center sm:justify-end space-x-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === pagination.pages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QRBundlesList;
