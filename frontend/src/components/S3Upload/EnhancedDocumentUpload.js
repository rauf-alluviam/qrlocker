import React, { useState } from 'react';
import { DocumentIcon, CloudArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';
import { toast } from 'react-toastify';

const EnhancedDocumentUpload = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [formData, setFormData] = useState({
    description: '',
    tags: ''
  });

  // Handle file selection
  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);
    
    const newFiles = selectedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      status: 'pending' // pending, uploading, completed, error
    }));

    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  };

  // Remove file from list
  const removeFile = (fileId) => {
    setFiles(files => {
      const fileToRemove = files.find(f => f.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return files.filter(f => f.id !== fileId);
    });
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon
  const getFileIcon = (fileType) => {
    if (!fileType) return '📁';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('doc')) return '📝';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📽️';
    return '📁';
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Upload files
  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    setUploading(true);

    try {
      const uploadFormData = new FormData();
      
      // Add files
      files.forEach(fileObj => {
        uploadFormData.append('documents', fileObj.file);
      });

      // Add metadata
      if (formData.description) {
        uploadFormData.append('description', formData.description);
      }
      if (formData.tags) {
        uploadFormData.append('tags', formData.tags);
      }

      // Update file status
      setFiles(files => files.map(f => ({ ...f, status: 'uploading' })));

      // Upload with progress tracking
      const response = await api.post('/documents/upload', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(prev => ({ ...prev, overall: progress }));
        }
      });

      // Update file status to completed
      setFiles(files => files.map(f => ({ ...f, status: 'completed' })));
      
      // Check if there were any documents uploaded successfully
      if (response.data.totalUploaded > 0) {
        toast.success(`Successfully uploaded ${response.data.totalUploaded} document(s)`);
      }
      
      // Handle any errors in the response
      if (response.data.errors && response.data.errors.length > 0) {
        response.data.errors.forEach(error => {
          // Check if it's a duplicate document error
          if (error.includes('You have already uploaded this document')) {
            toast.warning(error);
          } else {
            toast.error(error);
          }
        });
      }

      // Clear form after successful upload
      setTimeout(() => {
        setFiles([]);
        setFormData({ description: '', tags: '' });
        setUploadProgress({});
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      
      // Update file status to error
      setFiles(files => files.map(f => ({ ...f, status: 'error' })));
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Upload failed. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Upload Documents to S3
        </h2>

        {/* File Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Files
          </label>
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.svg,.zip,.rar,.7z,.mp4,.avi,.mov,.mp3,.wav"
          />
          <p className="mt-1 text-xs text-gray-500">
            Max file size: 50MB. Supported: Documents, Images, Archives, Media files
          </p>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Optional description for all uploaded files"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="tag1, tag2, tag3"
            />
            <p className="mt-1 text-xs text-gray-500">
              Separate tags with commas
            </p>
          </div>
        </div>

        {/* Selected Files */}
        {files.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Selected Files ({files.length})
            </h3>
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
                      {formatFileSize(fileObj.file.size)} • {fileObj.file.type}
                    </p>
                    
                    {/* Status indicator */}
                    {fileObj.status === 'uploading' && (
                      <div className="mt-2">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress.overall || 0}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Uploading... {uploadProgress.overall || 0}%
                        </p>
                      </div>
                    )}
                    
                    {fileObj.status === 'completed' && (
                      <p className="text-xs text-green-600 mt-1">
                        ✅ Uploaded successfully
                      </p>
                    )}
                    
                    {fileObj.status === 'error' && (
                      <p className="text-xs text-red-600 mt-1">
                        ❌ Upload failed
                      </p>
                    )}
                  </div>
                  
                  {!uploading && (
                    <button
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

        {/* Upload Button */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => setFiles([])}
            disabled={uploading || files.length === 0}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear All
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <div className="animate-spin -ml-1 mr-3 h-5 w-5 text-white">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </div>
                Uploading...
              </>
            ) : (
              <>
                <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                Upload to S3
              </>
            )}
          </button>
        </div>

        {/* Upload Progress */}
        {uploading && uploadProgress.overall && (
          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress.overall}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">
              Upload Progress: {uploadProgress.overall}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedDocumentUpload;
