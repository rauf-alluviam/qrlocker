import React from 'react';
import { QrCodeIcon } from '@heroicons/react/24/outline';

const QRBundlesLoadingSkeleton = () => {
  return (
    <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl p-8 border border-white/50">
      <div className="animate-pulse space-y-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-slate-200/60 rounded-xl"></div>
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-slate-200/60 rounded-lg w-3/4"></div>
              <div className="h-3 bg-slate-200/60 rounded-lg w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QRBundlesLoadingSkeleton;
