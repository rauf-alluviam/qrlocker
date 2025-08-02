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
    <div className="px-8 py-6 bg-gradient-to-r from-blue-50 via-blue-100/80 to-blue-200/60 border-t border-blue-200/50 flex items-center justify-between rounded-b-3xl relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-blue-600/5 animate-pulse-soft"></div>
      <div className="relative text-sm font-semibold text-blue-900 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm border border-blue-200/50">
        <span className="text-blue-600">Page</span> {currentPage} <span className="text-blue-600">of</span> {totalPages}
      </div>
      <div className="relative flex space-x-3">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="group px-4 py-2 bg-white/90 backdrop-blur-sm border border-blue-200/50 rounded-xl text-sm font-semibold text-blue-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/90 disabled:hover:text-blue-700 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <span className="flex items-center">
            <ChevronDownIcon className="h-4 w-4 mr-1 rotate-90 group-hover:-translate-x-0.5 transition-transform duration-200" />
            Previous
          </span>
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="group px-4 py-2 bg-white/90 backdrop-blur-sm border border-blue-200/50 rounded-xl text-sm font-semibold text-blue-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/90 disabled:hover:text-blue-700 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <span className="flex items-center">
            Next
            <ChevronDownIcon className="h-4 w-4 ml-1 -rotate-90 group-hover:translate-x-0.5 transition-transform duration-200" />
          </span>
        </button>
      </div>
    </div>
  );
};

export default QRBundlesPagination;
