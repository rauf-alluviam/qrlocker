import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  TagIcon,
  CheckIcon,
  XCircleIcon,
  DocumentTextIcon,
  QrCodeIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const InternalRequestDetailsModal = ({ isOpen, onClose, requestId, onRequestUpdated }) => {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [responseLoading, setResponseLoading] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseData, setResponseData] = useState({
    status: 'accepted',
    responseMessage: '',
    qrBundleId: ''
  });
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  const [userQrBundles, setUserQrBundles] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    if (isOpen && requestId) {
      fetchRequestDetails();
      fetchUserQrBundles();
      setCurrentUserId(getCurrentUserId());
    }
  }, [isOpen, requestId]);

  const getCurrentUserId = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id;
    } catch (error) {
      return null;
    }
  };

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/internal-requests/${requestId}`);
      setRequest(response.data);
    } catch (error) {
      console.error('Error fetching request:', error);
      toast.error('Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserQrBundles = async () => {
    try {
      const response = await api.get('/qr/me');
      setUserQrBundles(response.data.qrBundles || []);
    } catch (error) {
      console.error('Error fetching QR bundles:', error);
    }
  };

  const handleResponse = async (e) => {
    e.preventDefault();
    
    if (!responseData.responseMessage.trim()) {
      toast.error('Please provide a response message');
      return;
    }

    if (responseData.status === 'accepted' && (!files || files.length === 0) && !responseData.qrBundleId) {
      toast.error('Please upload a document or select a QR bundle');
      return;
    }

    try {
      setResponseLoading(true);
      const formData = new FormData();
      formData.append('status', responseData.status);
      formData.append('responseMessage', responseData.responseMessage);
      
      // Set the progress handler
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: progressEvent => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(prev => ({
            ...prev,
            overall: percentCompleted
          }));
        }
      };
      
      if (responseData.status === 'accepted') {
        // Add files to the formData
        if (files && files.length > 0) {
          files.forEach(fileObj => {
            formData.append('documents', fileObj.file);
          });
        }
        
        // Add QR bundle ID if selected
        if (responseData.qrBundleId) {
          formData.append('qrBundleId', responseData.qrBundleId);
        }
      }

      const response = await api.post(`/internal-requests/${requestId}/respond`, formData, config);
      console.log(response);
      toast.success('Response sent successfully!');
      setRequest(response.data.request);
      setShowResponseForm(false);
      setResponseData({ status: 'accepted', responseMessage: '', qrBundleId: '' });
      setFiles([]);
      
      if (onRequestUpdated) {
        onRequestUpdated(response.data.request);
      }
    } catch (error) {
      console.error('Error sending response:', error);
      toast.error(error.response?.data?.message || 'Failed to send response');
    } finally {
      setResponseLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-green-600 bg-green-100',
      medium: 'text-yellow-600 bg-yellow-100',
      high: 'text-orange-600 bg-orange-100',
      urgent: 'text-red-600 bg-red-100'
    };
    return colors[priority] || colors.medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-100',
      accepted: 'text-green-600 bg-green-100',
      declined: 'text-red-600 bg-red-100',
      partially_fulfilled: 'text-blue-600 bg-blue-100',
      fulfilled: 'text-green-600 bg-green-100',
      cancelled: 'text-gray-600 bg-gray-100'
    };
    return colors[status] || colors.pending;
  };

  const isRecipient = () => {
    return request?.recipients?.some(recipient => recipient._id === currentUserId);
  };

  const hasUserResponded = () => {
    return request?.responses?.some(response => 
      response.recipient._id === currentUserId && response.status !== 'pending'
    );
  };

  const getUserResponse = () => {
    return request?.responses?.find(response => response.recipient._id === currentUserId);
  };

  if (!isOpen) return null;
  

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white m-4">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h3 className="text-xl font-medium text-gray-900">Request Details</h3>
            {request && (
              <div className="flex items-center space-x-3 mt-2">
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                  {request.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                  {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)} Priority
                </span>
                {request.isUrgent && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-red-600 bg-red-100">
                    <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                    Urgent
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : request ? (
          <div className="space-y-6">
            {/* Request Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">{request.requestTitle}</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <UserIcon className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Requested by</p>
                    <p className="text-sm text-gray-900">{request.requester.name} ({request.requester.email})</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Created</p>
                    <p className="text-sm text-gray-900">{formatDate(request.createdAt)}</p>
                  </div>
                </div>

                {request.dueDate && (
                  <div className="flex items-center space-x-2">
                    <ClockIcon className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Due Date</p>
                      <p className={`text-sm ${request.isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                        {formatDate(request.dueDate)}
                        {request.isOverdue && ' (Overdue)'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Category</p>
                    <p className="text-sm text-gray-900">
                      {request.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Description</h5>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{request.requestDescription}</p>
              </div>

              {request.tags && request.tags.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Tags</h5>
                  <div className="flex flex-wrap gap-2">
                    {request.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        <TagIcon className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Recipients and Responses */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Recipients & Responses ({request.recipients.length})
              </h4>
              
              <div className="space-y-4">
                {request.responses.map((response, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <UserIcon className="h-5 w-5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {response.recipient.name} ({response.recipient.email})
                          </span>
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(response.status)}`}>
                            {response.status.charAt(0).toUpperCase() + response.status.slice(1)}
                          </span>
                        </div>
                        
                        {response.responseMessage && (
                          <p className="text-sm text-gray-700 mb-2">{response.responseMessage}</p>
                        )}
                        
                        {response.sharedQrBundle && (
                          <div className="bg-green-50 border border-green-200 rounded-md p-3">
                            <div className="flex items-center space-x-2">
                              <QrCodeIcon className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-green-800">
                                Shared QR Bundle: {response.sharedQrBundle.title}
                              </span>
                            </div>
                            {response.sharedQrBundle.qrCodeUrl && (
                              <div className="mt-2 text-center">
                                <img
                                  src={response.sharedQrBundle.qrCodeUrl}
                                  alt="QR Code"
                                  className="h-24 w-24 mx-auto border border-gray-300 rounded"
                                />
                              </div>
                            )}
                          </div>
                        )}
                        
                        {response.respondedAt && (
                          <p className="text-xs text-gray-500 mt-2">
                            Responded on {formatDate(response.respondedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Response Form for Recipients */}
            {isRecipient() && !hasUserResponded() && request.status === 'pending' && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Your Response</h4>
                
                {!showResponseForm ? (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setResponseData({ ...responseData, status: 'accepted' });
                        setShowResponseForm(true);
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Accept Request
                    </button>
                    <button
                      onClick={() => {
                        setResponseData({ ...responseData, status: 'declined' });
                        setShowResponseForm(true);
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <XCircleIcon className="h-4 w-4 mr-2" />
                      Decline Request
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleResponse} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Response Message *
                      </label>
                      <textarea
                        value={responseData.responseMessage}
                        onChange={(e) => setResponseData({ ...responseData, responseMessage: e.target.value })}
                        rows={3}
                        required
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder={`Explain why you are ${responseData.status === 'accepted' ? 'accepting' : 'declining'} this request...`}
                      />
                    </div>

                    {responseData.status === 'accepted' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Upload Documents *
                          </label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-indigo-500 transition-colors relative">
                            <div className="text-center">
                              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                              <div className="mt-2 relative">
                                <input
                                  type="file"
                                  name="document-upload"
                                  aria-label="Upload document"
                                  onChange={(e) => {
                                    const newFiles = Array.from(e.target.files).map(file => ({
                                      file,
                                      id: Math.random().toString(36).substr(2, 9),
                                      progress: 0,
                                      status: 'pending'
                                    }));
                                    setFiles(prev => [...prev, ...newFiles]);
                                  }}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  id="file-upload"
                                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,image/*"
                                />
                                <label
                                  htmlFor="file-upload"
                                  className="cursor-pointer"
                                >
                                  <span className="text-indigo-600 hover:text-indigo-500">Click to upload</span>
                                  <span className="text-gray-500"> or drag and drop</span>
                                </label>
                                <p className="text-xs text-gray-500">
                                  Upload a PDF, Word, Excel, PowerPoint, Image, or Text file (up to 50MB)
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* File List */}
                          {files.length > 0 && (
                            <div className="mt-4 space-y-2">
                              {files.map((fileObj) => (
                                <div
                                  key={fileObj.id}
                                  className="flex items-center p-3 border border-gray-200 rounded-lg"
                                >
                                  <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {fileObj.file.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {formatFileSize(fileObj.file.size)}
                                    </p>
                                    {uploadProgress[fileObj.id] && (
                                      <div className="mt-1">
                                        <div className="bg-gray-200 rounded-full h-2">
                                          <div
                                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${uploadProgress[fileObj.id]}%` }}
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFiles(files => files.filter(f => f.id !== fileObj.id));
                                    }}
                                    className="ml-2 text-gray-400 hover:text-red-500"
                                  >
                                    <XMarkIcon className="h-5 w-5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Share QR Bundle (Optional)
                          </label>
                          <select
                            value={responseData.qrBundleId}
                            onChange={(e) => setResponseData(prev => ({
                              ...prev,
                              qrBundleId: e.target.value
                            }))}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          >
                            <option value="">Select a QR bundle to share (optional)</option>
                            {userQrBundles.map((bundle) => (
                              <option key={bundle._id} value={bundle._id}>
                                {bundle.title} ({bundle.documents?.length || 0} documents)
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            Optionally share an existing QR bundle from your library
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"                          onClick={() => {
                          setShowResponseForm(false);
                          setResponseData({ status: 'accepted', responseMessage: '', qrBundleId: '' });
                          setFiles([]);
                        }}
                        disabled={responseLoading}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={responseLoading}
                        className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                          responseData.status === 'accepted'
                            ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                            : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                        }`}
                      >
                        {responseLoading ? 'Sending...' : `${responseData.status === 'accepted' ? 'Accept' : 'Decline'} Request`}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* User's Response (if already responded) */}
            {isRecipient() && hasUserResponded() && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Your Response</h4>
                {(() => {
                  const userResponse = getUserResponse();
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-sm font-medium ${getStatusColor(userResponse.status)}`}>
                          {userResponse.status.charAt(0).toUpperCase() + userResponse.status.slice(1)}
                        </span>
                        <span className="text-sm text-gray-500">
                          Responded on {formatDate(userResponse.respondedAt)}
                        </span>
                      </div>
                      {userResponse.responseMessage && (
                        <p className="text-sm text-gray-700">{userResponse.responseMessage}</p>
                      )}
                      {userResponse.sharedQrBundle && (
                        <div className="bg-green-50 border border-green-200 rounded-md p-3">
                          <div className="flex items-center space-x-2">
                            <QrCodeIcon className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">
                              You shared: {userResponse.sharedQrBundle.title}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Request not found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InternalRequestDetailsModal;
