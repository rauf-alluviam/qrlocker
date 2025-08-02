import React from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon,
  ListBulletIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';

const QRBundlesHeader = ({ 
  total, 
  viewMode, 
  onViewModeChange 
}) => {
  return (
    <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            QR Bundles
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your QR bundles ({total || 0} total)
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Enhanced View Toggle with White Theme */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
              title="List View"
            >
              <ListBulletIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => onViewModeChange('table')}
              className={`p-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                viewMode === 'table'
                  ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
              title="Table View"
            >
              <TableCellsIcon className="h-5 w-5" />
            </button>
          </div>
          
          <Link
            to="/qr-bundles/create"
            className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 border border-blue-600"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create QR Bundle
          </Link>
        </div>
      </div>
    </div>
  );
};

export default QRBundlesHeader;
