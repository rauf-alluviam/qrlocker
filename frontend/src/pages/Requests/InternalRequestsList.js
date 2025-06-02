import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  DocumentIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { toast } from 'react-hot-toast';
import CreateInternalRequestModal from '../../components/InternalRequests/CreateInternalRequestModal';
import InternalRequestDetailsModal from '../../components/InternalRequests/InternalRequestDetailsModal';

const InternalRequestsList = () => {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [currentPage, searchTerm, statusFilter, priorityFilter, categoryFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter }),
        ...(categoryFilter && { category: categoryFilter }),
      };

      const response = await api.get('/internal-requests', { params });
      setRequests(response.data.requests || response.data);
      setTotalPages(response.data.pages || 1);
    } catch (error) {
      console.error('Error fetching internal requests:', error);
      toast.error('Failed to fetch internal requests');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRequest = async (requestId, status) => {
    try {
      await api.patch(`/internal-requests/${requestId}`, { status });
      toast.success(`Request ${status} successfully`);
      fetchRequests();
    } catch (error) {
      console.error('Error updating request:', error);
      toast.error('Failed to update request');
    }
  };

  const handleDeleteRequest = async (requestId) => {
    try {
      await api.delete(`/internal-requests/${requestId}`);
      toast.success('Request deleted successfully');
      fetchRequests();
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error('Failed to delete request');
    }
  };

  const handleDeleteAllRequests = async () => {
    try {
      await api.delete('/internal-requests/delete-all');
      toast.success('All requests deleted successfully');
      fetchRequests();
    } catch (error) {
      console.error('Error deleting all requests:', error);
      toast.error('Failed to delete all requests');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'medium':
        return <ClockIcon className="h-4 w-4" />;
      case 'low':
        return <CheckIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isOverdue = (dueDate) => {
    return dueDate && new Date(dueDate) < new Date();
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPriorityFilter('');
    setCategoryFilter('');
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchRequests();
    toast.success('Internal request created successfully');
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const handleDetailsClose = () => {
    setShowDetailsModal(false);
    setSelectedRequest(null);
    fetchRequests(); // Refresh in case of updates
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Internal Document Requests</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage document requests between team members within your organization.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Request
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">All Categories</option>
            <option value="financial">Financial</option>
            <option value="legal">Legal</option>
            <option value="compliance">Compliance</option>
            <option value="operational">Operational</option>
            <option value="other">Other</option>
          </select>

          <button
            onClick={resetFilters}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FunnelIcon className="h-4 w-4 mr-1" />
            Clear
          </button>
        </div>
      </div>

      {/* Requests Table */}
      <div className="mt-8 flex flex-col ">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8 h-908">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Request Details
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Recipients
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Priority
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Due Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Created
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-sm text-gray-500">
                        <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-2">No internal requests found</div>
                        <div className="mt-1 text-xs">
                          {searchTerm || statusFilter || priorityFilter || categoryFilter
                            ? 'Try adjusting your filters'
                            : 'Create your first internal request'}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    requests.map((request) => (
                      <tr key={request._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                <DocumentIcon className="h-5 w-5 text-indigo-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {request.requestTitle}
                              </div>
                              <div className="text-sm text-gray-500">
                                by {request.requester?.name || request.requester?.email}
                              </div>
                              {request.category && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mt-1">
                                  {request.category}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <UsersIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">
                              {request.recipients?.length || 0} recipient{request.recipients?.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`flex items-center ${getPriorityColor(request.priority)}`}>
                            {getPriorityIcon(request.priority)}
                            <span className="ml-2 text-sm font-medium capitalize">
                              {request.priority || 'medium'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              request.status
                            )}`}
                          >
                            {request.status?.replace('_', ' ') || 'pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.dueDate ? (
                            <div className={`flex items-center ${isOverdue(request.dueDate) ? 'text-red-600' : ''}`}>
                              <CalendarIcon className="h-4 w-4 mr-2" />
                              {formatDate(request.dueDate)}
                              {isOverdue(request.dueDate) && (
                                <span className="ml-2 text-xs font-medium">(Overdue)</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">No due date</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-2" />
                            {formatDate(request.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                          <Menu as="div" className="relative inline-block text-left">
                            <div>
                              <Menu.Button className="flex items-center text-gray-400 hover:text-gray-600">
                                <EllipsisVerticalIcon className="h-5 w-5" />
                              </Menu.Button>
                            </div>
                            <Transition
                              as={Fragment}
                              enter="transition ease-out duration-100"
                              enterFrom="transform opacity-0 scale-95"
                              enterTo="transform opacity-100 scale-100"
                              leave="transition ease-in duration-75"
                              leaveFrom="transform opacity-100 scale-100"
                              leaveTo="transform opacity-0 scale-95"
                            >
                              <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                <div className="py-1">
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={() => handleViewDetails(request)}
                                        className={`${
                                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                        } group flex items-center px-4 py-2 text-sm w-full text-left`}
                                      >
                                        <EyeIcon className="mr-3 h-4 w-4 text-gray-400" />
                                        View Details
                                      </button>
                                    )}
                                  </Menu.Item>
                                  {request.requester._id === user.id && request.status === 'pending' && (
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          onClick={() => handleUpdateRequest(request._id, 'rejected')}
                                          className={`${
                                            active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                          } group flex items-center px-4 py-2 text-sm w-full text-left`}
                                        >
                                          <XMarkIcon className="mr-3 h-4 w-4 text-gray-400" />
                                          Cancel Request
                                        </button>
                                      )}
                                    </Menu.Item>
                                  )}

                                  {/* Delete Option */}
                                  {(user.role === 'admin' || request.requester._id === user.id) && (
                                    <div className="border-t border-gray-100">
                                      <Menu.Item>
                                        {({ active }) => (
                                          <button
                                            onClick={() => {
                                              setRequestToDelete(request);
                                              setShowDeleteConfirm(true);
                                            }}
                                            className={`${
                                              active ? 'bg-red-50 text-red-900' : 'text-red-700'
                                            } group flex items-center px-4 py-2 text-sm w-full text-left`}
                                          >
                                            <TrashIcon className="mr-3 h-4 w-4" />
                                            Delete Request
                                          </button>
                                        )}
                                      </Menu.Item>
                                    </div>
                                  )}
                                </div>
                              </Menu.Items>
                            </Transition>
                          </Menu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      page === currentPage
                        ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Button for Admins */}
      <div className="mt-4 sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center space-x-2">
          {user.role === 'admin' && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete All Requests
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {requestToDelete ? 'Delete Request' : 'Delete All Requests'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {requestToDelete
                ? 'Are you sure you want to delete this request? This action cannot be undone.'
                : 'Are you sure you want to delete all requests? This action cannot be undone.'}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setRequestToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (requestToDelete) {
                    handleDeleteRequest(requestToDelete._id);
                  } else {
                    handleDeleteAllRequests();
                  }
                  setShowDeleteConfirm(false);
                  setRequestToDelete(null);
                }}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateInternalRequestModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {showDetailsModal && selectedRequest && (
        <InternalRequestDetailsModal
          isOpen={showDetailsModal}
          onClose={handleDetailsClose}
          requestId={selectedRequest._id}
          onRequestUpdated={fetchRequests}
        />
      )}
    </div>
  );
};

export default InternalRequestsList;
