import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, UserIcon, BuildingOfficeIcon, CalendarIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const RequestDetailsModal = ({ request, isOpen, onClose }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Request Details
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Status */}
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                        request.status
                      )}`}
                    >
                      {request.status}
                    </span>
                  </div>

                  {/* Request Title */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Request Title</h4>
                    <p className="text-sm text-gray-900">{request.requestTitle}</p>
                  </div>

                  {/* Request Description */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{request.requestDescription}</p>
                  </div>

                  {/* Requester Information */}
                  <div className="border-t pt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-4">Requester Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <UserIcon className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Name</p>
                          <p className="text-sm text-gray-900">{request.requesterName}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <UserIcon className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-sm text-gray-900">{request.requesterEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Organization</p>
                          <p className="text-sm text-gray-900">
                            {request.organization?.name || request.organization}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Department</p>
                          <p className="text-sm text-gray-900">
                            {request.department?.name || request.department}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Request Metadata */}
                  <div className="border-t pt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-4">Request Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Submitted</p>
                          <p className="text-sm text-gray-900">{formatDate(request.createdAt)}</p>
                        </div>
                      </div>
                      {request.assignedTo && (
                        <div className="flex items-center space-x-2">
                          <UserIcon className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">Assigned to</p>
                            <p className="text-sm text-gray-900">{request.assignedTo.name}</p>
                          </div>
                        </div>
                      )}
                      {request.updatedAt !== request.createdAt && (
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">Last Updated</p>
                            <p className="text-sm text-gray-900">{formatDate(request.updatedAt)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Response Message */}
                  {request.responseMessage && (
                    <div className="border-t pt-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Response Message</h4>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{request.responseMessage}</p>
                    </div>
                  )}

                  {/* Shared QR Bundle */}
                  {request.sharedQrBundle && (
                    <div className="border-t pt-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-4">Shared QR Bundle</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <DocumentTextIcon className="h-8 w-8 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{request.sharedQrBundle.title}</p>
                            <p className="text-sm text-gray-500">{request.sharedQrBundle.description}</p>
                            {request.sharedQrBundle.documents && (
                              <p className="text-xs text-gray-500 mt-1">
                                {request.sharedQrBundle.documents.length} document(s) included
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default RequestDetailsModal;
