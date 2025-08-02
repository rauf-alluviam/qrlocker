import React from 'react';
import QRBundleCard from './QRBundleCard';
import QRBundlesPagination from './QRBundlesPagination';

const QRBundlesGrid = ({ 
  bundles, 
  user, 
  pagination, 
  currentPage, 
  onPageChange, 
  onDeleteBundle 
}) => {
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden relative border border-white/50">
      {/* Subtle animated background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 via-transparent to-slate-500/3 animate-pulse-soft"></div>
      
      <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-8">
        {bundles.map((bundle, index) => (
          <QRBundleCard
            key={bundle._id}
            bundle={bundle}
            index={index}
            user={user}
            onDelete={onDeleteBundle}
          />
        ))}
      </div>

      {pagination && pagination.pages > 1 && (
        <QRBundlesPagination
          currentPage={currentPage}
          totalPages={pagination.pages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};

export default QRBundlesGrid;
