import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { 
  CloudArrowUpIcon, 
  XMarkIcon,
  ArrowLeftIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import { toast } from 'react-toastify';

const DocumentUpload = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [formData, setFormData] = useState({
    description: '',
    tags: ''
  });

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
      status: 'pending' // pending, uploading, completed, error
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

  const uploadFiles = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one file to upload');
      return;
    }

    setUploading(true);

    try {
      const formDataToSend = new FormData();
      
      // Add files to FormData
      files.forEach((fileObj) => {
        formDataToSend.append('documents', fileObj.file);
      });

      // Add metadata
      if (formData.description) {
        formDataToSend.append('description', formData.description);
      }
      
      if (formData.tags) {
        const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        formDataToSend.append('tags', JSON.stringify(tagsArray));
      }

      // Upload with progress tracking
      const response = await api.post('/documents/upload', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress({ overall: percentCompleted });
        },
      });

      // Handle any errors in the response first
      let duplicateCount = 0;
      let otherErrorCount = 0;
      
      if (response.data.errors && response.data.errors.length > 0) {
        response.data.errors.forEach(error => {
          // Check if it's a duplicate document error
          if (error.includes('You have already uploaded this document')) {
            duplicateCount++;
            toast.warning(error);
          } else {
            otherErrorCount++;
            toast.error(error);
          }
        });
      }

      // Show appropriate success/info messages
      if (response.data.totalUploaded > 0) {
        toast.success(`Successfully uploaded ${response.data.totalUploaded} document(s)`);
      }
      
      // If no documents were uploaded due to duplicates only
      if (response.data.totalUploaded === 0 && duplicateCount > 0 && otherErrorCount === 0) {
        toast.info(`${duplicateCount} document(s) were skipped because they already exist in your library`);
      }
      
      // Update file statuses
      setFiles(files => files.map(file => ({
        ...file,
        status: 'completed',
        progress: 100
      })));

      // Navigate back to documents list after a short delay if there were successful uploads
      if (response.data.totalUploaded > 0) {
        setTimeout(() => {
          navigate('/documents');
        }, 2000);
      }

    } catch (error) {
      console.error('Error uploading files:', error);
      
      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        const { status, data } = error.response;
        
        if (status === 400 && data.errors) {
          // Handle validation errors from backend
          data.errors.forEach(errorMsg => {
            if (errorMsg.includes('You have already uploaded this document')) {
              toast.warning(errorMsg);
            } else {
              toast.error(errorMsg);
            }
          });
        } else if (data.message) {
          toast.error(data.message);
        } else {
          toast.error('Upload failed. Please try again.');
        }
      } else if (error.request) {
        // Network error
        toast.error('Network error. Please check your connection and try again.');
      } else {
        // Other error
        toast.error('An unexpected error occurred. Please try again.');
      }
      
      // Update file statuses to error
      setFiles(files => files.map(file => ({
        ...file,
        status: 'error'
      })));
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    uploadFiles();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => navigate('/documents')}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Upload Documents</h1>
            <p className="mt-2 text-gray-600">Upload new documents to your organization</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* File Upload Area */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Select Files</h3>
          
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-lg text-indigo-600">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-lg text-gray-600 mb-2">
                  Drag & drop files here, or click to select files
                </p>
                <p className="text-sm text-gray-500">
                  Supports PDF, Word, Excel, PowerPoint, Images, Text files, and Archives (max 50MB each)
                </p>
              </div>
            )}
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">
                Selected Files ({files.length})
              </h4>
              <div className="space-y-3">
                {files.map((fileObj) => (
                  <div
                    key={fileObj.id}
                    className="flex items-center p-3 border border-gray-200 rounded-lg"
                  >
                    {fileObj.preview ? (
                      <img
                        src={fileObj.preview}
                        alt={fileObj.file.name}
                        className="h-10 w-10 object-cover rounded"
                      />
                    ) : (
                      <div className="h-10 w-10 flex items-center justify-center text-xl">
                        {getFileIcon(fileObj.file.type)}
                      </div>
                    )}
                    
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {fileObj.file.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(fileObj.file.size)}
                      </p>
                      
                      {/* Progress bar */}
                      {fileObj.status === 'uploading' && (
                        <div className="mt-2">
                          <div className="bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${fileObj.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Status indicators */}
                      {fileObj.status === 'completed' && (
                        <div className="flex items-center mt-1 text-green-600">
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          <span className="text-xs">Uploaded successfully</span>
                        </div>
                      )}
                      
                      {fileObj.status === 'error' && (
                        <div className="flex items-center mt-1 text-red-600">
                          <XMarkIcon className="h-4 w-4 mr-1" />
                          <span className="text-xs">Upload failed</span>
                        </div>
                      )}
                    </div>
                    
                    {!uploading && fileObj.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={() => removeFile(fileObj.id)}
                        className="ml-3 p-1 text-gray-400 hover:text-red-600"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Document Information</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Add a description for all documents..."
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={uploading}
              />
            </div>
            
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                Tags (Optional)
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="Enter tags separated by commas (e.g., contract, legal, 2024)"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={uploading}
              />
              <p className="mt-1 text-sm text-gray-500">
                Separate multiple tags with commas
              </p>
            </div>
          </div>
        </div>

        {/* Upload Progress */}
        {uploading && uploadProgress.overall !== undefined && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Uploading...</h3>
            <div className="bg-gray-200 rounded-full h-3">
              <div
                className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress.overall}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-gray-600 text-center">
              {uploadProgress.overall}% completed
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/documents')}
            disabled={uploading}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading || files.length === 0}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : `Upload ${files.length} File${files.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DocumentUpload;
