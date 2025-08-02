import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useQRBundles } from '../../hooks/useQRBundles';

// UI Components
import QRBundlesHeader from '../../components/QRBundles/QRBundlesHeader';
import QRBundlesSearch from '../../components/QRBundles/QRBundlesSearch';
import QRBundlesLoadingSkeleton from '../../components/QRBundles/QRBundlesLoadingSkeleton';
import QRBundlesEmptyState from '../../components/QRBundles/QRBundlesEmptyState';
import QRBundlesGroupedView from '../../components/QRBundles/QRBundlesGroupedView';
import QRBundlesGrid from '../../components/QRBundles/QRBundlesGrid';
import QRBundlesTable from '../../components/QRBundles/QRBundlesTable';

const QRBundlesList = () => {
  const { user } = useAuthStore();
  
  // Use custom hook for all logic
  const {
    bundles,
    loading,
    searching,
    pagination,
    currentPage,
    searchTerm,
    filters,
    showFilters,
    groupBy,
    groupedData,
    expandedGroups,
    viewMode,
    setCurrentPage,
    handleSearchTermChange,
    setFilters,
    setShowFilters,
    setViewMode,
    handleSearch,
    applyFilters,
    clearFilters,
    toggleGroup,
    handleGroupByChange,
    handleDeleteBundle
  } = useQRBundles();

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <QRBundlesLoadingSkeleton />
        </div>
      </div>
    );
  }

  // Render empty state
  const isEmpty = groupedData ? groupedData.groups.length === 0 : bundles.length === 0;
  if (isEmpty && !loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <QRBundlesHeader 
            total={pagination.total || 0}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
          <QRBundlesSearch
            
            searchTerm={searchTerm}
            onSearchTermChange={handleSearchTermChange}
            filters={filters}
            onFiltersChange={setFilters}
            showFilters={showFilters}
            onToggleFilters={setShowFilters}
            groupBy={groupBy}
            onGroupByChange={handleGroupByChange}
            onSearch={handleSearch}
            applyFilters={applyFilters}
            clearFilters={clearFilters}
            searching={searching}
          />
          <QRBundlesEmptyState 
            searchTerm={searchTerm}
            filters={filters}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header Component */}
        <QRBundlesHeader 
          total={pagination.total || 0}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        {/* Search Component */}
        <QRBundlesSearch
          searchTerm={searchTerm}
          onSearchTermChange={handleSearchTermChange}
          filters={filters}
          onFiltersChange={setFilters}
          showFilters={showFilters}
          onToggleFilters={setShowFilters}
          groupBy={groupBy}
          onGroupByChange={handleGroupByChange}
          onSearch={handleSearch}
          applyFilters={applyFilters}
          clearFilters={clearFilters}
          searching={searching}
        />

        {/* Content based on grouping */}
        {groupedData ? (
          <QRBundlesGroupedView
            groupedData={groupedData}
            expandedGroups={expandedGroups}
            onToggleGroup={toggleGroup}
            groupBy={groupBy}
            viewMode={viewMode}
            user={user}
            pagination={pagination}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onDeleteBundle={handleDeleteBundle}
          />
        ) : viewMode === 'table' ? (
          <QRBundlesTable
            bundles={bundles}
            user={user}
            pagination={pagination}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onDeleteBundle={handleDeleteBundle}
          />
        ) : (
          <QRBundlesGrid
            bundles={bundles}
            user={user}
            pagination={pagination}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onDeleteBundle={handleDeleteBundle}
          />
        )}
      </div>
    </div>
  );
};

export default QRBundlesList;
