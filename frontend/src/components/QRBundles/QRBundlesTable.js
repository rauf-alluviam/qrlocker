import React from 'react';
import { format } from 'date-fns';
import QRBundleTableRow from './QRBundleTableRow';

const QRBundlesTable = ({ 
  bundles, 
  user, 
  onDeleteBundle 
}) => {
  return (
    <div className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl overflow-hidden border border-white/50">
      {/* Enhanced Header with Clean White Theme */}
      <div className="bg-gradient-to-r from-slate-700 via-blue-600 to-blue-700 px-6 py-5">
        <div className="grid grid-cols-12 gap-6 items-center">
          <div className="col-span-1 text-center text-xs font-bold text-white uppercase tracking-widest">
            QR Code
          </div>
          <div className="col-span-3 text-xs font-bold text-white uppercase tracking-widest">
            Bundle Information
          </div>
          <div className="col-span-2 text-xs font-bold text-white uppercase tracking-widest">
            Status & Access
          </div>
          <div className="col-span-1 text-center text-xs font-bold text-white uppercase tracking-widest">
            Files
          </div>
          <div className="col-span-1 text-center text-xs font-bold text-white uppercase tracking-widest">
            Analytics
          </div>
          <div className="col-span-2 text-xs font-bold text-white uppercase tracking-widest">
            Timeline
          </div>
          <div className="col-span-1 text-center text-xs font-bold text-white uppercase tracking-widest">
            Expiry
          </div>
          <div className="col-span-1 text-center text-xs font-bold text-white uppercase tracking-widest">
            Actions
          </div>
        </div>
      </div>

      {/* Enhanced Table Body with Clean White Styling */}
      <div className="divide-y divide-slate-100/70">
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
      
      {/* Enhanced Footer */}
      <div className="bg-gradient-to-r from-slate-50/80 to-blue-50/60 px-6 py-4 border-t border-slate-200/50">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <div className="flex items-center space-x-4">
            <span className="font-medium">
              {bundles.length} bundle{bundles.length !== 1 ? 's' : ''} displayed
            </span>
          </div>
          <div className="text-xs text-slate-500">
            Last updated: {format(new Date(), 'MMM dd, yyyy HH:mm')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRBundlesTable;
