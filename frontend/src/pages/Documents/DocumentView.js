import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  DocumentArrowDownIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  DocumentIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const DocumentView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/documents/${id}`);
      setDocument(response.data);
    } catch (error) {
      console.error('Error fetching document:', error);
      toast.error('Failed to fetch document details');
      navigate('/documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!document) {
      toast.error('Document is still loading. Please wait...');
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

  const handleDelete = async () => {
    if (!document) return;

    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await api.delete(`/documents/${document._id}`);
      toast.success('Document deleted successfully');
      navigate('/documents');
    } catch (error) {
      toast.error('Failed to delete document');
      console.error('Error deleting document:', error);
    }
  };

  const handleShareDocument = async () => {
    if (!document) return;
    
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
      
      // Navigate to the QR bundle view page
      navigate(`/qr-bundles/${qrBundle._id}`);
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Document Not Found</h1>
          <p className="mt-2 text-gray-600">The requested document could not be found.</p>
          <Link
            to="/documents"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Back to Documents
          </Link>
        </div>
      </div>
    );
  }

  const isOwnerOrAdmin = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'supervisor' || user?.role === 'user' || document.uploadedBy?._id === user?._id;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => navigate('/documents')}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{document.originalName}</h1>
            <p className="mt-2 text-gray-600 flex items-center">
              <span className="text-2xl mr-2">{getFileIcon(document.fileType)}</span>
              <span>{document.fileType} • {formatFileSize(document.fileSize)}</span>
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleShareDocument}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none"
            >
              <ShareIcon className="h-4 w-4 mr-2" />
              Share
            </button>
            <button
              onClick={handleDownload}
              disabled={loading || !document}
              className={`inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white focus:outline-none ${
                loading || !document 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              {loading ? 'Loading...' : 'Download'}
            </button>
            {isOwnerOrAdmin && (
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Description</h2>
            <p className="text-gray-700">
              {document.description || 'No description provided for this document.'}
            </p>
          </div>

          {/* Preview if it's an image */}
          {document.fileType && document.fileType.includes('image') && document.s3Url && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Preview</h2>
              <div className="mt-2 flex justify-center border border-gray-200 rounded-lg overflow-hidden">
                <img
                  src={document.s3Url}
                  alt={document.originalName}
                  className="max-w-full max-h-96 object-contain"
                />
              </div>
            </div>
          )}

          {/* Related Documents */}
          {document.relatedDocuments && document.relatedDocuments.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Related Documents</h2>
              <div className="space-y-3">
                {document.relatedDocuments.map((relatedDoc) => (
                  <div
                    key={relatedDoc._id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getFileIcon(relatedDoc.fileType)}</span>
                      <span className="text-sm font-medium">{relatedDoc.originalName}</span>
                    </div>
                    <Link
                      to={`/documents/${relatedDoc._id}`}
                      className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                    >
                      <DocumentIcon className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Side Info */}
        <div className="space-y-6">
          {/* Metadata */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Document Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Uploaded By</span>
                <span className="text-sm font-medium">{document.uploadedBy?.name || 'System'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Upload Date</span>
                {/* <span className="text-sm font-medium">{format(new Date(document.createdAt), 'MMM dd, yyyy')}</span> */}
              </div>
              {document.organization && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Organization</span>
                  <span className="text-sm font-medium">{document.organization.name}</span>
                </div>
              )}
              {document.department && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Department</span>
                  <span className="text-sm font-medium">{document.department.name}</span>
                </div>
              )}
              {document.bundle && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">QR Bundle</span>
                  <Link
                    to={`/qr-bundles/${document.bundle._id}`}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    {document.bundle.title}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Tags</h2>
              {isOwnerOrAdmin && (
                <button
                  className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                  title="Edit Tags"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
              )}
            </div>
            {document.tags && document.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {document.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    <TagIcon className="h-3 w-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No tags added to this document</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentView;
