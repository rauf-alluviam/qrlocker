import React from 'react';
import { 
  ChevronDownIcon,
  ChevronUpIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import QRBundlesTable from './QRBundlesTable';
import QRBundleCard from './QRBundleCard';

const QRBundlesGroupedView = ({ 
  groupedData,
  expandedGroups,
  onToggleGroup,
  groupBy,
  viewMode,
  user,
  onDeleteBundle,
  currentPage,
  onPageChange
}) => {
  return (
    <div className="space-y-6">
      {groupedData.groups.map((group) => (
        <div key={group.groupId || 'ungrouped'} className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden border border-white/50">
          <div 
            className="px-6 py-5 bg-gradient-to-r from-slate-50/80 to-blue-50/60 border-b border-slate-200/50 cursor-pointer hover:from-slate-100/80 hover:to-blue-100/60 transition-all duration-200"
            onClick={() => onToggleGroup(group.groupId || 'ungrouped')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50">
                  <Squares2X2Icon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {group.groupName}
                  </h3>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100/80 text-blue-800 border border-blue-200/50">
                    {group.count} bundle{group.count !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white/60 backdrop-blur-sm">
                {expandedGroups.has(group.groupId || 'ungrouped') ? (
                  <ChevronUpIcon className="h-5 w-5 text-slate-600" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-slate-600" />
                )}
              </div>
            </div>
          </div>
          
          {expandedGroups.has(group.groupId || 'ungrouped') && (
            <div className="p-6">
              {viewMode === 'table' ? (
                <QRBundlesTable
                  bundles={group.qrBundles}
                  user={user}
                  onDeleteBundle={onDeleteBundle}
                />
              ) : (
                <div className="bg-gradient-to-br from-blue-50/40 via-white to-blue-100/30 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.qrBundles.map((bundle, index) => (
                    <QRBundleCard
                      key={bundle._id}
                      bundle={bundle}
                      index={index}
                      user={user}
                      onDelete={onDeleteBundle}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
      
      {/* Pagination for grouped view */}
      {groupedData.pages > 1 && (
        <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between rounded-lg shadow">
          <div className="text-sm text-gray-700">
            Showing page {groupedData.page} of {groupedData.pages} ({groupedData.total} total bundles)
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === groupedData.pages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRBundlesGroupedView;
