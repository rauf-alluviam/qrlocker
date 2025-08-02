import React from 'react';
import { Link } from 'react-router-dom';
import { 
  QrCodeIcon, 
  EyeIcon, 
  TrashIcon,
  DocumentIcon,
  ClockIcon,
  LockClosedIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { getStatusBadge, getAccessIcon } from '../../utils/qrBundleUtils';

const QRBundleTableRow = ({ 
  bundle, 
  index, 
  user, 
  onDelete 
}) => {
  return (
    <div 
      className={`group hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-slate-50/30 transition-all duration-300 hover:shadow-md ${
        index % 2 === 0 
          ? 'bg-white' 
          : 'bg-slate-50/20'
      }`}
    >
      <div className="grid grid-cols-12 gap-6 items-center px-6 py-5">
        {/* Enhanced QR Code */}
        <div className="col-span-1 flex justify-center">
          <div className="relative group/qr">
            {bundle.qrCodeUrl ? (
              <div className="relative">
                <img
                  src={bundle.qrCodeUrl}
                  alt={`QR Code for ${bundle.title}`}
                  className="h-12 w-12 border-2 border-blue-200/60 rounded-xl shadow-md group-hover/qr:shadow-xl group-hover/qr:scale-110 transition-all duration-300 bg-white p-1"
                />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
              </div>
            ) : (
              <div className="h-12 w-12 bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 border-2 border-blue-300/60 rounded-xl flex items-center justify-center shadow-md group-hover/qr:shadow-xl transition-all duration-300">
                <QrCodeIcon className="h-6 w-6 text-blue-700" />
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Title & Description */}
        <div className="col-span-3">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1.5">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200">
                {getAccessIcon(bundle)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors duration-200 mb-1">
                {bundle.title}
              </h3>
              {bundle.description && (
                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                  {bundle.description}
                </p>
              )}
              <div className="flex items-center mt-2 space-x-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100/80 text-slate-700 shadow-sm">
                  ID: {bundle._id.slice(-6)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Status */}
        <div className="col-span-2">
          <div className="space-y-2">
            <div className="transform hover:scale-105 transition-transform duration-200">
              {getStatusBadge(bundle)}
            </div>
            <div className="flex items-center space-x-2">
              {bundle.accessControl.isPublic ? (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100/80 text-green-800 border border-green-200/50 shadow-sm">
                  <GlobeAltIcon className="h-3 w-3 mr-1" />
                  Public
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100/80 text-orange-800 border border-orange-200/50 shadow-sm">
                  <LockClosedIcon className="h-3 w-3 mr-1" />
                  Private
                </span>
              )}
              {bundle.accessControl.hasPasscode && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100/80 text-purple-800 border border-purple-200/50 shadow-sm">
                  Protected
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Documents */}
        <div className="col-span-1">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl shadow-sm mb-1">
              <DocumentIcon className="h-5 w-5 text-blue-700" />
            </div>
            <span className="text-lg font-bold text-gray-900">
              {bundle.documents?.length || 0}
            </span>
            <span className="text-xs text-gray-500 font-medium">
              {bundle.documents?.length === 1 ? 'file' : 'files'}
            </span>
          </div>
        </div>

        {/* Enhanced Views Analytics */}
        <div className="col-span-1">
          <div className="flex flex-col items-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {bundle.accessControl.currentViews}
            </div>
            {bundle.accessControl.maxViews > 0 && (
              <div className="w-full bg-slate-200 rounded-full h-2 mb-1">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min((bundle.accessControl.currentViews / bundle.accessControl.maxViews) * 100, 100)}%` 
                  }}
                ></div>
              </div>
            )}
            <span className="text-xs text-gray-500 font-medium text-center">
              {bundle.accessControl.maxViews > 0 
                ? `of ${bundle.accessControl.maxViews} max`
                : 'unlimited'
              }
            </span>
          </div>
        </div>

        {/* Enhanced Timeline */}
        <div className="col-span-2">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-4 w-4 text-gray-400" />
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  {format(new Date(bundle.createdAt), 'MMM dd, yyyy')}
                </div>
                <div className="text-xs text-gray-500">
                  {format(new Date(bundle.createdAt), 'HH:mm')}
                </div>
              </div>
            </div>
            {bundle.updatedAt && bundle.updatedAt !== bundle.createdAt && (
              <div className="text-xs text-gray-500">
                Updated {format(new Date(bundle.updatedAt), 'MMM dd')}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Expiry */}
        <div className="col-span-1">
          <div className="text-center">
            {bundle.accessControl.expiryDate ? (
              <div className={`space-y-1 ${
                new Date(bundle.accessControl.expiryDate) < new Date() 
                  ? 'text-red-600' 
                  : new Date(bundle.accessControl.expiryDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    ? 'text-orange-600'
                    : 'text-gray-700'
              }`}>
                <div className="text-sm font-bold">
                  {format(new Date(bundle.accessControl.expiryDate), 'MMM dd')}
                </div>
                <div className="text-xs">
                  {format(new Date(bundle.accessControl.expiryDate), 'yyyy')}
                </div>
                {new Date(bundle.accessControl.expiryDate) < new Date() && (
                  <div className="text-xs font-medium text-red-600">
                    Expired
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm font-medium text-gray-400">
                Never
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Actions */}
        <div className="col-span-1">
          <div className="flex justify-center space-x-1">
            <Link
              to={`/qr-bundles/${bundle._id}`}
              className="group/action p-2.5 text-blue-600 hover:text-white hover:bg-blue-600 rounded-xl transition-all duration-200 hover:shadow-lg border border-blue-200 hover:border-blue-600 transform hover:scale-105"
              title="View details"
            >
              <EyeIcon className="h-4 w-4" />
            </Link>
            {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'supervisor' || user?.role === 'user' || bundle.creator === user?._id) && (
              <button
                onClick={() => onDelete(bundle._id)}
                className="group/action p-2.5 text-red-600 hover:text-white hover:bg-red-600 rounded-xl transition-all duration-200 hover:shadow-lg border border-red-200 hover:border-red-600 transform hover:scale-105"
                title="Delete bundle"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRBundleTableRow;
