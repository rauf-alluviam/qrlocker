import React from 'react';
import { Link } from 'react-router-dom';
import { 
  QrCodeIcon, 
  EyeIcon, 
  TrashIcon,
  DocumentIcon,
  ClockIcon,
  LockClosedIcon,
  GlobeAltIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { getStatusBadge, getAccessIcon } from '../../utils/qrBundleUtils';

const QRBundleCard = ({ 
  bundle, 
  index, 
  user, 
  onDelete 
}) => {
  return (
    <div 
      key={bundle._id} 
      className={`group bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1`}
    >
      {/* Compact Header with Title and Actions */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <div className="p-1.5 rounded bg-gray-100 group-hover:bg-blue-100 transition-colors duration-300">
            {getAccessIcon(bundle)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-300 break-words line-clamp-2 leading-tight">
              {bundle.title}
            </h3>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 mt-0.5">
              {bundle._id.slice(-6)}
            </span>
          </div>
        </div>
        <div className="flex space-x-1">
          <Link
            to={`/qr-bundles/${bundle._id}`}
            className="p-1.5 text-blue-600 hover:text-white hover:bg-blue-600 rounded transition-all duration-200 border border-blue-200 hover:border-blue-600"
            title="View details"
          >
            <EyeIcon className="h-3.5 w-3.5" />
          </Link>
          {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'supervisor' || user?.role === 'user' || bundle.creator === user?._id) && (
            <button
              onClick={() => onDelete(bundle._id)}
              className="p-1.5 text-red-600 hover:text-white hover:bg-red-600 rounded transition-all duration-200 border border-red-200 hover:border-red-600"
              title="Delete"
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Compact QR Code Preview */}
      {bundle.qrCodeUrl && (
        <div className="mb-3 flex justify-center">
          <div className="relative group/qr">
            <img
              src={bundle.qrCodeUrl}
              alt={`QR Code for ${bundle.title}`}
              className="h-16 w-16 border border-gray-200 rounded shadow-sm group-hover/qr:shadow-md group-hover/qr:scale-105 transition-all duration-300 bg-white p-1"
            />
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border border-white shadow-sm"></div>
          </div>
        </div>
      )}

      {/* Compact Status Badge */}
      <div className="mb-3 flex justify-center">
        <div className="transform hover:scale-105 transition-transform duration-200">
          {getStatusBadge(bundle)}
        </div>
      </div>

      {/* Compact Description */}
      {bundle.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-1 text-center">
          {bundle.description}
        </p>
      )}

      {/* Compact Stats Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-gray-50 rounded p-2 text-center group-hover:bg-blue-50 transition-all duration-300">
          <div className="flex items-center justify-center mb-1">
            <DocumentIcon className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-blue-800">{bundle.documents?.length || 0}</div>
          <div className="text-xs text-blue-600 font-medium">Docs</div>
        </div>
        
        <div className="bg-gray-50 rounded p-2 text-center group-hover:bg-green-50 transition-all duration-300">
          <div className="flex items-center justify-center mb-1">
            <EyeIcon className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-lg font-bold text-green-800">
            {bundle.accessControl.currentViews}
            {bundle.accessControl.maxViews > 0 && (
              <span className="text-xs text-green-600">/{bundle.accessControl.maxViews}</span>
            )}
          </div>
          <div className="text-xs text-green-600 font-medium">Views</div>
        </div>
      </div>

      {/* Enhanced Timeline with Gradient Backgrounds */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 via-slate-100/80 to-blue-50 rounded-xl border border-slate-200/50 hover:shadow-md transition-all duration-300">
          <div className="flex items-center space-x-2">
            <div className="p-1 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
              <ClockIcon className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-slate-700">Created</span>
          </div>
          <span className="text-sm font-semibold text-slate-900 bg-white/80 px-2 py-1 rounded-lg">
            {format(new Date(bundle.createdAt), 'MMM dd, yyyy')}
          </span>
        </div>
        
        {bundle.accessControl.expiryDate && (
          <div className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 hover:shadow-md ${
            new Date(bundle.accessControl.expiryDate) < new Date() 
              ? 'bg-gradient-to-r from-red-50 via-red-100/80 to-red-200/60 border-red-200/50' 
              : new Date(bundle.accessControl.expiryDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                ? 'bg-gradient-to-r from-orange-50 via-orange-100/80 to-orange-200/60 border-orange-200/50'
                : 'bg-gradient-to-r from-blue-50 via-blue-100/80 to-blue-200/60 border-blue-200/50'
          }`}>
            <div className="flex items-center space-x-2">
              <div className={`p-1 rounded-lg ${
                new Date(bundle.accessControl.expiryDate) < new Date() 
                  ? 'bg-gradient-to-br from-red-100 to-red-200' 
                  : new Date(bundle.accessControl.expiryDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    ? 'bg-gradient-to-br from-orange-100 to-orange-200'
                    : 'bg-gradient-to-br from-blue-100 to-blue-200'
              }`}>
                <ExclamationTriangleIcon className={`h-4 w-4 ${
                  new Date(bundle.accessControl.expiryDate) < new Date() 
                    ? 'text-red-600' 
                    : new Date(bundle.accessControl.expiryDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                      ? 'text-orange-600'
                      : 'text-blue-600'
                }`} />
              </div>
              <span className="text-sm font-medium text-slate-700">Expires</span>
            </div>
            <span className={`text-sm font-semibold bg-white/80 px-2 py-1 rounded-lg ${
              new Date(bundle.accessControl.expiryDate) < new Date() ? 'text-red-600' : 'text-slate-900'
            }`}>
              {format(new Date(bundle.accessControl.expiryDate), 'MMM dd, yyyy')}
            </span>
          </div>
        )}
      </div>

      {/* Access Control Info */}
      <div className="flex items-center justify-center space-x-2 mb-6">
        {bundle.accessControl.isPublic ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
            <GlobeAltIcon className="h-3 w-3 mr-1" />
            Public Access
          </span>
        ) : (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
            <LockClosedIcon className="h-3 w-3 mr-1" />
            Private Access
          </span>
        )}
        {bundle.accessControl.hasPasscode && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            Password Protected
          </span>
        )}
      </div>

      {/* Action Button */}
      <Link
        to={`/qr-bundles/${bundle._id}`}
        className="w-full inline-flex justify-center items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
      >
        <span>View Details</span>
        <EyeIcon className="ml-2 h-4 w-4" />
      </Link>
    </div>
  );
};

export default QRBundleCard;
