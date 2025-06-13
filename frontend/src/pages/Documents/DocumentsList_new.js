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
  ShareIcon
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

  const fetchDocuments = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filters.fileType && { fileType: filters.fileType }),
        ...(filters.department && { department: filters.department })
      });

      // Use different endpoints based on user role
      // Admin and supervisor can see all documents, regular users see only their own
      const endpoint = (user?.role === 'admin' || user?.role === 'supervisor') 
        ? `/documents?${params}` 
        : `/documents/me?${params}`;

      const response = await api.get(endpoint);
      setDocuments(response.data.documents);
      setPagination({
        page: response.data.page,
        pages: response.data.pages,
        total: response.data.total
      });
    } catch (error) {
      toast.error('Failed to fetch documents');
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments(currentPage);
  }, [currentPage, searchTerm, filters]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDocuments(1);
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

  const handleDownload = (document) => {
    if (!document) {
      toast.error('Document data not available');
      return;
    }
    
    if (document.s3Url) {
      // Direct access to S3 URL since bucket is public
      window.open(document.s3Url, '_blank');
    } else {
      toast.error('Download URL not available for this document');
      console.error('No s3Url found for document:', document._id);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="mt-2 text-gray-600">
            Manage your organization's documents ({pagination.total || 0} total)
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
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents by name, tags, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
          </button>
        </form>

        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File Type
                </label>
                <select
                  value={filters.fileType}
                  onChange={(e) => setFilters({ ...filters, fileType: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Types</option>
                  <option value="pdf">PDF</option>
                  <option value="image">Images</option>
                  <option value="word">Word Documents</option>
                  <option value="excel">Excel Files</option>
                  <option value="powerpoint">Presentations</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  placeholder="Department name"
                  value={filters.department}
                  onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Documents List */}
      {loading ? (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filters.fileType || filters.department
              ? 'Try adjusting your search criteria'
              : 'Get started by uploading your first document'}
          </p>
          <Link
            to="/documents/upload"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <CloudArrowUpIcon className="h-5 w-5 mr-2" />
            Upload Documents
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {documents.map((document) => (
              <li key={document._id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="text-2xl">{getFileIcon(document.fileType)}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {document.originalName}
                      </h3>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                        <span>{formatFileSize(document.fileSize)}</span>
                        <span>•</span>
                        <span>Uploaded by {document.uploadedBy?.name}</span>
                        <span>•</span>
                        <span>{format(new Date(document.createdAt), 'MMM dd, yyyy')}</span>
                        {document.department && (
                          <>
                            <span>•</span>
                            <span>{document.department.name}</span>
                          </>
                        )}
                      </div>
                      {document.tags && document.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {document.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {document.description && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {document.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleShareDocument(document)}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full"
                      title="Share with QR code"
                    >
                      <ShareIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDownload(document)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full"
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
                    {(user?.role === 'admin' || user?.role === 'manager' || document.uploadedBy?._id === user?._id) && (
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
            ))}
          </ul>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {pagination.page} of {pagination.pages}
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
  );
};

export default DocumentsList;
