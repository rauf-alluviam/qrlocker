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
      className={`group qr-bundle-card qr-bundle-card-enter stagger-${(index % 9) + 1} bg-white/98 backdrop-blur-sm border border-slate-200/40 rounded-2xl p-8 qr-bundle-shimmer shadow-md hover:shadow-2xl hover:shadow-blue-200/20 bg-gradient-to-br from-white via-blue-50/10 to-slate-50/10 hover-blue-glow`}
    >
      {/* Enhanced Header with Title and Actions */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 group-hover:from-blue-200 group-hover:to-blue-300 transition-colors duration-300">
            {getAccessIcon(bundle)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors duration-300">
              {bundle.title}
            </h3>
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 mt-1">
              ID: {bundle._id.slice(-6)}
            </span>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link
            to={`/qr-bundles/${bundle._id}`}
            className="p-2 text-blue-600 hover:text-white hover:bg-blue-600 rounded-xl transition-all duration-200 hover:shadow-lg border border-blue-200 hover:border-blue-600"
            title="View details"
          >
            <EyeIcon className="h-4 w-4" />
          </Link>
          {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'supervisor' || user?.role === 'user' || bundle.creator === user?._id) && (
            <button
              onClick={() => onDelete(bundle._id)}
              className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-xl transition-all duration-200 hover:shadow-lg border border-red-200 hover:border-red-600"
              title="Delete"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Enhanced QR Code Preview with Animations */}
      {bundle.qrCodeUrl && (
        <div className="mb-6 flex justify-center">
          <div className="relative group/qr">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-2xl qr-code-pulse opacity-0 group-hover/qr:opacity-100 transition-opacity duration-300"></div>
            <img
              src={bundle.qrCodeUrl}
              alt={`QR Code for ${bundle.title}`}
              className="relative h-28 w-28 border-2 border-blue-200/60 rounded-2xl shadow-lg group-hover/qr:shadow-2xl group-hover/qr:shadow-blue-200/50 group-hover/qr:scale-110 transition-all duration-500 bg-white p-3 hover-blue-glow"
            />
            <div className="absolute -top-2 -right-2 h-5 w-5 bg-gradient-to-br from-green-400 to-green-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-medium rounded-full opacity-0 group-hover/qr:opacity-100 transition-opacity duration-300">
              Scan Me
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Status Badge with Animation */}
      <div className="mb-4 flex justify-center">
        <div className="transform hover:scale-105 transition-transform duration-200">
          {getStatusBadge(bundle)}
        </div>
      </div>

      {/* Description */}
      {bundle.description && (
        <p className="text-sm text-gray-600 mb-6 line-clamp-2 text-center italic">
          {bundle.description}
        </p>
      )}

      {/* Enhanced Stats Grid with Counter Animation */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 via-blue-100/80 to-blue-200/60 rounded-2xl p-4 text-center group-hover:from-blue-100 group-hover:via-blue-200/80 group-hover:to-blue-300/60 transition-all duration-500 hover:shadow-lg hover:shadow-blue-200/30 border border-blue-200/30">
          <div className="flex items-center justify-center mb-2">
            <DocumentIcon className="h-5 w-5 text-blue-600 mr-1" />
            <div className="h-1 w-1 bg-blue-400 rounded-full animate-pulse"></div>
          </div>
          <div className="text-2xl font-bold text-blue-800 stats-counter">{bundle.documents?.length || 0}</div>
          <div className="text-xs text-blue-600 font-medium">Documents</div>
          <div className="mt-1 h-1 bg-blue-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(100, (bundle.documents?.length || 0) * 20)}%` }}
            ></div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 via-green-100/80 to-green-200/60 rounded-2xl p-4 text-center group-hover:from-green-100 group-hover:via-green-200/80 group-hover:to-green-300/60 transition-all duration-500 hover:shadow-lg hover:shadow-green-200/30 border border-green-200/30">
          <div className="flex items-center justify-center mb-2">
            <EyeIcon className="h-5 w-5 text-green-600 mr-1" />
            <div className="h-1 w-1 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <div className="text-2xl font-bold text-green-800 stats-counter">
            {bundle.accessControl.currentViews}
            {bundle.accessControl.maxViews > 0 && (
              <span className="text-sm text-green-600">/{bundle.accessControl.maxViews}</span>
            )}
          </div>
          <div className="text-xs text-green-600 font-medium">Views</div>
          <div className="mt-1 h-1 bg-green-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-1000 ease-out"
              style={{ 
                width: bundle.accessControl.maxViews > 0 
                  ? `${(bundle.accessControl.currentViews / bundle.accessControl.maxViews) * 100}%`
                  : `${Math.min(100, bundle.accessControl.currentViews * 10)}%`
              }}
            ></div>
          </div>
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

      {/* Enhanced Access Control Info with Improved Badges */}
      <div className="flex items-center justify-center space-x-2 mb-6">
        {bundle.accessControl.isPublic ? (
          <span className="inline-flex items-center px-3 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300/50 shadow-sm hover:shadow-md transition-all duration-200">
            <GlobeAltIcon className="h-3 w-3 mr-1" />
            Public Access
            <div className="ml-1 h-1 w-1 bg-green-500 rounded-full animate-pulse"></div>
          </span>
        ) : (
          <span className="inline-flex items-center px-3 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border border-orange-300/50 shadow-sm hover:shadow-md transition-all duration-200">
            <LockClosedIcon className="h-3 w-3 mr-1" />
            Private Access
            <div className="ml-1 h-1 w-1 bg-orange-500 rounded-full animate-pulse"></div>
          </span>
        )}
        {bundle.accessControl.hasPasscode && (
          <span className="inline-flex items-center px-3 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300/50 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="h-2 w-2 bg-purple-500 rounded-full mr-1 animate-pulse"></div>
            Password Protected
          </span>
        )}
      </div>

      {/* Enhanced Action Button with Gradient and Animation */}
      <Link
        to={`/qr-bundles/${bundle._id}`}
        className="group/btn w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg hover:shadow-xl hover:shadow-blue-200/50 transition-all duration-300 transform hover:-translate-y-0.5 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
        <span className="relative z-10">View Details</span>
        <EyeIcon className="relative z-10 ml-2 h-4 w-4 group-hover/btn:rotate-12 transition-transform duration-300" />
      </Link>
    </div>
  );
};

export default QRBundleCard;
