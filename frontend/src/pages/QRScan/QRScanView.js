import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  DocumentIcon,
  LockClosedIcon,
  EyeIcon,
  CalendarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CheckCircleIcon,
  DocumentArrowDownIcon,
  ShareIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import PasscodeEntry from './PasscodeEntry';
import DocumentPreviewModal from '../../components/Documents/DocumentPreviewModal';

const QRScanView = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requiresPasscode, setRequiresPasscode] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    if (uuid) {
      fetchBundle();
    }
  }, [uuid]);

  const fetchBundle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Generate URL parameters including signature for access
      const urlParams = new URLSearchParams(window.location.search);
      let signature = urlParams.get('sig');
      
      console.log('QR scan access - UUID:', uuid);
      console.log('QR scan access - Signature from URL:', signature);
      
      // Use the public endpoint to get bundle info
      const response = await api.get(`/qr/view/${uuid}${signature ? `?sig=${signature}` : ''}`);
      
      const bundleData = response.data;
      console.log('QR bundle data retrieved successfully');
      
      // Check if bundle requires passcode
      const hasPasscode = bundleData.accessControl?.hasPasscode || bundleData.hasPasscode;
      console.log('Passcode check:', {
        hasPasscode,
        accessControlHasPasscode: bundleData.accessControl?.hasPasscode,
        bundleHasPasscode: bundleData.hasPasscode,
        bundleData
      });
      
      if (hasPasscode) {
        console.log('Setting requiresPasscode to true');
        setRequiresPasscode(true);
        // Don't show documents if passcode is required
        setBundle({
          ...bundleData,
          documents: []
        });
      } else {
        console.log('No passcode required');
        setBundle(bundleData);
        setRequiresPasscode(false);
      }
      
    } catch (error) {
      console.error('Error fetching bundle:', error);
      if (error.response?.status === 404) {
        setError('QR bundle not found');
      } else if (error.response?.status === 403) {
        setError('This QR bundle is not accessible');
      } else {
        setError('Failed to load QR bundle');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasscodeVerified = (verifiedBundle) => {
    setBundle(verifiedBundle);
    setRequiresPasscode(false);
    toast.success('Access granted!');
  };

  const handleDownloadDocument = async (document) => {
    try {
      // Create download URL using the document's S3 key
      const response = await api.get(`/documents/${document._id}/download`);
      window.open(response.data.downloadUrl, '_blank');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  const handleViewDocument = async (document) => {
    try {
      // Open the document in the preview modal
      setSelectedDocument(document);
      setShowPreviewModal(true);
    } catch (error) {
      console.error('Error viewing document:', error);
      toast.error('Failed to view document');
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

  const getStatusInfo = () => {
    if (!bundle) return null;
    
    const { accessControl } = bundle;
    
    if (accessControl.expiryDate && new Date(accessControl.expiryDate) < new Date()) {
      return {
        type: 'error',
        icon: XCircleIcon,
        message: 'This QR bundle has expired',
        color: 'text-red-600 bg-red-50'
      };
    }
    
    if (accessControl.maxViews > 0 && accessControl.currentViews >= accessControl.maxViews) {
      return {
        type: 'error',
        icon: ExclamationTriangleIcon,
        message: 'This QR bundle has reached its view limit',
        color: 'text-orange-600 bg-orange-50'
      };
    }
    
    if (accessControl.publishDate && new Date(accessControl.publishDate) > new Date()) {
      return {
        type: 'warning',
        icon: ClockIcon,
        message: `This QR bundle will be available on ${format(new Date(accessControl.publishDate), 'MMM dd, yyyy HH:mm')}`,
        color: 'text-yellow-600 bg-yellow-50'
      };
    }
    
    return {
      type: 'success',
      icon: CheckCircleIcon,
      message: 'QR bundle is active and accessible',
      color: 'text-green-600 bg-green-50'
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading QR bundle...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (requiresPasscode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          {bundle?.accessControl?.showLockStatus && (
            <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-3">
                <LockClosedIcon className="h-8 w-8 text-orange-500" />
              </div>
              <h2 className="text-lg font-semibold text-orange-800 mb-1">🔒 Locked Document</h2>
              <p className="text-orange-700">This document requires a password to access its contents.</p>
            </div>
          )}
          <PasscodeEntry
            uuid={uuid}
            bundle={bundle}
            onSuccess={handlePasscodeVerified}
            onCancel={() => navigate('/')}
          />
        </div>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No bundle data available</p>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{bundle.title}</h1>
              {bundle.organization && (
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                  {bundle.organization.name}
                  {bundle.department && ` • ${bundle.department.name}`}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-center text-sm text-gray-500">
                <EyeIcon className="h-4 w-4 mr-1" />
                {bundle.accessControl.currentViews} views
                {bundle.accessControl.maxViews > 0 && ` of ${bundle.accessControl.maxViews}`}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Banner */}
        {statusInfo && (
          <div className={`mb-6 p-4 rounded-lg ${statusInfo.color}`}>
            <div className="flex items-center">
              <statusInfo.icon className="h-5 w-5 mr-3" />
              <p className="font-medium">{statusInfo.message}</p>
            </div>
          </div>
        )}

        {/* Description */}
        {bundle.description && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-3">Description</h2>
            <p className="text-gray-700">{bundle.description}</p>
          </div>
        )}

        {/* Custom Message */}
        {bundle.customMessage && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-blue-900 mb-3">Message</h2>
            <p className="text-blue-800">{bundle.customMessage}</p>
          </div>
        )}

        {/* Documents */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">
              Documents ({bundle.documents?.length || 0})
            </h2>
          </div>

          {bundle.documents && bundle.documents.length > 0 ? (
            <div className="space-y-4">
              {bundle.documents.map((document) => (
                <div key={document._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="text-2xl">{getFileIcon(document.fileType)}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {document.originalName}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          {document.fileSize && (
                            <span>{formatFileSize(document.fileSize)}</span>
                          )}
                          {document.fileType && (
                            <>
                              <span>•</span>
                              <span>{document.fileType}</span>
                            </>
                          )}
                        </div>
                        {document.description && (
                          <p className="text-sm text-gray-600 mt-2">{document.description}</p>
                        )}
                        {document.tags && document.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
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
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewDocument(document)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <EyeIcon className="h-4 w-4 mr-2" />
                        View
                      </button>
                      <button
                        onClick={() => handleDownloadDocument(document)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <DocumentIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No documents available in this bundle</p>
            </div>
          )}
        </div>

        {/* Bundle Info */}
        <div className="bg-white shadow rounded-lg p-6 mt-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Bundle Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Access Control</h3>
              <div className="space-y-1 text-gray-600">
                <div className="flex items-center">
                  {bundle.accessControl.isPublic ? (
                    <>
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                      <span>Public Access</span>
                    </>
                  ) : (
                    <>
                      <LockClosedIcon className="h-4 w-4 text-gray-500 mr-2" />
                      <span>Restricted Access</span>
                    </>
                  )}
                </div>
                {bundle.accessControl.hasPasscode && (
                  <div className="flex items-center">
                    <LockClosedIcon className="h-4 w-4 text-orange-500 mr-2" />
                    <span>Password Protected</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Dates</h3>
              <div className="space-y-1 text-gray-600">
                {bundle.accessControl.publishDate && (
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <span>Published: {format(new Date(bundle.accessControl.publishDate), 'MMM dd, yyyy')}</span>
                  </div>
                )}
                {bundle.accessControl.expiryDate && (
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <span>Expires: {format(new Date(bundle.accessControl.expiryDate), 'MMM dd, yyyy')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        document={selectedDocument}
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setSelectedDocument(null);
        }}
      />
    </div>
  );
};

export default QRScanView;


