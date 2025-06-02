import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  UserIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  TagIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const CreateInternalRequestModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    requestTitle: '',
    requestDescription: '',
    recipients: [],
    priority: 'medium',
    dueDate: '',
    category: 'document_sharing',
    tags: [],
    isUrgent: false
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      requestTitle: '',
      requestDescription: '',
      recipients: [],
      priority: 'medium',
      dueDate: '',
      category: 'document_sharing',
      tags: [],
      isUrgent: false
    });
    setSearchTerm('');
    setTagInput('');
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      // Filter out current user from the list
      const filteredUsers = response.data.filter(user => user._id !== getCurrentUserId());
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRecipientToggle = (userId) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.includes(userId)
        ? prev.recipients.filter(id => id !== userId)
        : [...prev.recipients, userId]
    }));
  };

  const addTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!formData.tags.includes(newTag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.recipients.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }

    if (!formData.requestTitle.trim() || !formData.requestDescription.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const submitData = {
        ...formData,
        dueDate: formData.dueDate || null
      };

      const response = await api.post('/internal-requests', submitData);
      toast.success('Request sent successfully!');
      if (onSuccess) {
        onSuccess(response.data.request);
      }
      onClose();
    } catch (error) {
      console.error('Error creating request:', error);
      toast.error(error.response?.data?.message || 'Failed to send request');
    } finally {
      setSubmitting(false);
    }
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white m-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-medium text-gray-900">Create Internal Request</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={submitting}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Request Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Request Title *
                </label>
                <input
                  type="text"
                  name="requestTitle"
                  required
                  value={formData.requestTitle}
                  onChange={handleInputChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Enter a clear, descriptive title"
                />
              </div>

              {/* Request Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="requestDescription"
                  required
                  rows={4}
                  value={formData.requestDescription}
                  onChange={handleInputChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Describe what documents or assistance you need..."
                />
              </div>

              {/* Priority and Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="document_sharing">Document Sharing</option>
                    <option value="collaboration">Collaboration</option>
                    <option value="review">Review</option>
                    <option value="approval">Approval</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Due Date and Urgent Flag */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date (Optional)
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div className="flex items-center pt-8">
                  <input
                    type="checkbox"
                    name="isUrgent"
                    id="isUrgent"
                    checked={formData.isUrgent}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isUrgent" className="ml-2 block text-sm text-gray-900">
                    <ExclamationTriangleIcon className="h-4 w-4 inline mr-1 text-red-500" />
                    Mark as urgent
                  </label>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (Optional)
                </label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={addTag}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Type and press Enter to add tags"
                />
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                      >
                        <TagIcon className="h-3 w-3 mr-1" />
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-indigo-600 hover:text-indigo-800"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Recipients */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipients * ({formData.recipients.length} selected)
                </label>
                
                {/* Search Users */}
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm mb-3"
                  placeholder="Search users by name or email..."
                />

                {/* Users List */}
                <div className="border border-gray-300 rounded-md max-h-80 overflow-y-auto">
                  {loading ? (
                    <div className="p-4 text-center text-gray-500">Loading users...</div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No users found</div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <div
                          key={user._id}
                          className="p-3 hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleRecipientToggle(user._id)}
                        >
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.recipients.includes(user._id)}
                              onChange={() => {}}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <div className="ml-3 flex-1"
                            >
                              
                              <div className="flex items-center">
                                <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                  <p className="text-xs text-gray-500">{user.email}</p>
                                  {user.organization && (
                                    <p className="text-xs text-gray-400">
                                      {user.organization.name}
                                      {user.department && ` • ${user.department.name}`}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Recipients Summary */}
              {formData.recipients.length > 0 && (
                <div className="bg-indigo-50 p-3 rounded-md">
                  <h4 className="text-sm font-medium text-indigo-900 mb-2">
                    Selected Recipients ({formData.recipients.length})
                  </h4>
                  <div className="space-y-1">
                    {formData.recipients.map(recipientId => {
                      const user = users.find(u => u._id === recipientId);
                      return user ? (
                        <div key={recipientId} className="text-sm text-indigo-700">
                          {user.name} ({user.email})
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Priority Preview */}
              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Request Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <span className="text-gray-600">Priority:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(formData.priority)}`}>
                      {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600">Category:</span>
                    <span className="ml-2 text-gray-900">
                      {formData.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  {formData.dueDate && (
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-gray-600">Due:</span>
                      <span className="ml-2 text-gray-900">
                        {new Date(formData.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {formData.isUrgent && (
                    <div className="flex items-center text-red-600">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">Marked as urgent</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || formData.recipients.length === 0}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateInternalRequestModal;
