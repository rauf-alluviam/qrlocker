import React from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon,
  ListBulletIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';

const QRBundlesHeader = ({ 
  totalCount, 
  viewMode, 
  onViewModeChange 
}) => {
  return (
    <div className="mb-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent">
            Documents
          </h1>
          <p className="mt-2 text-slate-600">
            Manage your documents ({totalCount || 0} total)
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Enhanced View Toggle with White Theme */}
          <div className="flex items-center bg-slate-100/80 backdrop-blur-sm rounded-xl p-1 border border-slate-200/50 shadow-sm">
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-sm border border-blue-200/50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
              title="List View"
            >
              <ListBulletIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => onViewModeChange('table')}
              className={`p-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                viewMode === 'table'
                  ? 'bg-white text-blue-600 shadow-sm border border-blue-200/50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
              title="Table View"
            >
              <TableCellsIcon className="h-5 w-5" />
            </button>
          </div>
          
          <Link
            to="/qr-bundles/create"
            className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 border border-blue-600/20"
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
