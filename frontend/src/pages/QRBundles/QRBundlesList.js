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
  Squares2X2Icon,
  TableCellsIcon,
  ListBulletIcon
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
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'table'

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
        // Auto-expand all groups initially
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
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <ClockIcon className="h-3 w-3 mr-1" />
          Pending Approval
        </span>
      );
    }
    
    if (approvalStatus.status === 'rejected') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircleIcon className="h-3 w-3 mr-1" />
          Rejected
        </span>
      );
    }
    
    if (accessControl.expiryDate && new Date(accessControl.expiryDate) < new Date()) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
          Expired
        </span>
      );
    }
    
    if (accessControl.maxViews > 0 && accessControl.currentViews >= accessControl.maxViews) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
          View Limit Reached
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
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

  const renderTableView = (bundlesToRender) => (
    <div className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl overflow-hidden border border-white/50">
      {/* Enhanced Header with Clean White Theme */}
      <div className="bg-gradient-to-r from-slate-700 via-blue-600 to-blue-700 px-6 py-5">
        <div className="grid grid-cols-12 gap-6 items-center">
          <div className="col-span-1 text-center text-xs font-bold text-white uppercase tracking-widest">
            QR Code
          </div>
          <div className="col-span-3 text-xs font-bold text-white uppercase tracking-widest">
            Bundle Information
          </div>
          <div className="col-span-2 text-xs font-bold text-white uppercase tracking-widest">
            Status & Access
          </div>
          <div className="col-span-1 text-center text-xs font-bold text-white uppercase tracking-widest">
            Files
          </div>
          <div className="col-span-1 text-center text-xs font-bold text-white uppercase tracking-widest">
            Analytics
          </div>
          <div className="col-span-2 text-xs font-bold text-white uppercase tracking-widest">
            Timeline
          </div>
          <div className="col-span-1 text-center text-xs font-bold text-white uppercase tracking-widest">
            Expiry
          </div>
          <div className="col-span-1 text-center text-xs font-bold text-white uppercase tracking-widest">
            Actions
          </div>
        </div>
      </div>

      {/* Enhanced Table Body with Clean White Styling */}
      <div className="divide-y divide-slate-100/70">
        {bundlesToRender.map((bundle, index) => (
          <div 
            key={bundle._id} 
            className={`group hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-slate-50/30 transition-all duration-300 hover:shadow-md ${
              index % 2 === 0 
                ? 'bg-white' 
                : 'bg-slate-50/20'
            }`}
          >
            <div className="grid grid-cols-12 gap-6 items-center px-6 py-5">
              {/* Enhanced QR Code */}
              <div className="col-span-1 flex justify-center">
                <div className="relative group/qr">
                  {bundle.qrCodeUrl ? (
                    <div className="relative">
                      <img
                        src={bundle.qrCodeUrl}
                        alt={`QR Code for ${bundle.title}`}
                        className="h-12 w-12 border-2 border-blue-200/60 rounded-xl shadow-md group-hover/qr:shadow-xl group-hover/qr:scale-110 transition-all duration-300 bg-white p-1"
                      />
                      <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
                    </div>
                  ) : (
                    <div className="h-12 w-12 bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 border-2 border-blue-300/60 rounded-xl flex items-center justify-center shadow-md group-hover/qr:shadow-xl transition-all duration-300">
                      <QrCodeIcon className="h-6 w-6 text-blue-700" />
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Title & Description */}
              <div className="col-span-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1.5">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200">
                      {getAccessIcon(bundle)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors duration-200 mb-1">
                      {bundle.title}
                    </h3>
                    {bundle.description && (
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {bundle.description}
                      </p>
                    )}
                    <div className="flex items-center mt-2 space-x-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100/80 text-slate-700 shadow-sm">
                        ID: {bundle._id.slice(-6)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Status */}
              <div className="col-span-2">
                <div className="space-y-2">
                  <div className="transform hover:scale-105 transition-transform duration-200">
                    {getStatusBadge(bundle)}
                  </div>
                  <div className="flex items-center space-x-2">
                    {bundle.accessControl.isPublic ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100/80 text-green-800 border border-green-200/50 shadow-sm">
                        <GlobeAltIcon className="h-3 w-3 mr-1" />
                        Public
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100/80 text-orange-800 border border-orange-200/50 shadow-sm">
                        <LockClosedIcon className="h-3 w-3 mr-1" />
                        Private
                      </span>
                    )}
                    {bundle.accessControl.hasPasscode && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100/80 text-purple-800 border border-purple-200/50 shadow-sm">
                        Protected
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced Documents */}
              <div className="col-span-1">
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl shadow-sm mb-1">
                    <DocumentIcon className="h-5 w-5 text-blue-700" />
                  </div>
                  <span className="text-lg font-bold text-gray-900">
                    {bundle.documents?.length || 0}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    {bundle.documents?.length === 1 ? 'file' : 'files'}
                  </span>
                </div>
              </div>

              {/* Enhanced Views Analytics */}
              <div className="col-span-1">
                <div className="flex flex-col items-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {bundle.accessControl.currentViews}
                  </div>
                  {bundle.accessControl.maxViews > 0 && (
                    <div className="w-full bg-slate-200 rounded-full h-2 mb-1">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min((bundle.accessControl.currentViews / bundle.accessControl.maxViews) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                  )}
                  <span className="text-xs text-gray-500 font-medium text-center">
                    {bundle.accessControl.maxViews > 0 
                      ? `of ${bundle.accessControl.maxViews} max`
                      : 'unlimited'
                    }
                  </span>
                </div>
              </div>

              {/* Enhanced Timeline */}
              <div className="col-span-2">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <ClockIcon className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {format(new Date(bundle.createdAt), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(bundle.createdAt), 'HH:mm')}
                      </div>
                    </div>
                  </div>
                  {bundle.updatedAt && bundle.updatedAt !== bundle.createdAt && (
                    <div className="text-xs text-gray-500">
                      Updated {format(new Date(bundle.updatedAt), 'MMM dd')}
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Expiry */}
              <div className="col-span-1">
                <div className="text-center">
                  {bundle.accessControl.expiryDate ? (
                    <div className={`space-y-1 ${
                      new Date(bundle.accessControl.expiryDate) < new Date() 
                        ? 'text-red-600' 
                        : new Date(bundle.accessControl.expiryDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                          ? 'text-orange-600'
                          : 'text-gray-700'
                    }`}>
                      <div className="text-sm font-bold">
                        {format(new Date(bundle.accessControl.expiryDate), 'MMM dd')}
                      </div>
                      <div className="text-xs">
                        {format(new Date(bundle.accessControl.expiryDate), 'yyyy')}
                      </div>
                      {new Date(bundle.accessControl.expiryDate) < new Date() && (
                        <div className="text-xs font-medium text-red-600">
                          Expired
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm font-medium text-gray-400">
                      Never
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Actions */}
              <div className="col-span-1">
                <div className="flex justify-center space-x-1">
                  <Link
                    to={`/qr-bundles/${bundle._id}`}
                    className="group/action p-2.5 text-blue-600 hover:text-white hover:bg-blue-600 rounded-xl transition-all duration-200 hover:shadow-lg border border-blue-200 hover:border-blue-600 transform hover:scale-105"
                    title="View details"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Link>
                  {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'supervisor' || user?.role === 'user' || bundle.creator === user?._id) && (
                    <button
                      onClick={() => handleDeleteBundle(bundle._id)}
                      className="group/action p-2.5 text-red-600 hover:text-white hover:bg-red-600 rounded-xl transition-all duration-200 hover:shadow-lg border border-red-200 hover:border-red-600 transform hover:scale-105"
                      title="Delete bundle"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Enhanced Footer */}
      <div className="bg-gradient-to-r from-slate-50/80 to-blue-50/60 px-6 py-4 border-t border-slate-200/50">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <div className="flex items-center space-x-4">
            <span className="font-medium">
              {bundlesToRender.length} bundle{bundlesToRender.length !== 1 ? 's' : ''} displayed
            </span>
          </div>
          <div className="text-xs text-slate-500">
            Last updated: {format(new Date(), 'MMM dd, yyyy HH:mm')}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50/30 to-blue-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header with Clean White Background */}
        <div className="mb-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent">
               Documents
              </h1>
              <p className="mt-2 text-slate-600">
                Manage your documents ({pagination.total || 0} total)
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Enhanced View Toggle with White Theme */}
              <div className="flex items-center bg-slate-100/80 backdrop-blur-sm rounded-xl p-1 border border-slate-200/50 shadow-sm">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-white text-blue-600 shadow-sm border border-blue-200/50'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                  }`}
                  title="List View"
                >
                  <ListBulletIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === 'table'
                      ? 'bg-white text-blue-600 shadow-sm border border-blue-200/50'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                  }`}
                  title="Table View"
                >
                  <TableCellsIcon className="h-5 w-5" />
                </button>
              </div>
              
              <Link
                to="/qr-bundles/create"
                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 border border-blue-600/20"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create QR Bundle
              </Link>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filters with Clean White Background */}
        <div className="mb-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
          <form onSubmit={handleSearch} className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search documents by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200/60 rounded-xl bg-white/90 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 text-slate-700 placeholder-slate-400"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={groupBy}
                onChange={(e) => handleGroupByChange(e.target.value)}
                className="px-4 py-2.5 border border-slate-200/60 rounded-xl text-sm font-medium text-slate-700 bg-white/90 backdrop-blur-sm hover:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200"
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
                className="inline-flex items-center px-4 py-2.5 border border-slate-200/60 rounded-xl text-sm font-medium text-slate-700 bg-white/90 backdrop-blur-sm hover:bg-white hover:border-blue-300 transition-all duration-200"
              >
                <FunnelIcon className="h-5 w-5 mr-2" />
                Filters
              </button>
            </div>
          </form>

          {showFilters && (
            <div className="bg-slate-50/50 backdrop-blur-sm p-5 rounded-xl border border-slate-200/30">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full border border-slate-200/60 rounded-lg px-3 py-2.5 bg-white/90 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 text-slate-700"
                  >
                    <option value="">All Statuses</option>
                    <option value="published">Published</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Access Type
                  </label>
                  <select
                    value={filters.isPublic}
                    onChange={(e) => setFilters({ ...filters, isPublic: e.target.value })}
                    className="w-full border border-slate-200/60 rounded-lg px-3 py-2.5 bg-white/90 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 text-slate-700"
                  >
                    <option value="">All Access</option>
                    <option value="true">Public</option>
                    <option value="false">Restricted</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Password Protection
                  </label>
                  <select
                    value={filters.hasPasscode}
                    onChange={(e) => setFilters({ ...filters, hasPasscode: e.target.value })}
                    className="w-full border border-slate-200/60 rounded-lg px-3 py-2.5 bg-white/90 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 text-slate-700"
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

      {/* Enhanced Bundles List with Clean White Background */}
      {loading ? (
        <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl p-8 border border-white/50">
          <div className="animate-pulse space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-slate-200/60 rounded-xl"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-slate-200/60 rounded-lg w-3/4"></div>
                  <div className="h-3 bg-slate-200/60 rounded-lg w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : groupedData ? (
        // Grouped Display
        <div className="space-y-6">
          {groupedData.groups.length === 0 ? (
            <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl p-12 text-center border border-white/50">
              <QrCodeIcon className="h-16 w-16 text-slate-400 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-slate-700 mb-3">No QR bundles found</h3>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">
                Try adjusting your search criteria or create your first QR bundle to get started.
              </p>
            </div>
          ) : (
            groupedData.groups.map((group) => (
              <div key={group._id || 'ungrouped'} className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden border border-white/50">
                <div 
                  className="px-6 py-5 bg-gradient-to-r from-slate-50/80 to-blue-50/60 border-b border-slate-200/50 cursor-pointer hover:from-slate-100/80 hover:to-blue-100/60 transition-all duration-200"
                  onClick={() => toggleGroup(group._id || 'ungrouped')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50">
                        <Squares2X2Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">
                          {getGroupDisplayName(group, groupBy)}
                        </h3>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100/80 text-blue-800 border border-blue-200/50">
                          {group.count} bundle{group.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/60 backdrop-blur-sm">
                      {expandedGroups.has(group._id || 'ungrouped') ? (
                        <ChevronUpIcon className="h-5 w-5 text-slate-600" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5 text-slate-600" />
                      )}
                    </div>
                  </div>
                </div>
                
                {expandedGroups.has(group._id || 'ungrouped') && (
                  <div className="p-6">
                    {viewMode === 'table' ? (
                      <div className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl overflow-hidden border border-white/50">
                        {/* Enhanced Header with Clean White Theme */}
                        <div className="bg-gradient-to-r from-slate-700 via-blue-600 to-blue-700 px-6 py-5">
                          <div className="grid grid-cols-12 gap-6 items-center">
                            <div className="col-span-1 text-center text-xs font-bold text-white uppercase tracking-widest">
                              QR Code
                            </div>
                            <div className="col-span-3 text-xs font-bold text-white uppercase tracking-widest">
                              Bundle Information
                            </div>
                            <div className="col-span-2 text-xs font-bold text-white uppercase tracking-widest">
                              Status & Access
                            </div>
                            <div className="col-span-1 text-center text-xs font-bold text-white uppercase tracking-widest">
                              Files
                            </div>
                            <div className="col-span-1 text-center text-xs font-bold text-white uppercase tracking-widest">
                              Analytics
                            </div>
                            <div className="col-span-2 text-xs font-bold text-white uppercase tracking-widest">
                              Timeline
                            </div>
                            <div className="col-span-1 text-center text-xs font-bold text-white uppercase tracking-widest">
                              Expiry
                            </div>
                            <div className="col-span-1 text-center text-xs font-bold text-white uppercase tracking-widest">
                              Actions
                            </div>
                          </div>
                        </div>

                        {/* Enhanced Table Body with Clean White Styling */}
                        <div className="divide-y divide-slate-100/70">
                          {group.items.map((bundle, index) => (
                            <div 
                              key={bundle._id} 
                              className={`group hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-slate-50/30 transition-all duration-300 hover:shadow-md ${
                                index % 2 === 0 
                                  ? 'bg-white' 
                                  : 'bg-slate-50/20'
                              }`}
                            >
                              <div className="grid grid-cols-12 gap-6 items-center px-6 py-5">
                                {/* Enhanced QR Code */}
                                <div className="col-span-1 flex justify-center">
                                  <div className="relative group/qr">
                                    {bundle.qrCodeUrl ? (
                                      <div className="relative">
                                        <img
                                          src={bundle.qrCodeUrl}
                                          alt={`QR Code for ${bundle.title}`}
                                          className="h-12 w-12 border-2 border-blue-200/60 rounded-xl shadow-md group-hover/qr:shadow-xl group-hover/qr:scale-110 transition-all duration-300 bg-white p-1"
                                        />
                                        <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
                                      </div>
                                    ) : (
                                      <div className="h-12 w-12 bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 border-2 border-blue-300/60 rounded-xl flex items-center justify-center shadow-md group-hover/qr:shadow-xl transition-all duration-300">
                                        <QrCodeIcon className="h-6 w-6 text-blue-700" />
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Enhanced Title & Description */}
                                <div className="col-span-3">
                                  <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 mt-1.5">
                                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200">
                                        {getAccessIcon(bundle)}
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors duration-200 mb-1">
                                        {bundle.title}
                                      </h3>
                                      {bundle.description && (
                                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                          {bundle.description}
                                        </p>
                                      )}
                                      <div className="flex items-center mt-2 space-x-2">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100/80 text-slate-700 shadow-sm">
                                          ID: {bundle._id.slice(-6)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Enhanced Status */}
                                <div className="col-span-2">
                                  <div className="space-y-2">
                                    <div className="transform hover:scale-105 transition-transform duration-200">
                                      {getStatusBadge(bundle)}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      {bundle.accessControl.isPublic ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100/80 text-green-800 border border-green-200/50 shadow-sm">
                                          <GlobeAltIcon className="h-3 w-3 mr-1" />
                                          Public
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100/80 text-orange-800 border border-orange-200/50 shadow-sm">
                                          <LockClosedIcon className="h-3 w-3 mr-1" />
                                          Private
                                        </span>
                                      )}
                                      {bundle.accessControl.hasPasscode && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100/80 text-purple-800 border border-purple-200/50 shadow-sm">
                                          Protected
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Enhanced Documents */}
                                <div className="col-span-1">
                                  <div className="flex flex-col items-center">
                                    <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl shadow-sm mb-1">
                                      <DocumentIcon className="h-5 w-5 text-blue-700" />
                                    </div>
                                    <span className="text-lg font-bold text-gray-900">
                                      {bundle.documents?.length || 0}
                                    </span>
                                    <span className="text-xs text-gray-500 font-medium">
                                      {bundle.documents?.length === 1 ? 'file' : 'files'}
                                    </span>
                                  </div>
                                </div>

                                {/* Enhanced Views Analytics */}
                                <div className="col-span-1">
                                  <div className="flex flex-col items-center">
                                    <div className="text-2xl font-bold text-blue-600 mb-1">
                                      {bundle.accessControl.currentViews}
                                    </div>
                                    {bundle.accessControl.maxViews > 0 && (
                                      <div className="w-full bg-slate-200 rounded-full h-2 mb-1">
                                        <div 
                                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                                          style={{ 
                                            width: `${Math.min((bundle.accessControl.currentViews / bundle.accessControl.maxViews) * 100, 100)}%` 
                                          }}
                                        ></div>
                                      </div>
                                    )}
                                    <span className="text-xs text-gray-500 font-medium text-center">
                                      {bundle.accessControl.maxViews > 0 
                                        ? `of ${bundle.accessControl.maxViews} max`
                                        : 'unlimited'
                                      }
                                    </span>
                                  </div>
                                </div>

                                {/* Enhanced Timeline */}
                                <div className="col-span-2">
                                  <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                      <ClockIcon className="h-4 w-4 text-gray-400" />
                                      <div>
                                        <div className="text-sm font-semibold text-gray-900">
                                          {format(new Date(bundle.createdAt), 'MMM dd, yyyy')}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {format(new Date(bundle.createdAt), 'HH:mm')}
                                        </div>
                                      </div>
                                    </div>
                                    {bundle.updatedAt && bundle.updatedAt !== bundle.createdAt && (
                                      <div className="text-xs text-gray-500">
                                        Updated {format(new Date(bundle.updatedAt), 'MMM dd')}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Enhanced Expiry */}
                                <div className="col-span-1">
                                  <div className="text-center">
                                    {bundle.accessControl.expiryDate ? (
                                      <div className={`space-y-1 ${
                                        new Date(bundle.accessControl.expiryDate) < new Date() 
                                          ? 'text-red-600' 
                                          : new Date(bundle.accessControl.expiryDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                                            ? 'text-orange-600'
                                            : 'text-gray-700'
                                      }`}>
                                        <div className="text-sm font-bold">
                                          {format(new Date(bundle.accessControl.expiryDate), 'MMM dd')}
                                        </div>
                                        <div className="text-xs">
                                          {format(new Date(bundle.accessControl.expiryDate), 'yyyy')}
                                        </div>
                                        {new Date(bundle.accessControl.expiryDate) < new Date() && (
                                          <div className="text-xs font-medium text-red-600">
                                            Expired
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-sm font-medium text-gray-400">
                                        Never
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Enhanced Actions */}
                                <div className="col-span-1">
                                  <div className="flex justify-center space-x-1">
                                    <Link
                                      to={`/qr-bundles/${bundle._id}`}
                                      className="group/action p-2.5 text-blue-600 hover:text-white hover:bg-blue-600 rounded-xl transition-all duration-200 hover:shadow-lg border border-blue-200 hover:border-blue-600 transform hover:scale-105"
                                      title="View details"
                                    >
                                      <EyeIcon className="h-4 w-4" />
                                    </Link>
                                    {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'supervisor' || user?.role === 'user' || bundle.creator === user?._id) && (
                                      <button
                                        onClick={() => handleDeleteBundle(bundle._id)}
                                        className="group/action p-2.5 text-red-600 hover:text-white hover:bg-red-600 rounded-xl transition-all duration-200 hover:shadow-lg border border-red-200 hover:border-red-600 transform hover:scale-105"
                                        title="Delete bundle"
                                      >
                                        <TrashIcon className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Enhanced Footer with Clean White Theme */}
                        <div className="bg-gradient-to-r from-slate-50/80 to-blue-50/60 px-6 py-4 border-t border-slate-200/50">
                          <div className="flex items-center justify-between text-sm text-slate-600">
                            <div className="flex items-center space-x-4">
                              <span className="font-medium">
                                {group.items.length} bundle{group.items.length !== 1 ? 's' : ''} in this group
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">
                              Group: {getGroupDisplayName(group, groupBy)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-br from-blue-50/40 via-white to-blue-100/30 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {group.items.map((bundle, index) => (
                        <div key={bundle._id} className={`group qr-bundle-card qr-bundle-card-enter stagger-${(index % 9) + 1} relative bg-white/95 backdrop-blur-sm border border-blue-200/60 rounded-2xl p-6 qr-bundle-shimmer hover:shadow-2xl hover:border-blue-400/50 transition-all duration-500 hover:-translate-y-1 overflow-hidden hover-blue-glow`}>
                          {/* Enhanced Background Gradient */}
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-white/80 to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          
                          {/* Content */}
                          <div className="relative z-10">
                            <div className="flex items-start justify-between mb-6">
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 group-hover:from-blue-200 group-hover:to-blue-300 transition-colors duration-300 shadow-sm">
                                  {getAccessIcon(bundle)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors duration-300">
                                    {bundle.title}
                                  </h3>
                                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100/80 text-gray-700 mt-1 shadow-sm">
                                    ID: {bundle._id.slice(-6)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Link
                                  to={`/qr-bundles/${bundle._id}`}
                                  className="p-2 text-blue-600 hover:text-white hover:bg-blue-600 rounded-xl transition-all duration-200 hover:shadow-lg border border-blue-200 hover:border-blue-600 transform hover:scale-105"
                                  title="View details"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </Link>
                                {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'supervisor' || user?.role === 'user' || bundle.creator === user?._id) && (
                                  <button
                                    onClick={() => handleDeleteBundle(bundle._id)}
                                    className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-xl transition-all duration-200 hover:shadow-lg border border-red-200 hover:border-red-600 transform hover:scale-105"
                                    title="Delete"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Enhanced QR Code Preview with Animations */}
                            {bundle.qrCodeUrl && (
                              <div className="mb-6 flex justify-center">
                                <div className="relative group/qr">
                                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-2xl qr-code-pulse opacity-0 group-hover/qr:opacity-100 transition-opacity duration-300"></div>
                                  <img
                                    src={bundle.qrCodeUrl}
                                    alt={`QR Code for ${bundle.title}`}
                                    className="relative h-24 w-24 border-2 border-blue-200/60 rounded-2xl shadow-lg group-hover/qr:shadow-2xl group-hover/qr:shadow-blue-200/50 group-hover/qr:scale-110 transition-all duration-500 bg-white p-2 hover-blue-glow"
                                  />
                                  <div className="absolute -top-2 -right-2 h-4 w-4 bg-gradient-to-br from-green-400 to-green-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-medium rounded-full opacity-0 group-hover/qr:opacity-100 transition-opacity duration-300">
                                    Scan Me
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Enhanced Status Badge with Animation */}
                            <div className="mb-4 flex justify-center">
                              <div className="transform hover:scale-105 transition-transform duration-200">
                                {getStatusBadge(bundle)}
                              </div>
                            </div>

                            {/* Enhanced Description */}
                            {bundle.description && (
                              <p className="text-sm text-gray-600 mb-6 line-clamp-2 text-center italic">
                                {bundle.description}
                              </p>
                            )}

                            {/* Enhanced Stats Grid with Counter Animation */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                              <div className="bg-gradient-to-br from-blue-50 via-blue-100/80 to-blue-200/60 rounded-2xl p-4 text-center group-hover:from-blue-100 group-hover:via-blue-200/80 group-hover:to-blue-300/60 transition-all duration-500 hover:shadow-lg hover:shadow-blue-200/30 border border-blue-200/30">
                                <div className="flex items-center justify-center mb-2">
                                  <DocumentIcon className="h-5 w-5 text-blue-600 mr-1" />
                                  <div className="h-1 w-1 bg-blue-400 rounded-full animate-pulse"></div>
                                </div>
                                <div className="text-2xl font-bold text-blue-800 stats-counter">{bundle.documents?.length || 0}</div>
                                <div className="text-xs text-blue-600 font-medium">Documents</div>
                                <div className="mt-1 h-1 bg-blue-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000 ease-out"
                                    style={{ width: `${Math.min(100, (bundle.documents?.length || 0) * 20)}%` }}
                                  ></div>
                                </div>
                              </div>
                              
                              <div className="bg-gradient-to-br from-green-50 via-green-100/80 to-green-200/60 rounded-2xl p-4 text-center group-hover:from-green-100 group-hover:via-green-200/80 group-hover:to-green-300/60 transition-all duration-500 hover:shadow-lg hover:shadow-green-200/30 border border-green-200/30">
                                <div className="flex items-center justify-center mb-2">
                                  <EyeIcon className="h-5 w-5 text-green-600 mr-1" />
                                  <div className="h-1 w-1 bg-green-400 rounded-full animate-pulse"></div>
                                </div>
                                <div className="text-2xl font-bold text-green-800 stats-counter">
                                  {bundle.accessControl.currentViews}
                                  {bundle.accessControl.maxViews > 0 && (
                                    <span className="text-sm text-green-600">/{bundle.accessControl.maxViews}</span>
                                  )}
                                </div>
                                <div className="text-xs text-green-600 font-medium">Views</div>
                                <div className="mt-1 h-1 bg-green-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-1000 ease-out"
                                    style={{ 
                                      width: bundle.accessControl.maxViews > 0 
                                        ? `${(bundle.accessControl.currentViews / bundle.accessControl.maxViews) * 100}%`
                                        : `${Math.min(100, bundle.accessControl.currentViews * 10)}%`
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </div>

                            {/* Enhanced Timeline with Gradient Backgrounds */}
                            <div className="space-y-3 mb-6">
                              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 via-slate-100/80 to-blue-50 rounded-xl border border-slate-200/50 hover:shadow-md transition-all duration-300">
                                <div className="flex items-center space-x-2">
                                  <div className="p-1 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
                                    <ClockIcon className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <span className="text-sm font-medium text-slate-700">Created</span>
                                </div>
                                <span className="text-sm font-semibold text-slate-900 bg-white/80 px-2 py-1 rounded-lg">
                                  {format(new Date(bundle.createdAt), 'MMM dd, yyyy')}
                                </span>
                              </div>
                              
                              {bundle.accessControl.expiryDate && (
                                <div className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 hover:shadow-md ${
                                  new Date(bundle.accessControl.expiryDate) < new Date() 
                                    ? 'bg-gradient-to-r from-red-50 via-red-100/80 to-red-200/60 border-red-200/50' 
                                    : new Date(bundle.accessControl.expiryDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                                      ? 'bg-gradient-to-r from-orange-50 via-orange-100/80 to-orange-200/60 border-orange-200/50'
                                      : 'bg-gradient-to-r from-blue-50 via-blue-100/80 to-blue-200/60 border-blue-200/50'
                                }`}>
                                  <div className="flex items-center space-x-2">
                                    <div className={`p-1 rounded-lg ${
                                      new Date(bundle.accessControl.expiryDate) < new Date() 
                                        ? 'bg-gradient-to-br from-red-100 to-red-200' 
                                        : new Date(bundle.accessControl.expiryDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                                          ? 'bg-gradient-to-br from-orange-100 to-orange-200'
                                          : 'bg-gradient-to-br from-blue-100 to-blue-200'
                                    }`}>
                                      <ExclamationTriangleIcon className={`h-4 w-4 ${
                                        new Date(bundle.accessControl.expiryDate) < new Date() 
                                          ? 'text-red-600' 
                                          : new Date(bundle.accessControl.expiryDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                                            ? 'text-orange-600'
                                            : 'text-blue-600'
                                      }`} />
                                    </div>
                                    <span className="text-sm font-medium text-slate-700">Expires</span>
                                  </div>
                                  <span className={`text-sm font-semibold bg-white/80 px-2 py-1 rounded-lg ${
                                    new Date(bundle.accessControl.expiryDate) < new Date() ? 'text-red-600' : 'text-slate-900'
                                  }`}>
                                    {format(new Date(bundle.accessControl.expiryDate), 'MMM dd, yyyy')}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Enhanced Access Control Info with Improved Badges */}
                            <div className="flex items-center justify-center space-x-2 mb-6">
                              {bundle.accessControl.isPublic ? (
                                <span className="inline-flex items-center px-3 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300/50 shadow-sm hover:shadow-md transition-all duration-200">
                                  <GlobeAltIcon className="h-3 w-3 mr-1" />
                                  Public Access
                                  <div className="ml-1 h-1 w-1 bg-green-500 rounded-full animate-pulse"></div>
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-3 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border border-orange-300/50 shadow-sm hover:shadow-md transition-all duration-200">
                                  <LockClosedIcon className="h-3 w-3 mr-1" />
                                  Private Access
                                  <div className="ml-1 h-1 w-1 bg-orange-500 rounded-full animate-pulse"></div>
                                </span>
                              )}
                              {bundle.accessControl.hasPasscode && (
                                <span className="inline-flex items-center px-3 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300/50 shadow-sm hover:shadow-md transition-all duration-200">
                                  <div className="h-2 w-2 bg-purple-500 rounded-full mr-1 animate-pulse"></div>
                                  Password Protected
                                </span>
                              )}
                            </div>

                            {/* Enhanced Action Button with Gradient and Animation */}
                            <Link
                              to={`/qr-bundles/${bundle._id}`}
                              className="group/btn w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg hover:shadow-xl hover:shadow-blue-200/50 transition-all duration-300 transform hover:-translate-y-0.5 relative overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                              <span className="relative z-10">View  Details</span>
                              <EyeIcon className="relative z-10 ml-2 h-4 w-4 group-hover/btn:rotate-12 transition-transform duration-300" />
                            </Link>
                          </div>
                        </div>
                        ))}
                      </div>
                    )}
                    
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
            <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between rounded-lg shadow">
              <div className="text-sm text-gray-700">
                Showing page {groupedData.page} of {groupedData.pages} ({groupedData.total} total bundles)
              </div>
              <div className="flex space-x-2">
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
        // Enhanced Empty state for ungrouped view with Clean White Theme
        <div className="bg-white/95 backdrop-blur-sm shadow-lg rounded-2xl p-12 text-center border border-white/50">
          <QrCodeIcon className="h-16 w-16 text-slate-400 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-slate-700 mb-3">No QR bundles found</h3>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            {searchTerm || filters.status || filters.isPublic || filters.hasPasscode
              ? 'Try adjusting your search criteria to find what you\'re looking for.'
              : 'Get started by creating your first QR bundle to organize and share your documents.'}
          </p>
          <Link
            to="/qr-bundles/create"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create QR Bundle
          </Link>
        </div>
      ) : (
        // Enhanced Ungrouped view with toggle between list and table - Clean White Theme
        viewMode === 'table' ? renderTableView(bundles) : (
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden relative border border-white/50">
          {/* Subtle animated background overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 via-transparent to-slate-500/3 animate-pulse-soft"></div>
          
          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-8">
            {bundles.map((bundle, index) => (
              <div 
                key={bundle._id} 
                className={`group qr-bundle-card qr-bundle-card-enter stagger-${(index % 9) + 1} bg-white/98 backdrop-blur-sm border border-slate-200/40 rounded-2xl p-8 qr-bundle-shimmer shadow-md hover:shadow-2xl hover:shadow-blue-200/20 bg-gradient-to-br from-white via-blue-50/10 to-slate-50/10 hover-blue-glow`}
              >
                {/* Enhanced Header with Title and Actions */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 group-hover:from-blue-200 group-hover:to-blue-300 transition-colors duration-300">
                      {getAccessIcon(bundle)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors duration-300">
                        {bundle.title}
                      </h3>
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 mt-1">
                        ID: {bundle._id.slice(-6)}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      to={`/qr-bundles/${bundle._id}`}
                      className="p-2 text-blue-600 hover:text-white hover:bg-blue-600 rounded-xl transition-all duration-200 hover:shadow-lg border border-blue-200 hover:border-blue-600"
                      title="View details"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Link>
                    {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'supervisor' || user?.role === 'user' || bundle.creator === user?._id) && (
                      <button
                        onClick={() => handleDeleteBundle(bundle._id)}
                        className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-xl transition-all duration-200 hover:shadow-lg border border-red-200 hover:border-red-600"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Enhanced QR Code Preview with Animations */}
                {bundle.qrCodeUrl && (
                  <div className="mb-6 flex justify-center">
                    <div className="relative group/qr">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-2xl qr-code-pulse opacity-0 group-hover/qr:opacity-100 transition-opacity duration-300"></div>
                      <img
                        src={bundle.qrCodeUrl}
                        alt={`QR Code for ${bundle.title}`}
                        className="relative h-28 w-28 border-2 border-blue-200/60 rounded-2xl shadow-lg group-hover/qr:shadow-2xl group-hover/qr:shadow-blue-200/50 group-hover/qr:scale-110 transition-all duration-500 bg-white p-3 hover-blue-glow"
                      />
                      <div className="absolute -top-2 -right-2 h-5 w-5 bg-gradient-to-br from-green-400 to-green-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-medium rounded-full opacity-0 group-hover/qr:opacity-100 transition-opacity duration-300">
                        Scan Me
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Status Badge with Animation */}
                <div className="mb-4 flex justify-center">
                  <div className="transform hover:scale-105 transition-transform duration-200">
                    {getStatusBadge(bundle)}
                  </div>
                </div>

                {/* Description */}
                {bundle.description && (
                  <p className="text-sm text-gray-600 mb-6 line-clamp-2 text-center italic">
                    {bundle.description}
                  </p>
                )}

                {/* Enhanced Stats Grid with Counter Animation */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 via-blue-100/80 to-blue-200/60 rounded-2xl p-4 text-center group-hover:from-blue-100 group-hover:via-blue-200/80 group-hover:to-blue-300/60 transition-all duration-500 hover:shadow-lg hover:shadow-blue-200/30 border border-blue-200/30">
                    <div className="flex items-center justify-center mb-2">
                      <DocumentIcon className="h-5 w-5 text-blue-600 mr-1" />
                      <div className="h-1 w-1 bg-blue-400 rounded-full animate-pulse"></div>
                    </div>
                    <div className="text-2xl font-bold text-blue-800 stats-counter">{bundle.documents?.length || 0}</div>
                    <div className="text-xs text-blue-600 font-medium">Documents</div>
                    <div className="mt-1 h-1 bg-blue-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min(100, (bundle.documents?.length || 0) * 20)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 via-green-100/80 to-green-200/60 rounded-2xl p-4 text-center group-hover:from-green-100 group-hover:via-green-200/80 group-hover:to-green-300/60 transition-all duration-500 hover:shadow-lg hover:shadow-green-200/30 border border-green-200/30">
                    <div className="flex items-center justify-center mb-2">
                      <EyeIcon className="h-5 w-5 text-green-600 mr-1" />
                      <div className="h-1 w-1 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                    <div className="text-2xl font-bold text-green-800 stats-counter">
                      {bundle.accessControl.currentViews}
                      {bundle.accessControl.maxViews > 0 && (
                        <span className="text-sm text-green-600">/{bundle.accessControl.maxViews}</span>
                      )}
                    </div>
                    <div className="text-xs text-green-600 font-medium">Views</div>
                    <div className="mt-1 h-1 bg-green-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-1000 ease-out"
                        style={{ 
                          width: bundle.accessControl.maxViews > 0 
                            ? `${(bundle.accessControl.currentViews / bundle.accessControl.maxViews) * 100}%`
                            : `${Math.min(100, bundle.accessControl.currentViews * 10)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Timeline with Gradient Backgrounds */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 via-slate-100/80 to-blue-50 rounded-xl border border-slate-200/50 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center space-x-2">
                      <div className="p-1 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
                        <ClockIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">Created</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 bg-white/80 px-2 py-1 rounded-lg">
                      {format(new Date(bundle.createdAt), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  
                  {bundle.accessControl.expiryDate && (
                    <div className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 hover:shadow-md ${
                      new Date(bundle.accessControl.expiryDate) < new Date() 
                        ? 'bg-gradient-to-r from-red-50 via-red-100/80 to-red-200/60 border-red-200/50' 
                        : new Date(bundle.accessControl.expiryDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                          ? 'bg-gradient-to-r from-orange-50 via-orange-100/80 to-orange-200/60 border-orange-200/50'
                          : 'bg-gradient-to-r from-blue-50 via-blue-100/80 to-blue-200/60 border-blue-200/50'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <div className={`p-1 rounded-lg ${
                          new Date(bundle.accessControl.expiryDate) < new Date() 
                            ? 'bg-gradient-to-br from-red-100 to-red-200' 
                            : new Date(bundle.accessControl.expiryDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                              ? 'bg-gradient-to-br from-orange-100 to-orange-200'
                              : 'bg-gradient-to-br from-blue-100 to-blue-200'
                        }`}>
                          <ExclamationTriangleIcon className={`h-4 w-4 ${
                            new Date(bundle.accessControl.expiryDate) < new Date() 
                              ? 'text-red-600' 
                              : new Date(bundle.accessControl.expiryDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                                ? 'text-orange-600'
                                : 'text-blue-600'
                          }`} />
                        </div>
                        <span className="text-sm font-medium text-slate-700">Expires</span>
                      </div>
                      <span className={`text-sm font-semibold bg-white/80 px-2 py-1 rounded-lg ${
                        new Date(bundle.accessControl.expiryDate) < new Date() ? 'text-red-600' : 'text-slate-900'
                      }`}>
                        {format(new Date(bundle.accessControl.expiryDate), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Enhanced Access Control Info with Improved Badges */}
                <div className="flex items-center justify-center space-x-2 mb-6">
                  {bundle.accessControl.isPublic ? (
                    <span className="inline-flex items-center px-3 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300/50 shadow-sm hover:shadow-md transition-all duration-200">
                      <GlobeAltIcon className="h-3 w-3 mr-1" />
                      Public Access
                      <div className="ml-1 h-1 w-1 bg-green-500 rounded-full animate-pulse"></div>
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border border-orange-300/50 shadow-sm hover:shadow-md transition-all duration-200">
                      <LockClosedIcon className="h-3 w-3 mr-1" />
                      Private Access
                      <div className="ml-1 h-1 w-1 bg-orange-500 rounded-full animate-pulse"></div>
                    </span>
                  )}
                  {bundle.accessControl.hasPasscode && (
                    <span className="inline-flex items-center px-3 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300/50 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="h-2 w-2 bg-purple-500 rounded-full mr-1 animate-pulse"></div>
                      Password Protected
                    </span>
                  )}
                </div>

                {/* Enhanced Action Button with Gradient and Animation */}
                <Link
                  to={`/qr-bundles/${bundle._id}`}
                  className="group/btn w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg hover:shadow-xl hover:shadow-blue-200/50 transition-all duration-300 transform hover:-translate-y-0.5 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                  <span className="relative z-10">View Details</span>
                  <EyeIcon className="relative z-10 ml-2 h-4 w-4 group-hover/btn:rotate-12 transition-transform duration-300" />
                </Link>
              </div>
            ))}
          </div>

          {/* Enhanced Pagination with Gradient and Animation */}
          {pagination.pages > 1 && (
            <div className="px-8 py-6 bg-gradient-to-r from-blue-50 via-blue-100/80 to-blue-200/60 border-t border-blue-200/50 flex items-center justify-between rounded-b-3xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-blue-600/5 animate-pulse-soft"></div>
              <div className="relative text-sm font-semibold text-blue-900 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm border border-blue-200/50">
                <span className="text-blue-600">Page</span> {pagination.page} <span className="text-blue-600">of</span> {pagination.pages}
              </div>
              <div className="relative flex space-x-3">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="group px-4 py-2 bg-white/90 backdrop-blur-sm border border-blue-200/50 rounded-xl text-sm font-semibold text-blue-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/90 disabled:hover:text-blue-700 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  <span className="flex items-center">
                    <ChevronDownIcon className="h-4 w-4 mr-1 rotate-90 group-hover:-translate-x-0.5 transition-transform duration-200" />
                    Previous
                  </span>
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === pagination.pages}
                  className="group px-4 py-2 bg-white/90 backdrop-blur-sm border border-blue-200/50 rounded-xl text-sm font-semibold text-blue-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/90 disabled:hover:text-blue-700 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  <span className="flex items-center">
                    Next
                    <ChevronDownIcon className="h-4 w-4 ml-1 -rotate-90 group-hover:translate-x-0.5 transition-transform duration-200" />
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
        )
      )}
      </div>
    </div>
  );
};

export default QRBundlesList;
