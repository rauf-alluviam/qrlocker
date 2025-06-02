import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  CloudArrowUpIcon, 
  XMarkIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

const RequestResponseModal = ({ 
  request, 
  isOpen, 
  onClose, 
  onSubmit 
}) => {
  const [responseType, setResponseType] = useState('documents'); // 'documents' or 'qr'
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [formData, setFormData] = useState({
    responseMessage: '',
    status: 'approved',
    qrBundleId: ''
  });
  const [availableQRBundles, setAvailableQRBundles] = useState([]);

  // Mock QR bundles - replace with actual API call
  React.useEffect(() => {
    if (isOpen && responseType === 'qr') {
      // Fetch available QR bundles
      setAvailableQRBundles([
        { _id: '1', title: 'Legal Documents Bundle', documentCount: 5 },
        { _id: '2', title: 'Financial Reports Bundle', documentCount: 3 },
        { _id: '3', title: 'Contract Bundle', documentCount: 7 }
      ]);
    }
  }, [isOpen, responseType]);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    rejectedFiles.forEach((file) => {
      if (file.errors.some(error => error.code === 'file-too-large')) {
        toast.error(`File ${file.file.name} is too large. Maximum size is 50MB.`);
      } else if (file.errors.some(error => error.code === 'file-invalid-type')) {
        toast.error(`File ${file.file.name} has an invalid type.`);
      }
    });

    // Add accepted files to the list
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      progress: 0,
      status: 'pending'
    }));

    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'image/*': ['.png', '.gif', '.jpeg', '.jpg'],
      'text/plain': ['.txt'],
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true
  });

  const removeFile = (fileId) => {
    setFiles(files => {
      const fileToRemove = files.find(f => f.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return files.filter(f => f.id !== fileId);
    });
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
    if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
    return '📁';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    
    if (formData.status === 'rejected') {
      // For rejection, just send the response message
      await onSubmit({
        responseMessage: formData.responseMessage,
        status: 'rejected'
      });
      return;
    }

    if (responseType === 'documents' && files.length === 0) {
      toast.error('Please select at least one file to upload');
      return;
    }

    if (responseType === 'qr' && !formData.qrBundleId) {
      toast.error('Please select a QR bundle');
      return;
    }

    setUploading(true);

    try {
      const formDataToSend = new FormData();
      
      // Add response message and status
      formDataToSend.append('responseMessage', formData.responseMessage);
      formDataToSend.append('status', formData.status);

      if (responseType === 'documents') {
        // Add files to FormData
        files.forEach((fileObj) => {
          formDataToSend.append('documents', fileObj.file);
        });
      } else if (responseType === 'qr') {
        // Add QR bundle ID
        formDataToSend.append('qrBundleId', formData.qrBundleId);
      }

      // Call the parent submit handler
      await onSubmit(formDataToSend, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress({ overall: percentCompleted });
        },
      });

      // Update file statuses on success
      if (responseType === 'documents') {
        setFiles(files => files.map(file => ({
          ...file,
          status: 'completed',
          progress: 100
        })));
      }

      toast.success('Response sent successfully');
      
      // Close modal after delay
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Error responding to request:', error);
      toast.error('Failed to send response');
      
      // Update file statuses to error
      if (responseType === 'documents') {
        setFiles(files => files.map(file => ({
          ...file,
          status: 'error'
        })));
      }
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Respond to Document Request
                </h3>
                
                {/* Request Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-900">Request Details</h4>
                  <p className="text-sm text-gray-600 mt-1">From: {request?.requesterEmail}</p>
                  <p className="text-sm text-gray-600">Subject: {request?.subject}</p>
                  <p className="text-sm text-gray-600 mt-2">{request?.message}</p>
                </div>

                <div className="space-y-6">
                  {/* Response Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Response Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                      disabled={uploading}
                    >
                      <option value="approved">Approved</option>
                      <option value="fulfilled">Fulfilled</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  {/* Response Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Response Message
                    </label>
                    <textarea
                      name="responseMessage"
                      rows={3}
                      value={formData.responseMessage}
                      onChange={handleInputChange}
                      placeholder="Enter your response message..."
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                      disabled={uploading}
                      required
                    />
                  </div>

                  {/* Only show document/QR options for approved/fulfilled requests */}
                  {(formData.status === 'approved' || formData.status === 'fulfilled') && (
                    <>
                      {/* Response Type Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          How would you like to respond?
                        </label>
                        <div className="flex space-x-4">
                          <button
                            type="button"
                            onClick={() => setResponseType('documents')}
                            className={`flex items-center px-4 py-2 rounded-lg border ${
                              responseType === 'documents'
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                            disabled={uploading}
                          >
                            <DocumentTextIcon className="h-5 w-5 mr-2" />
                            Upload Documents
                          </button>
                          <button
                            type="button"
                            onClick={() => setResponseType('qr')}
                            className={`flex items-center px-4 py-2 rounded-lg border ${
                              responseType === 'qr'
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                            disabled={uploading}
                          >
                            <QrCodeIcon className="h-5 w-5 mr-2" />
                            Share QR Bundle
                          </button>
                        </div>
                      </div>

                      {/* Document Upload Section */}
                      {responseType === 'documents' && (
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h4 className="text-md font-medium text-gray-900 mb-4">Upload Documents</h4>
                          
                          <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                              isDragActive
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            <input {...getInputProps()} />
                            <CloudArrowUpIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            {isDragActive ? (
                              <p className="text-sm text-indigo-600">Drop the files here...</p>
                            ) : (
                              <div>
                                <p className="text-sm text-gray-600 mb-1">
                                  Drag & drop files here, or click to select
                                </p>
                                <p className="text-xs text-gray-500">
                                  PDF, Word, Excel, PowerPoint, Images (max 50MB each)
                                </p>
                              </div>
                            )}
                          </div>

                          {/* File List */}
                          {files.length > 0 && (
                            <div className="mt-4">
                              <div className="space-y-2">
                                {files.map((fileObj) => (
                                  <div
                                    key={fileObj.id}
                                    className="flex items-center p-2 border border-gray-200 rounded"
                                  >
                                    <div className="flex-shrink-0 text-lg">
                                      {getFileIcon(fileObj.file.type)}
                                    </div>
                                    
                                    <div className="ml-2 flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {fileObj.file.name}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {formatFileSize(fileObj.file.size)}
                                      </p>
                                      
                                      {/* Progress bar */}
                                      {fileObj.status === 'uploading' && (
                                        <div className="mt-1">
                                          <div className="bg-gray-200 rounded-full h-1">
                                            <div
                                              className="bg-indigo-600 h-1 rounded-full transition-all duration-300"
                                              style={{ width: `${fileObj.progress}%` }}
                                            />
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Status indicators */}
                                      {fileObj.status === 'completed' && (
                                        <div className="flex items-center mt-1 text-green-600">
                                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                                          <span className="text-xs">Uploaded</span>
                                        </div>
                                      )}
                                      
                                      {fileObj.status === 'error' && (
                                        <div className="flex items-center mt-1 text-red-600">
                                          <XMarkIcon className="h-3 w-3 mr-1" />
                                          <span className="text-xs">Failed</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {!uploading && fileObj.status !== 'completed' && (
                                      <button
                                        type="button"
                                        onClick={() => removeFile(fileObj.id)}
                                        className="ml-2 p-1 text-gray-400 hover:text-red-600"
                                      >
                                        <XMarkIcon className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* QR Bundle Selection */}
                      {responseType === 'qr' && (
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h4 className="text-md font-medium text-gray-900 mb-4">Select QR Bundle</h4>
                          
                          <select
                            name="qrBundleId"
                            value={formData.qrBundleId}
                            onChange={handleInputChange}
                            className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={uploading}
                          >
                            <option value="">Select a QR bundle...</option>
                            {availableQRBundles.map((bundle) => (
                              <option key={bundle._id} value={bundle._id}>
                                {bundle.title} ({bundle.documentCount} documents)
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </>
                  )}

                  {/* Upload Progress */}
                  {uploading && uploadProgress.overall !== undefined && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="text-md font-medium text-gray-900 mb-2">Sending Response...</h4>
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress.overall}%` }}
                        />
                      </div>
                      <p className="mt-1 text-sm text-gray-600 text-center">
                        {uploadProgress.overall}% completed
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={uploading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Sending...' : 'Send Response'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Example usage component
const DocumentRequestsList = () => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock request data
  const mockRequest = {
    _id: '683d45962efa7b009777585e',
    requesterEmail: 'john.doe@example.com',
    subject: 'Request for Financial Documents',
    message: 'I need access to the quarterly financial reports for Q3 2024. This is required for our audit process.',
    status: 'pending'
  };

  const handleRespondClick = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const handleSubmitResponse = async (formDataOrObject, options = {}) => {
    try {
      // Simulate API call
      console.log('Submitting response:', formDataOrObject);
      
      // Replace this with your actual API call
      const response = await fetch(`/api/internal-requests/${selectedRequest._id}/respond`, {
        method: 'POST',
        body: formDataOrObject,
        ...options
      });

      if (!response.ok) {
        throw new Error('Failed to send response');
      }

      const result = await response.json();
      console.log('Response sent successfully:', result);
      
      // Close modal and refresh data
      setIsModalOpen(false);
      setSelectedRequest(null);
      
    } catch (error) {
      console.error('Error sending response:', error);
      throw error; // Re-throw to be handled by the modal
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Document Requests</h1>
      
      {/* Request Card */}
      <div className="bg-white shadow rounded-lg p-6 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{mockRequest.subject}</h3>
            <p className="text-sm text-gray-600 mt-1">From: {mockRequest.requesterEmail}</p>
            <p className="text-gray-700 mt-2">{mockRequest.message}</p>
            <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full mt-3">
              {mockRequest.status}
            </span>
          </div>
          <button
            onClick={() => handleRespondClick(mockRequest)}
            className="ml-4 px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
          >
            Respond
          </button>
        </div>
      </div>

      {/* Response Modal */}
      <RequestResponseModal
        request={selectedRequest}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitResponse}
      />
    </div>
  );
};

export default DocumentRequestsList;