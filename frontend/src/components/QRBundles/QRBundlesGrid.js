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
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-8">
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
