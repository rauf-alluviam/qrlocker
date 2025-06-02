import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  BuildingOfficeIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  UsersIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';

const OrganizationsList = () => {
  const { user } = useAuthStore();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo: '',
    settings: {
      requireApproval: false,
      defaultExpiryDays: 30,
      maxViewsDefault: 0,
      ipWhitelisting: {
        enabled: false,
        ips: []
      }
    }
  });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/organizations');
      setOrganizations(response.data);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast.error('Failed to fetch organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/organizations', formData);
      setOrganizations([...organizations, response.data]);
      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        logo: '',
        settings: {
          requireApproval: false,
          defaultExpiryDays: 30,
          maxViewsDefault: 0,
          ipWhitelisting: {
            enabled: false,
            ips: []
          }
        }
      });
      toast.success('Organization created successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create organization');
    }
  };

  const handleUpdateOrganization = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/organizations/${selectedOrg._id}`, formData);
      setOrganizations(organizations.map(org => 
        org._id === selectedOrg._id ? response.data : org
      ));
      setShowEditModal(false);
      setSelectedOrg(null);
      toast.success('Organization updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update organization');
    }
  };

  const handleDeleteOrganization = async (orgId) => {
    if (!window.confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/organizations/${orgId}`);
      setOrganizations(organizations.filter(org => org._id !== orgId));
      toast.success('Organization deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete organization');
    }
  };

  const openEditModal = (org) => {
    setSelectedOrg(org);
    setFormData({
      name: org.name,
      description: org.description || '',
      logo: org.logo || '',
      settings: org.settings || {
        requireApproval: false,
        defaultExpiryDays: 30,
        maxViewsDefault: 0,
        ipWhitelisting: {
          enabled: false,
          ips: []
        }
      }
    });
    setShowEditModal(true);
  };

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (org.description && org.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
            <p className="mt-2 text-gray-600">Manage organizations in the system</p>
          </div>
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Create Organization</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Organizations Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill().map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow animate-pulse">
              <div className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="flex space-x-2">
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrganizations.map((org) => (
            <div key={org._id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {org.logo ? (
                      <img src={org.logo} alt={org.name} className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <BuildingOfficeIcon className="h-6 w-6 text-indigo-600" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{org.name}</h3>
                      <p className="text-sm text-gray-500">
                        Created {new Date(org.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {org.description && (
                  <p className="mt-4 text-sm text-gray-600 line-clamp-2">{org.description}</p>
                )}

                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <UsersIcon className="h-4 w-4" />
                      <span>Users</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DocumentTextIcon className="h-4 w-4" />
                      <span>Docs</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Link
                      to={`/organizations/${org._id}/departments`}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full"
                      title="View Departments"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Link>
                    {user?.role === 'admin' && (
                      <>
                        <button
                          onClick={() => openEditModal(org)}
                          className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-full"
                          title="Edit Organization"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOrganization(org._id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                          title="Delete Organization"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Settings Preview */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Settings:</span>
                    <div className="flex items-center space-x-2">
                      {org.settings?.requireApproval && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                          Approval Required
                        </span>
                      )}
                      {org.settings?.ipWhitelisting?.enabled && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          IP Restricted
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredOrganizations.length === 0 && (
        <div className="text-center py-12">
          <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No organizations found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating a new organization.'}
          </p>
        </div>
      )}

      {/* Create Organization Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Organization</h3>
              <form onSubmit={handleCreateOrganization} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Logo URL</label>
                  <input
                    type="url"
                    value={formData.logo}
                    onChange={(e) => setFormData({...formData, logo: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Settings</h4>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.settings.requireApproval}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: {...formData.settings, requireApproval: e.target.checked}
                      })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">Require approval for QR bundles</label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Default Expiry (days)</label>
                    <input
                      type="number"
                      value={formData.settings.defaultExpiryDays}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: {...formData.settings, defaultExpiryDays: parseInt(e.target.value)}
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Create Organization
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Organization Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Organization</h3>
              <form onSubmit={handleUpdateOrganization} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Logo URL</label>
                  <input
                    type="url"
                    value={formData.logo}
                    onChange={(e) => setFormData({...formData, logo: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Settings</h4>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.settings.requireApproval}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: {...formData.settings, requireApproval: e.target.checked}
                      })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">Require approval for QR bundles</label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Default Expiry (days)</label>
                    <input
                      type="number"
                      value={formData.settings.defaultExpiryDays}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: {...formData.settings, defaultExpiryDays: parseInt(e.target.value)}
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Update Organization
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationsList;
