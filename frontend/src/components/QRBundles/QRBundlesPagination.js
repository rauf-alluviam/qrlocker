import React from 'react';
import { 
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

const QRBundlesPagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange 
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex items-center justify-between rounded-b-lg">
      <div className="text-sm font-medium text-gray-700 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
        <span className="text-blue-600">Page</span> {currentPage} <span className="text-blue-600">of</span> {totalPages}
      </div>
      <div className="flex space-x-3">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-200"
        >
          <span className="flex items-center">
            <ChevronDownIcon className="h-4 w-4 mr-1 rotate-90" />
            Previous
          </span>
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-200"
        >
          <span className="flex items-center">
            Next
            <ChevronDownIcon className="h-4 w-4 ml-1 -rotate-90" />
          </span>
        </button>
      </div>
    </div>
  );
};

export default QRBundlesPagination;
