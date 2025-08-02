import React from 'react';
import { format } from 'date-fns';
import QRBundleTableRow from './QRBundleTableRow';

const QRBundlesTable = ({ 
  bundles, 
  user, 
  onDeleteBundle 
}) => {
  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="grid grid-cols-12 gap-6 items-center">
          <div className="col-span-1 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
            QR Code
          </div>
          <div className="col-span-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Bundle Information
          </div>
          <div className="col-span-2 text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Status & Access
          </div>
          <div className="col-span-1 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Files
          </div>
          <div className="col-span-1 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Analytics
          </div>
          <div className="col-span-2 text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Timeline
          </div>
          <div className="col-span-1 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Expiry
          </div>
          <div className="col-span-1 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Actions
          </div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-100">
        {bundles.map((bundle, index) => (
          <QRBundleTableRow
            key={bundle._id}
            bundle={bundle}
            index={index}
            user={user}
            onDelete={onDeleteBundle}
          />
        ))}
      </div>
      
      {/* Footer */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span className="font-medium">
              {bundles.length} bundle{bundles.length !== 1 ? 's' : ''} displayed
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Last updated: {format(new Date(), 'MMM dd, yyyy HH:mm')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRBundlesTable;
