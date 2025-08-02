import React from 'react';
import { Link } from 'react-router-dom';
import { QrCodeIcon, PlusIcon } from '@heroicons/react/24/outline';

const QRBundlesEmptyState = ({ 
  hasFilters,
  searchTerm = '',
  filters = {}
}) => {
  const hasActiveFilters = searchTerm || filters.status || filters.isPublic || filters.hasPasscode;

  return (
    <div className="bg-white/95 backdrop-blur-sm shadow-lg rounded-2xl p-12 text-center border border-white/50">
      <QrCodeIcon className="h-16 w-16 text-slate-400 mx-auto mb-6" />
      <h3 className="text-xl font-semibold text-slate-700 mb-3">No QR bundles found</h3>
      <p className="text-slate-500 mb-8 max-w-md mx-auto">
        {hasActiveFilters
          ? 'Try adjusting your search criteria to find what you\'re looking for.'
          : 'Get started by creating your first QR bundle to organize and share your documents.'}
      </p>
      {!hasActiveFilters && (
        <Link
          to="/qr-bundles/create"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create QR Bundle
        </Link>
      )}
    </div>
  );
};

export default QRBundlesEmptyState;
