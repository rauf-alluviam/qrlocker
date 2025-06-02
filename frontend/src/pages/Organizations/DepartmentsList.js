import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  BuildingOfficeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  UsersIcon,
  DocumentTextIcon,
  CogIcon,
  ShieldCheckIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';

const DepartmentsList = () => {
  const { id: organizationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [organization, setOrganization] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    settings: {
      requireApproval: false,
      restrictedAccess: false
    }
  });

  useEffect(() => {
    fetchOrganization();
    fetchDepartments();
  }, [organizationId]);

  const fetchOrganization = async () => {
    try {
      const response = await api.get(`/organizations/${organizationId}`);
      setOrganization(response.data);
    } catch (error) {
      console.error('Error fetching organization:', error);
      toast.error('Failed to fetch organization details');
      navigate('/organizations');
    }
  };

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/organizations/${organizationId}/departments`);
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post(`/organizations/${organizationId}/departments`, formData);
      setDepartments([...departments, response.data]);
      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        settings: {
          requireApproval: false,
          restrictedAccess: false
        }
      });
      toast.success('Department created successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create department');
    }
  };

  const handleUpdateDepartment = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/organizations/${organizationId}/departments/${selectedDept._id}`, formData);
      setDepartments(departments.map(dept => 
        dept._id === selectedDept._id ? response.data : dept
      ));
      setShowEditModal(false);
      setSelectedDept(null);
      toast.success('Department updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update department');
    }
  };

  const handleDeleteDepartment = async (deptId) => {
    if (!window.confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/organizations/${organizationId}/departments/${deptId}`);
      setDepartments(departments.filter(dept => dept._id !== deptId));
      toast.success('Department deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete department');
    }
  };

  const openEditModal = (dept) => {
    setSelectedDept(dept);
    setFormData({
      name: dept.name,
      description: dept.description || '',
      settings: dept.settings || {
        requireApproval: false,
        restrictedAccess: false
      }
    });
    setShowEditModal(true);
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with breadcrumb */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
          <Link to="/organizations" className="hover:text-gray-700">Organizations</Link>
          <span>/</span>
          <span className="text-gray-900">{organization?.name || 'Loading...'}</span>
          <span>/</span>
          <span className="text-gray-900">Departments</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/organizations')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {organization?.name} Departments
              </h1>
              <p className="mt-2 text-gray-600">Manage departments within {organization?.name}</p>
            </div>
          </div>
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Create Department</span>
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Departments Grid */}
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
          {filteredDepartments.map((dept) => (
            <div key={dept._id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{dept.name}</h3>
                      <p className="text-sm text-gray-500">
                        Created {new Date(dept.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {user?.role === 'admin' && (
                      <>
                        <button
                          onClick={() => openEditModal(dept)}
                          className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-full"
                          title="Edit Department"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDepartment(dept._id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                          title="Delete Department"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {dept.description && (
                  <p className="mt-4 text-sm text-gray-600 line-clamp-2">{dept.description}</p>
                )}

                {/* Statistics */}
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
                </div>

                {/* Settings */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Settings:</span>
                    <div className="flex items-center space-x-2">
                      {dept.settings?.requireApproval && (
                        <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                          <ShieldCheckIcon className="h-3 w-3" />
                          <span>Approval</span>
                        </div>
                      )}
                      {dept.settings?.restrictedAccess && (
                        <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-800 rounded-full">
                          <LockClosedIcon className="h-3 w-3" />
                          <span>Restricted</span>
                        </div>
                      )}
                      {!dept.settings?.requireApproval && !dept.settings?.restrictedAccess && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                          Open Access
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

      {!loading && filteredDepartments.length === 0 && (
        <div className="text-center py-12">
          <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No departments found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating a new department.'}
          </p>
        </div>
      )}

      {/* Create Department Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Department</h3>
              <form onSubmit={handleCreateDepartment} className="space-y-4">
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
                    <label className="ml-2 text-sm text-gray-700">Require approval for documents</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.settings.restrictedAccess}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: {...formData.settings, restrictedAccess: e.target.checked}
                      })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">Restricted access</label>
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
                    Create Department
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Department</h3>
              <form onSubmit={handleUpdateDepartment} className="space-y-4">
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
                    <label className="ml-2 text-sm text-gray-700">Require approval for documents</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.settings.restrictedAccess}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: {...formData.settings, restrictedAccess: e.target.checked}
                      })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">Restricted access</label>
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
                    Update Department
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

export default DepartmentsList;
