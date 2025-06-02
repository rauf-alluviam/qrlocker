import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DocumentTextIcon,
  UserIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const DocumentRequestCreate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    requesterName: '',
    requesterEmail: '',
    organization: '',
    department: '',
    requestTitle: '',
    requestDescription: '',
  });
  const [organizations, setOrganizations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [requestId, setRequestId] = useState(null);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (formData.organization) {
      fetchDepartments(formData.organization);
    } else {
      setDepartments([]);
      setFormData(prev => ({ ...prev, department: '' }));
    }
  }, [formData.organization]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      // Use public endpoint for external users
      const response = await api.get('/organizations/public');
      setOrganizations(response.data);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      // Create some default organizations for the demo if public endpoint fails
      setOrganizations([
        { _id: 'demo-org-1', name: 'EXIM Corporation' },
        { _id: 'demo-org-2', name: 'Government Agency' },
        { _id: 'demo-org-3', name: 'Private Company' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async (organizationId) => {
    try {
      // Use public endpoint for external users
      const response = await api.get(`/organizations/${organizationId}/departments/public`);
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
      // Create some default departments for the demo if public endpoint fails
      setDepartments([
        { _id: 'demo-dept-1', name: 'Human Resources' },
        { _id: 'demo-dept-2', name: 'Finance' },
        { _id: 'demo-dept-3', name: 'Legal' },
        { _id: 'demo-dept-4', name: 'Operations' },
      ]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = ['requesterName', 'requesterEmail', 'organization', 'department', 'requestTitle', 'requestDescription'];
    const missingFields = requiredFields.filter(field => !formData[field].trim());
    
    if (missingFields.length > 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.requesterEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post('/requests', formData);
      
      setSubmitted(true);
      setRequestId(response.data.requestId);
      toast.success('Document request submitted successfully!');
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
              <h2 className="mt-4 text-lg font-medium text-gray-900">Request Submitted!</h2>
              <p className="mt-2 text-sm text-gray-600">
                Your document request has been submitted successfully. We'll review your request and get back to you soon.
              </p>
              {requestId && (
                <p className="mt-2 text-xs text-gray-500">
                  Request ID: {requestId}
                </p>
              )}
              <div className="mt-6">
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({
                      requesterName: '',
                      requesterEmail: '',
                      organization: '',
                      department: '',
                      requestTitle: '',
                      requestDescription: '',
                    });
                  }}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Submit Another Request
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-indigo-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Request Document Access</h2>
          <p className="mt-2 text-sm text-gray-600">
            Submit a request to access documents from an organization
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Requester Name */}
            <div>
              <label htmlFor="requesterName" className="block text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="requesterName"
                  name="requesterName"
                  type="text"
                  required
                  value={formData.requesterName}
                  onChange={handleInputChange}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Your full name"
                />
              </div>
            </div>

            {/* Requester Email */}
            <div>
              <label htmlFor="requesterEmail" className="block text-sm font-medium text-gray-700">
                Email Address *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="requesterEmail"
                  name="requesterEmail"
                  type="email"
                  required
                  value={formData.requesterEmail}
                  onChange={handleInputChange}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            {/* Organization */}
            <div>
              <label htmlFor="organization" className="block text-sm font-medium text-gray-700">
                Organization *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="organization"
                  name="organization"
                  required
                  value={formData.organization}
                  onChange={handleInputChange}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select an organization</option>
                  {organizations.map((org) => (
                    <option key={org._id} value={org._id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Department */}
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                Department *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="department"
                  name="department"
                  required
                  value={formData.department}
                  onChange={handleInputChange}
                  disabled={!formData.organization}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select a department</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              {!formData.organization && (
                <p className="mt-1 text-sm text-gray-500">Please select an organization first</p>
              )}
            </div>

            {/* Request Title */}
            <div>
              <label htmlFor="requestTitle" className="block text-sm font-medium text-gray-700">
                Request Title *
              </label>
              <input
                id="requestTitle"
                name="requestTitle"
                type="text"
                required
                value={formData.requestTitle}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Brief title for your request"
              />
            </div>

            {/* Request Description */}
            <div>
              <label htmlFor="requestDescription" className="block text-sm font-medium text-gray-700">
                Request Description *
              </label>
              <textarea
                id="requestDescription"
                name="requestDescription"
                rows={4}
                required
                value={formData.requestDescription}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Describe what documents you need and why you need access to them..."
              />
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={submitting}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  submitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>

          {/* Help Text */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Help</span>
              </div>
            </div>
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-600">
                Your request will be reviewed by the organization's administrators. 
                You'll receive an email notification once your request is processed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentRequestCreate;
