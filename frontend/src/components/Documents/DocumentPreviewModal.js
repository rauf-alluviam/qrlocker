import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  DocumentArrowDownIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import { toast } from 'react-toastify';

const DocumentPreviewModal = ({ document, isOpen, onClose }) => {
  const [documentUrl, setDocumentUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && document) {
      fetchDocumentUrl();
    }
    return () => {
      setDocumentUrl(null);
      setError(null);
    };
  }, [isOpen, document]);

  const fetchDocumentUrl = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/documents/${document._id}/url`);
      // Backend now returns direct S3 URLs instead of signed URLs
      setDocumentUrl(response.data.signedUrl || response.data.url);
    } catch (error) {
      console.error('Error fetching document URL:', error);
      setError('Failed to load document preview');
      toast.error('Failed to load document preview');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await api.get(`/documents/${document._id}/download`);
      window.open(response.data.downloadUrl, '_blank');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
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
    if (fileType?.includes('image')) return '🖼️';
    if (fileType?.includes('pdf')) return '📄';
    if (fileType?.includes('word') || fileType?.includes('doc')) return '📝';
    if (fileType?.includes('excel') || fileType?.includes('sheet')) return '📊';
    if (fileType?.includes('powerpoint') || fileType?.includes('presentation')) return '📽️';
    return '📁';
  };

  const canPreviewInBrowser = (fileType) => {
    return fileType?.includes('image') || fileType?.includes('pdf') || fileType?.includes('text');
  };

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
          <ExclamationTriangleIcon className="h-16 w-16 mb-4" />
          <p className="text-lg font-medium mb-2">Preview Not Available</p>
          <p className="text-sm">{error}</p>
        </div>
      );
    }

    if (!documentUrl) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    const fileType = document.fileType || '';

    // Image preview
    if (fileType.includes('image')) {
      return (
        <div className="flex justify-center bg-gray-50 rounded-lg overflow-hidden">
          <img
            src={documentUrl}
            alt={document.originalName}
            className="max-w-full max-h-96 object-contain"
            onError={() => setError('Failed to load image preview')}
          />
        </div>
      );
    }

    // PDF preview
    if (fileType.includes('pdf')) {
      return (
        <div className="bg-gray-50 rounded-lg overflow-hidden">
          <iframe
            src={documentUrl}
            title={document.originalName}
            className="w-full h-96"
            onError={() => setError('Failed to load PDF preview')}
          />
        </div>
      );
    }

    // Text preview
    if (fileType.includes('text')) {
      return (
        <div className="bg-gray-50 rounded-lg overflow-hidden">
          <iframe
            src={documentUrl}
            title={document.originalName}
            className="w-full h-96 border-0"
            onError={() => setError('Failed to load text preview')}
          />
        </div>
      );
    }

    // For other file types, show a preview not available message
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-lg">
        <EyeSlashIcon className="h-16 w-16 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-600 mb-2">Preview Not Available</p>
        <p className="text-sm text-gray-500 mb-4 text-center">
          This file type cannot be previewed in the browser.<br/>
          Click download to view the file on your device.
        </p>
        <button
          onClick={handleDownload}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
          Download File
        </button>
      </div>
    );
  };

  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-screen overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getFileIcon(document.fileType)}</span>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{document.originalName}</h2>
                <p className="text-sm text-gray-500">
                  {document.fileType} • {formatFileSize(document.fileSize)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Download
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {renderPreview()}
          </div>

          {/* Description if available */}
          {document.description && (
            <div className="px-6 pb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Description</h3>
                <p className="text-sm text-blue-800">{document.description}</p>
              </div>
            </div>
          )}

          {/* Tags if available */}
          {document.tags && document.tags.length > 0 && (
            <div className="px-6 pb-6">
              <div className="flex flex-wrap gap-2">
                {document.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;
