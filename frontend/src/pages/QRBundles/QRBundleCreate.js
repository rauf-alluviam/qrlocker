import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  DocumentIcon,
  XMarkIcon,
  CalendarIcon,
  LockClosedIcon,
  GlobeAltIcon,
  EyeIcon,
  ClockIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import { toast } from 'react-toastify';

const QRBundleCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [availableDocuments, setAvailableDocuments] = useState([]);
  const [showDocumentSelector, setShowDocumentSelector] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    documents: [],
    isPublic: false,
    hasPasscode: false,
    expiryDate: '',
    publishDate: '',
    maxViews: '',
    customMessage: ''
  });
  const [errors, setErrors] = useState({});
  
  // Character limits
  const TITLE_MAX_LENGTH = 100;

  useEffect(() => {
    fetchAvailableDocuments();
  }, []);

  const fetchAvailableDocuments = async () => {
    try {
      const response = await api.get('/documents');
      setAvailableDocuments(response.data.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to fetch available documents');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? checked : value;
    
    // Apply character limits
    if (name === 'title' && value.length > TITLE_MAX_LENGTH) {
      newValue = value.substring(0, TITLE_MAX_LENGTH);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for comparison
    
    // Check required fields
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > TITLE_MAX_LENGTH) {
      newErrors.title = `Title must be ${TITLE_MAX_LENGTH} characters or less`;
    }
    
    if (formData.documents.length === 0) {
      newErrors.documents = 'Please select at least one document';
    }
    
    // Validate publish date
    if (formData.publishDate) {
      const publishDate = new Date(formData.publishDate);
      publishDate.setHours(0, 0, 0, 0);
      
      if (publishDate < today) {
        newErrors.publishDate = 'Publish date cannot be in the past';
      }
    }
    
    // Validate expiry date
    if (formData.expiryDate) {
      const expiryDate = new Date(formData.expiryDate);
      expiryDate.setHours(0, 0, 0, 0);
      
      if (expiryDate < today) {
        newErrors.expiryDate = 'Expiry date cannot be in the past';
      }
      
      // If both dates are set, expiry should be after publish
      if (formData.publishDate) {
        const publishDate = new Date(formData.publishDate);
        publishDate.setHours(0, 0, 0, 0);
        
        if (expiryDate <= publishDate) {
          newErrors.expiryDate = 'Expiry date must be after publish date';
        }
      }
    }
    
    // Validate max views
    if (formData.maxViews && (isNaN(formData.maxViews) || parseInt(formData.maxViews) <= 0)) {
      newErrors.maxViews = 'Max views must be a positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDocumentToggle = (document) => {
    const isSelected = formData.documents.includes(document._id);
    
    if (isSelected) {
      // Remove document
      setFormData(prev => ({
        ...prev,
        documents: prev.documents.filter(id => id !== document._id)
      }));
      setDocuments(prev => prev.filter(doc => doc._id !== document._id));
    } else {
      // Add document only if it's not already present (prevent duplicates)
      if (!formData.documents.includes(document._id)) {
        setFormData(prev => ({
          ...prev,
          documents: [...prev.documents, document._id]
        }));
        setDocuments(prev => [...prev, document]);
      } else {
        toast.warn('Document is already added to this QR bundle');
      }
    }
  };

  const removeDocument = (documentId) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter(id => id !== documentId)
    }));
    setDocuments(prev => prev.filter(doc => doc._id !== documentId));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        documents: formData.documents,
        isPublic: formData.isPublic,
        hasPasscode: formData.hasPasscode,
        customMessage: formData.customMessage.trim(),
        ...(formData.expiryDate && { expiryDate: formData.expiryDate }),
        ...(formData.publishDate && { publishDate: formData.publishDate }),
        ...(formData.maxViews && { maxViews: parseInt(formData.maxViews) })
      };

      const response = await api.post('/qr', submitData);
      
      const qrBundle = response.data;
      
      // Show appropriate message based on whether QR bundle was reused or created
      if (qrBundle.reused) {
        toast.success('QR bundle created successfully! Using existing QR code with updated timestamp.');
      } else {
        toast.success('QR bundle created successfully!');
      }
      
      navigate(`/qr-bundles/${qrBundle._id}`);
      
    } catch (error) {
      console.error('Error creating QR bundle:', error);
      toast.error(error.response?.data?.message || 'Failed to create QR bundle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => navigate('/qr-bundles')}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create QR Bundle</h1>
            <p className="mt-2 text-gray-600">Create a new QR code bundle for sharing documents</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title * ({formData.title.length}/{TITLE_MAX_LENGTH})
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                maxLength={TITLE_MAX_LENGTH}
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter a descriptive title for your QR bundle"
                className={`mt-1 block w-full border rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Add a description for your QR bundle (optional)"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label htmlFor="customMessage" className="block text-sm font-medium text-gray-700">
                Custom Message
              </label>
              <textarea
                id="customMessage"
                name="customMessage"
                rows={2}
                value={formData.customMessage}
                onChange={handleInputChange}
                placeholder="Custom message to display when QR code is scanned (optional)"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Document Selection */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Documents ({documents.length})</h3>
            <button
              type="button"
              onClick={() => setShowDocumentSelector(!showDocumentSelector)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Documents
            </button>
          </div>
          
          {errors.documents && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.documents}</p>
            </div>
          )}

          {/* Selected Documents */}
          {documents.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Selected Documents</h4>
              <div className="space-y-2">
                {documents.map((document) => (
                  <div key={document._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-lg">{getFileIcon(document.fileType)}</div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{document.originalName}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(document.fileSize)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDocument(document._id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document Selector */}
          {showDocumentSelector && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Available Documents</h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {availableDocuments.map((document) => (
                  <div key={document._id} className="flex items-center p-2 hover:bg-gray-50 rounded">                  <input
                    type="checkbox"
                    checked={formData.documents.includes(document._id)}
                    onChange={() => handleDocumentToggle(document)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-3"
                  />
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="text-lg">{getFileIcon(document.fileType)}</div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{document.originalName}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(document.fileSize)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {documents.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <DocumentIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No documents selected</p>
              <p className="text-sm">Click "Add Documents" to select documents for this bundle</p>
            </div>
          )}
        </div>

        {/* Access Control */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Access Control</h3>
          
          <div className="space-y-6">
            {/* Public Access */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="isPublic"
                  name="isPublic"
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="isPublic" className="text-sm font-medium text-gray-700 flex items-center">
                  <GlobeAltIcon className="h-4 w-4 mr-2" />
                  Public Access
                </label>
                <p className="text-sm text-gray-500">Anyone with the QR code can access the documents</p>
              </div>
            </div>

            {/* Password Protection */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="hasPasscode"
                  name="hasPasscode"
                  type="checkbox"
                  checked={formData.hasPasscode}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="hasPasscode" className="text-sm font-medium text-gray-700 flex items-center">
                  <LockClosedIcon className="h-4 w-4 mr-2" />
                  Password Protection
                </label>
                <p className="text-sm text-gray-500">A random passcode will be generated and required for access</p>
              </div>
            </div>

            {/* Date Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="publishDate" className="block text-sm font-medium text-gray-700">
                  Publish Date
                </label>
                <input
                  type="datetime-local"
                  id="publishDate"
                  name="publishDate"
                  value={formData.publishDate}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full border rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.publishDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <p className="mt-1 text-xs text-gray-500">When the QR bundle becomes available</p>
                {errors.publishDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.publishDate}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">
                  Expiry Date
                </label>
                <input
                  type="datetime-local"
                  id="expiryDate"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full border rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.expiryDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <p className="mt-1 text-xs text-gray-500">When the QR bundle expires (optional)</p>
                {errors.expiryDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.expiryDate}</p>
                )}
              </div>
            </div>

            {/* View Limit */}
            <div>
              <label htmlFor="maxViews" className="block text-sm font-medium text-gray-700">
                Maximum Views
              </label>
              <input
                type="number"
                id="maxViews"
                name="maxViews"
                min="0"
                value={formData.maxViews}
                onChange={handleInputChange}
                placeholder="0 = unlimited"
                className={`mt-1 block w-full border rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.maxViews ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              <p className="mt-1 text-xs text-gray-500">Limit the number of times this bundle can be viewed (0 for unlimited)</p>
              {errors.maxViews && (
                <p className="mt-1 text-sm text-red-600">{errors.maxViews}</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/qr-bundles')}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || formData.documents.length === 0}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create QR Bundle'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QRBundleCreate;
