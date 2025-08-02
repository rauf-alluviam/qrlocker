import React, { useMemo, useCallback } from 'react';
import { 
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const QRBundlesSearch = ({
  searchTerm,
  onSearchTermChange,
  groupBy,
  onGroupByChange,
  showFilters,
  onToggleFilters,
  filters,
  onFiltersChange,
  onSearch,
  applyFilters,
  clearFilters,
  searching = false
}) => {
  // Direct search input handler
  const handleSearchTermChange = (e) => {
    const { value } = e.target;
    onSearchTermChange(value);
  };

  // Handle form submission (Enter key)
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(e);
    }
  };

  

  // Direct handlers for filters
  const handleGroupByChange = (e) => {
    const { value } = e.target;
    onGroupByChange(value);
  };

  const handleToggleFilters = () => {
    onToggleFilters(!showFilters);
  };

  const handleStatusFilterChange = (e) => {
    const { value } = e.target;
    onFiltersChange({ ...filters, status: value });
  };

  const handlePublicFilterChange = (e) => {
    const { value } = e.target;
    onFiltersChange({ ...filters, isPublic: value });
  };

  const handlePasscodeFilterChange = (e) => {
    const { value } = e.target;
    onFiltersChange({ ...filters, hasPasscode: value });
  };

  // Direct action handlers
  const handleApplyFilters = () => {
    if (applyFilters) {
      applyFilters();
    }
  };

  const handleClearFilters = () => {
    if (clearFilters) {
      clearFilters();
    }
  };

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return filters.status || filters.isPublic || filters.hasPasscode || searchTerm || groupBy;
  }, [filters, searchTerm, groupBy]);

  return (
    <div className="mb-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
      <form onSubmit={handleSearchSubmit} className="flex gap-4 mb-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-slate-400" />
          {searching && (
            <div className="absolute right-3 top-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            </div>
          )}
          <input
            type="text"
            placeholder="Search documents by title or description..."
            value={searchTerm}
            onChange={handleSearchTermChange}
            className="w-full pl-10 pr-12 py-2.5 border border-slate-200/60 rounded-xl bg-white/90 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 text-slate-700 placeholder-slate-400"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={groupBy}
            onChange={handleGroupByChange}
            className="px-4 py-2.5 border border-slate-200/60 rounded-xl text-sm font-medium text-slate-700 bg-white/90 backdrop-blur-sm hover:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200"
          >
            <option value="">No Grouping</option>
            <option value="creator">Group by Creator</option>
            <option value="organization">Group by Organization</option>
            <option value="department">Group by Department</option>
            <option value="status">Group by Status</option>
            <option value="accessType">Group by Access Type</option>
          </select>
          <button
            type="button"
            onClick={handleToggleFilters}
            className="inline-flex items-center px-4 py-2.5 border border-slate-200/60 rounded-xl text-sm font-medium text-slate-700 bg-white/90 backdrop-blur-sm hover:bg-white hover:border-blue-300 transition-all duration-200"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
          </button>
        </div>
      </form>

      {showFilters && (
        <div className="bg-slate-50/50 backdrop-blur-sm p-5 rounded-xl border border-slate-200/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={handleStatusFilterChange}
                className="w-full border border-slate-200/60 rounded-lg px-3 py-2.5 bg-white/90 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 text-slate-700"
              >
                <option value="">All Statuses</option>
                <option value="published">Published</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Access Type
              </label>
              <select
                value={filters.isPublic}
                onChange={handlePublicFilterChange}
                className="w-full border border-slate-200/60 rounded-lg px-3 py-2.5 bg-white/90 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 text-slate-700"
              >
                <option value="">All Access</option>
                <option value="true">Public</option>
                <option value="false">Restricted</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Password Protection
              </label>
              <select
                value={filters.hasPasscode}
                onChange={handlePasscodeFilterChange}
                className="w-full border border-slate-200/60 rounded-lg px-3 py-2.5 bg-white/90 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 text-slate-700"
              >
                <option value="">All Protection</option>
                <option value="true">Password Protected</option>
                <option value="false">No Password</option>
              </select>
            </div>
          </div>
          
          {/* Apply Filters Button */}
          <div className="flex justify-end space-x-3 mt-4">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
              >
                Clear All
              </button>
            )}
            <button
              type="button"
              onClick={handleApplyFilters}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRBundlesSearch;
