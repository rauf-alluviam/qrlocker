import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { toast } from 'react-hot-toast';
import RequestDetailsModal from '../../components/Requests/RequestDetailsModal';
import RequestResponseModal from '../../components/Requests/RequestResponseModal';

const DocumentRequestsList = () => {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
      };

      const response = await api.get('/requests', { params });
      setRequests(response.data.requests);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId, status) => {
    try {
      await api.put(`/requests/${requestId}/status`, { status });
      toast.success(`Request ${status} successfully`);
      fetchRequests();
    } catch (error) {
      console.error('Error updating request status:', error);
      toast.error('Failed to update request status');
    }
  };

  const handleAssignRequest = async (requestId, userId = null) => {
    try {
      await api.put(`/requests/${requestId}/assign`, { userId });
      toast.success(userId ? 'Request assigned successfully' : 'Request assigned to you');
      fetchRequests();
    } catch (error) {
      console.error('Error assigning request:', error);
      toast.error('Failed to assign request');
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const handleRespond = (request) => {
    setSelectedRequest(request);
    setShowResponseModal(true);
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'fulfilled':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const ActionMenu = ({ request }) => (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="p-2 text-gray-400 hover:text-gray-600">
        <EllipsisVerticalIcon className="h-5 w-5" />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => handleViewDetails(request)}
                  className={`${
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                  } group flex w-full items-center px-4 py-2 text-sm`}
                >
                  <EyeIcon className="mr-3 h-4 w-4" />
                  View Details
                </button>
              )}
            </Menu.Item>

            {request.status === 'pending' && (
              <>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => handleAssignRequest(request._id)}
                      className={`${
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                      } group flex w-full items-center px-4 py-2 text-sm`}
                    >
                      <UserIcon className="mr-3 h-4 w-4" />
                      Assign to Me
                    </button>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => handleRespond(request)}
                      className={`${
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                      } group flex w-full items-center px-4 py-2 text-sm`}
                    >
                      <DocumentIcon className="mr-3 h-4 w-4" />
                      Respond
                    </button>
                  )}
                </Menu.Item>

                <div className="border-t border-gray-100">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => handleStatusUpdate(request._id, 'approved')}
                        className={`${
                          active ? 'bg-green-50 text-green-900' : 'text-green-700'
                        } group flex w-full items-center px-4 py-2 text-sm`}
                      >
                        <CheckIcon className="mr-3 h-4 w-4" />
                        Approve
                      </button>
                    )}
                  </Menu.Item>

                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => handleStatusUpdate(request._id, 'rejected')}
                        className={`${
                          active ? 'bg-red-50 text-red-900' : 'text-red-700'
                        } group flex w-full items-center px-4 py-2 text-sm`}
                      >
                        <XMarkIcon className="mr-3 h-4 w-4" />
                        Reject
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </>
            )}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Document Requests</h1>
        <p className="mt-2 text-gray-600">Manage document access requests from external users</p>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg mb-6 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="fulfilled">Fulfilled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No requests found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No document requests match your current filters.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {requests.map((request) => (
              <li key={request._id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {request.requestTitle}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 truncate">
                          {request.requestDescription}
                        </p>
                        <div className="flex items-center mt-2 space-x-4">
                          <div className="flex items-center text-xs text-gray-500">
                            <UserIcon className="mr-1 h-3 w-3" />
                            {request.requesterName} ({request.requesterEmail})
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <CalendarIcon className="mr-1 h-3 w-3" />
                            {formatDate(request.createdAt)}
                          </div>
                          {request.assignedTo && (
                            <div className="flex items-center text-xs text-gray-500">
                              <UserIcon className="mr-1 h-3 w-3" />
                              Assigned to {request.assignedTo.name}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                            request.status
                          )}`}
                        >
                          {request.status}
                        </span>
                        <ActionMenu request={request} />
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
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
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
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

      {/* Modals */}
      {showDetailsModal && selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedRequest(null);
          }}
        />
      )}

      {showResponseModal && selectedRequest && (
        <RequestResponseModal
          request={selectedRequest}
          isOpen={showResponseModal}
          onClose={() => {
            setShowResponseModal(false);
            setSelectedRequest(null);
          }}
          onSuccess={() => {
            setShowResponseModal(false);
            setSelectedRequest(null);
            fetchRequests();
          }}
        />
      )}
    </div>
  );
};

export default DocumentRequestsList;
