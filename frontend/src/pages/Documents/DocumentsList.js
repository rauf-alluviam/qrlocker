import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DocumentIcon, 
  EyeIcon, 
  TrashIcon, 
  FunnelIcon,
  MagnifyingGlassIcon,
  CloudArrowUpIcon,
  DocumentArrowDownIcon,
  FolderIcon,
  ShareIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const DocumentsList = () => {
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    fileType: '',
    department: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [groupBy, setGroupBy] = useState('');
  const [groupedData, setGroupedData] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  const fetchDocuments = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filters.fileType && { fileType: filters.fileType }),
        ...(filters.department && { department: filters.department }),
        ...(groupBy && { groupBy: groupBy })
      });

      // Use different endpoints based on user role
      // Admin and supervisor can see all documents, regular users see only their own
      const endpoint = (user?.role === 'admin' || user?.role === 'supervisor') 
        ? `/documents?${params}` 
        : `/documents/me?${params}`;

      const response = await api.get(endpoint);
      
      if (groupBy && response.data.groups) {
        setGroupedData({
          groups: response.data.groups,
          total: response.data.total,
          page: response.data.page,
          pages: response.data.pages
        });
        setDocuments([]);
        // Auto-expand all groups initially
        setExpandedGroups(new Set(response.data.groups.map(group => group._id)));
      } else {
        setDocuments(response.data.documents);
        setGroupedData(null);
        setPagination({
          page: response.data.page,
          pages: response.data.pages,
          total: response.data.total
        });
      }
    } catch (error) {
      toast.error('Failed to fetch documents');
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments(currentPage);
  }, [currentPage, searchTerm, filters, groupBy]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDocuments(1);
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
      case 'uploadedBy':
        return group._id.name || group._id.email || 'Unknown User';
      case 'organization':
        return group._id.name || 'Unknown Organization';
      case 'department':
        return group._id.name || 'Unknown Department';
      case 'fileType':
        return group._id || 'Unknown File Type';
      case 'tags':
        return group._id || 'Untagged';
      case 'createdDate':
        return new Date(group._id).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      default:
        return group._id?.toString() || 'Unknown';
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await api.delete(`/documents/${documentId}`);
      toast.success('Document deleted successfully');
      fetchDocuments(currentPage);
    } catch (error) {
      toast.error('Failed to delete document');
      console.error('Error deleting document:', error);
    }
  };

  const handleDownload = async (document) => {
    try {
      const response = await api.get(`/documents/${document._id}/download`);
      window.open(response.data.downloadUrl, '_blank');
    } catch (error) {
      toast.error('Failed to download document');
      console.error('Error downloading document:', error);
    }
  };
  
  const handleShareDocument = async (document) => {
    try {
      // Create a QR bundle with this document
      const response = await api.post('/qr', {
        title: `Shared: ${document.originalName}`,
        description: `Shared document: ${document.originalName}`,
        documents: [document._id],
        isPublic: true,
        hasPasscode: false,
        customMessage: 'This document has been shared with you.'
      });
      
      const qrBundle = response.data;
      
      // Show appropriate message based on whether QR bundle was reused or created
      if (qrBundle.reused) {
        toast.success('Document shared successfully! Using existing QR code with updated timestamp.');
      } else {
        toast.success('Document shared successfully! New QR code generated.');
      }
      
      // Redirect to the QR bundle view page
      window.location.href = `/qr-bundles/${qrBundle._id}`;
    } catch (error) {
      toast.error('Failed to share document');
      console.error('Error sharing document:', error);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return '📁';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('doc')) return '📝';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📽️';
    return '📁';
  };

  const renderDocumentItem = (document) => (
    <li key={document._id} className="hover:bg-gray-50">
      <div className="px-6 py-4 flex items-center">
        <div className="flex-shrink-0 text-3xl mr-4">
          {getFileIcon(document.fileType)}
        </div>
        <div className="min-w-0 flex-1">
          <Link to={`/documents/${document._id}`} className="hover:underline">
            <h3 className="text-base font-medium text-gray-900 truncate">
              {document.originalName}
            </h3>
          </Link>
          <div className="mt-1 flex items-center text-sm text-gray-500 space-x-4">
            <p className="truncate">
              {document.description?.length > 90 
                ? document.description.substring(0, 90) + '...' 
                : document.description || 'No description'}
            </p>
            <span className="whitespace-nowrap">
              {formatFileSize(document.fileSize)}
            </span>
            <span className="whitespace-nowrap">
              {document.uploadedBy?.name ? `Uploaded by ${document.uploadedBy.name}` : 'System upload'}
            </span>
            <span className="whitespace-nowrap">
              {format(new Date(document.createdAt), 'MMM dd, yyyy')}
            </span>
          </div>
        </div>
        <div className="flex-shrink-0 flex space-x-1">
          <button
            onClick={() => handleShareDocument(document)}
            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full"
            title="Share"
          >
            <ShareIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleDownload(document)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
            title="Download"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
          </button>
          <Link
            to={`/documents/${document._id}`}
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full"
            title="View details"
          >
            <EyeIcon className="h-5 w-5" />
          </Link>
          {(user?.role === 'admin' || user?.role === 'supervisor' || user?.role === 'manager' || user?.role === 'user' || document.uploadedBy?._id === user?._id) && (
            <button
              onClick={() => handleDeleteDocument(document._id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
              title="Delete"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </li>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="mt-2 text-gray-600">
            Manage your organization's documents ({(groupedData?.total || pagination.total) || 0} total)
          </p>
        </div>
        <Link
          to="/documents/upload"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <CloudArrowUpIcon className="h-5 w-5 mr-2" />
          Upload Documents
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search documents by name, description, or tags..."
              className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <select
            value={groupBy}
            onChange={(e) => handleGroupByChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">No Grouping</option>
            {(user?.role === 'admin' || user?.role === 'supervisor') && (
              <>
                <option value="uploadedBy">Group by Uploader</option>
                <option value="organization">Group by Organization</option>
                <option value="department">Group by Department</option>
              </>
            )}
            <option value="fileType">Group by File Type</option>
            <option value="tags">Group by Tags</option>
            <option value="createdDate">Group by Date</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none"
            title="Toggle Filters"
          >
            <FunnelIcon className="h-5 w-5 text-gray-500" />
          </button>
        </form>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md border border-gray-200">
            <div>
              <label htmlFor="fileTypeFilter" className="block text-sm font-medium text-gray-700 mb-1">
                File Type
              </label>
              <select
                id="fileTypeFilter"
                value={filters.fileType}
                onChange={(e) => setFilters({...filters, fileType: e.target.value})}
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All File Types</option>
                <option value="image">Images</option>
                <option value="pdf">PDF Documents</option>
                <option value="document">Text Documents</option>
                <option value="spreadsheet">Spreadsheets</option>
              </select>
            </div>
            <div>
              <label htmlFor="departmentFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                id="departmentFilter"
                value={filters.department}
                onChange={(e) => setFilters({...filters, department: e.target.value})}
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Departments</option>
                {/* Ideally this would be populated from API */}
                <option value="accounting">Accounting</option>
                <option value="hr">Human Resources</option>
                <option value="marketing">Marketing</option>
                <option value="sales">Sales</option>
                <option value="operations">Operations</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Document List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white shadow rounded-lg p-6">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gray-200 rounded-md"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (groupBy && groupedData) ? (
        // Grouped View
        <div className="space-y-6">
          {groupedData.groups.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <FolderIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-medium text-gray-900 mb-2">No Documents Found</h2>
              <p className="text-gray-600 mb-6">
                No documents match your search criteria. Try adjusting your filters or search terms.
              </p>
              <Link
                to="/documents/upload"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
              >
                <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                Upload New Document
              </Link>
            </div>
          ) : (
            groupedData.groups.map((group) => (
              <div key={group._id || 'ungrouped'} className="bg-white shadow rounded-lg overflow-hidden">
                {/* Group Header */}
                <div 
                  className="px-6 py-4 bg-gray-50 border-b cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleGroup(group._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button className="text-gray-500 hover:text-gray-700">
                        {expandedGroups.has(group._id) ? (
                          <ChevronUpIcon className="h-5 w-5" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5" />
                        )}
                      </button>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {getGroupDisplayName(group, groupBy)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {group.count} document{group.count !== 1 ? 's' : ''}
                          {group.totalSize && ` • ${formatFileSize(group.totalSize)} total`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Squares2X2Icon className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-500">
                        {group.count}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Group Content */}
                {expandedGroups.has(group._id) && (
                  <div>
                    <ul className="divide-y divide-gray-200">
                      {group.documents.map(document => renderDocumentItem(document))}
                    </ul>
                    {group.count > group.documents.length && (
                      <div className="px-6 py-3 bg-gray-50 border-t text-center">
                        <p className="text-sm text-gray-500">
                          Showing {group.documents.length} of {group.count} documents in this group.
                          {/* In a real implementation, you might add a "Load More" button here */}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}

          {/* Grouped Pagination */}
          {groupedData && groupedData.pages > 1 && (
            <div className="bg-white shadow rounded-lg px-6 py-3 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {groupedData.page} of {groupedData.pages} 
                ({groupedData.total} total documents)
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === groupedData.pages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : documents.length === 0 ? (
        // Empty State
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <FolderIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-medium text-gray-900 mb-2">No Documents Found</h2>
          <p className="text-gray-600 mb-6">
            {searchTerm || (filters.fileType || filters.department) 
              ? "No documents match your search criteria. Try adjusting your filters or search terms."
              : "You haven't uploaded any documents yet. Get started by uploading your first document."}
          </p>
          <Link
            to="/documents/upload"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
          >
            <CloudArrowUpIcon className="h-5 w-5 mr-2" />
            Upload New Document
          </Link>
        </div>
      ) : (
        // Regular Ungrouped View
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {documents.map(document => renderDocumentItem(document))}
          </ul>

          {/* Regular Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {pagination.page} of {pagination.pages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === pagination.pages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentsList;