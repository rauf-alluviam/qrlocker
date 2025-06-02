import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import QRCode from 'qrcode.react';
import { 
  ArrowLeftIcon,
  DocumentIcon,
  ShareIcon,
  TrashIcon,
  PencilIcon,
  QrCodeIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  ClockIcon,
  LockClosedIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  Cog6ToothIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import QRAdvancedSettings from '../../components/QRBundles/QRAdvancedSettings';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const QRBundleView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanLogs, setScanLogs] = useState([]);
  const [showQRCode, setShowQRCode] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBundle();
      fetchScanLogs();
    }
  }, [id]);

  const fetchBundle = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/qr/${id}`);
      setBundle(response.data);
    } catch (error) {
      console.error('Error fetching bundle:', error);
      toast.error('Failed to fetch QR bundle details');
      navigate('/qr-bundles');
    } finally {
      setLoading(false);
    }
  };

  const fetchScanLogs = async () => {
    try {
      const response = await api.get(`/qr/${id}/scan-logs`);
      setScanLogs(response.data.scanLogs || []);
    } catch (error) {
      console.error('Error fetching scan logs:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this QR bundle?')) {
      return;
    }

    try {
      await api.delete(`/qr/${id}`);
      toast.success('QR bundle deleted successfully');
      navigate('/qr-bundles');
    } catch (error) {
      console.error('Error deleting bundle:', error);
      toast.error('Failed to delete QR bundle');
    }
  };

  const handleDownloadQR = () => {
    const canvas = document.querySelector('#qr-code canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `qr-bundle-${bundle.title}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  };

  const getStatusBadge = () => {
    if (!bundle) return null;
    
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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
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

  if (!bundle) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">QR Bundle Not Found</h1>
          <p className="mt-2 text-gray-600">The requested QR bundle could not be found.</p>
        </div>
      </div>
    );
  }

  // Include the hmacSignature to ensure the QR code works with the backend validation
  const qrCodeUrl = bundle.hmacSignature 
    ? `${window.location.origin}/scan/${bundle.uuid}?sig=${bundle.hmacSignature}` 
    : `${window.location.origin}/scan/${bundle.uuid}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => navigate('/qr-bundles')}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-gray-900">{bundle.title}</h1>
              {getStatusBadge()}
            </div>
            <p className="mt-2 text-gray-600">{bundle.description}</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowQRCode(!showQRCode)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <QrCodeIcon className="h-4 w-4 mr-2" />
              {showQRCode ? 'Hide QR' : 'Show QR'}
            </button>
            {(user?.role === 'admin' || user?.role === 'supervisor' || user?.role === 'manager' || user?.role === 'user' || bundle.creator._id === user?._id) && (
              <>
                <button
                  onClick={() => setShowSettings(true)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50"
                >
                  <Cog6ToothIcon className="h-4 w-4 mr-2" />
                  QR Settings
                </button>
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* QR Code Display */}
          {showQRCode && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-4">QR Code</h3>
                <div id="qr-code" className="flex justify-center mb-4">
                  <QRCode
                    value={qrCodeUrl}
                    size={200}
                    level="M"
                    includeMargin={true}
                  />
                </div>
                <div className="space-x-2">
                  <button
                    onClick={handleDownloadQR}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                    Download
                  </button>
                  <button
                    onClick={() => copyToClipboard(qrCodeUrl)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <ShareIcon className="h-4 w-4 mr-2" />
                    Copy Link
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {qrCodeUrl}
                </p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white shadow rounded-lg">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'details'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'documents'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Documents ({bundle.documents?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'activity'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Activity ({scanLogs.length})
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* Details Tab */}
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {bundle.customMessage && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Custom Message</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                        {bundle.customMessage}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Access Control</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          {bundle.accessControl.isPublic ? (
                            <>
                              <GlobeAltIcon className="h-4 w-4 text-blue-500 mr-2" />
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
                        {bundle.accessControl.hasPasscode && bundle.accessControl.showLockStatus && (
                          <div className="flex items-center">
                            <ShieldCheckIcon className="h-4 w-4 text-orange-500 mr-2" />
                            <span>Shows Lock Status on Scan</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <EyeIcon className="h-4 w-4 text-gray-500 mr-2" />
                          <span>
                            {bundle.accessControl.currentViews} views
                            {bundle.accessControl.maxViews > 0 && ` / ${bundle.accessControl.maxViews} max`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Dates</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 text-gray-500 mr-2" />
                          <span>Created: {bundle.createdAt ? format(new Date(bundle.createdAt), 'MMM dd, yyyy HH:mm') : 'N/A'}</span>
                        </div>
                        {bundle.accessControl.publishDate && (
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 text-green-500 mr-2" />
                            <span>Published: {bundle.accessControl.publishDate ? format(new Date(bundle.accessControl.publishDate), 'MMM dd, yyyy HH:mm') : 'N/A'}</span>
                          </div>
                        )}
                        {bundle.accessControl.expiryDate && (
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 text-red-500 mr-2" />
                            <span>Expires: {bundle.accessControl.expiryDate ? format(new Date(bundle.accessControl.expiryDate), 'MMM dd, yyyy HH:mm') : 'N/A'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Documents Tab */}
              {activeTab === 'documents' && (
                <div>
                  {bundle.documents && bundle.documents.length > 0 ? (
                    <div className="space-y-3">
                      {bundle.documents.map((document) => (
                        <div key={document._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="text-lg">{getFileIcon(document.fileType)}</div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{document.originalName}</p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(document.fileSize)} {document.createdAt ? `• ${format(new Date(document.createdAt), 'MMM dd, yyyy')}` : ''}
                              </p>
                            </div>
                          </div>
                          <Link
                            to={`/documents/${document._id}`}
                            className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <DocumentIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No documents in this bundle</p>
                    </div>
                  )}
                </div>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <div>
                  {scanLogs.length > 0 ? (
                    <div className="space-y-3">
                      {scanLogs.map((log, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <QrCodeIcon className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">QR Code Scanned</p>
                              <p className="text-xs text-gray-500">
                                {log.scannedAt ? format(new Date(log.scannedAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">IP: {log.ipAddress}</p>
                            {log.userAgent && (
                              <p className="text-xs text-gray-500 truncate max-w-xs">
                                {log.userAgent}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <ClockIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No activity recorded yet</p>
                      <p className="text-sm">Scan activity will appear here</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Bundle Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Bundle Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center">
                <UserIcon className="h-4 w-4 text-gray-500 mr-2" />
                <span>Created by {bundle.creator?.name}</span>
              </div>
              <div className="flex items-center">
                <BuildingOfficeIcon className="h-4 w-4 text-gray-500 mr-2" />
                <span>{bundle.organization?.name}</span>
              </div>
              {bundle.department && (
                <div className="flex items-center">
                  <BuildingOfficeIcon className="h-4 w-4 text-gray-500 mr-2" />
                  <span>{bundle.department.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total Documents</span>
                <span className="text-sm font-medium">{bundle.documents?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total Views</span>
                <span className="text-sm font-medium">{bundle.accessControl.currentViews}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total Scans</span>
                <span className="text-sm font-medium">{scanLogs.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Settings Modal */}
      {showSettings && (
        <QRAdvancedSettings 
          bundle={bundle}
          onClose={() => setShowSettings(false)}
          onUpdate={(updatedBundle) => {
            setBundle(updatedBundle);
          }}
        />
      )}
    </div>
  );
};

export default QRBundleView;
