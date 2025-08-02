import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

export const useQRBundles = () => {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    isPublic: '',
    hasPasscode: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [groupBy, setGroupBy] = useState('');
  const [groupedData, setGroupedData] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'table'
  
  // Simple timeout ref for search debouncing
  const searchTimeoutRef = useRef(null);

  const fetchBundles = async (page = 1, searchValue = searchTerm) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        ...(searchValue && { search: searchValue }),
        ...(filters.status && { status: filters.status }),
        ...(filters.isPublic && { isPublic: filters.isPublic }),
        ...(filters.hasPasscode && { hasPasscode: filters.hasPasscode }),
        ...(groupBy && { groupBy: groupBy })
      });

      const response = await api.get(`/qr?${params}`);
      
      if (groupBy && response.data.groups) {
        setGroupedData({
          groups: response.data.groups,
          total: response.data.total,
          page: response.data.page,
          pages: response.data.pages
        });
        setBundles([]);
        // Auto-expand all groups initially
        setExpandedGroups(new Set(response.data.groups.map(group => group._id)));
      } else {
        setBundles(response.data.qrBundles || []);
        setGroupedData(null);
        setPagination({
          page: response.data.page,
          pages: response.data.pages,
          total: response.data.total
        });
      }
    } catch (error) {
      toast.error('Failed to fetch QR bundles');
      console.error('Error fetching bundles:', error);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  // Direct search term update with debounced fetch
  const handleSearchTermChange = (value) => {
    setSearchTerm(value);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for search
    if (value.trim()) {
      setSearching(true);
      searchTimeoutRef.current = setTimeout(() => {
        setCurrentPage(1);
        fetchBundles(1, value);
      }, 300);
    } else {
      // If search is cleared, fetch immediately
      setCurrentPage(1);
      fetchBundles(1, '');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchBundles(1, searchTerm);
  };

  // Apply filters function
  const applyFilters = () => {
    setCurrentPage(1);
    fetchBundles(1, searchTerm);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      status: '',
      isPublic: '',
      hasPasscode: ''
    });
    setGroupBy('');
    setCurrentPage(1);
    fetchBundles(1, '');
  };

  const toggleGroup = (groupId) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const handleGroupByChange = (value) => {
    setGroupBy(value);
    setCurrentPage(1);
    setExpandedGroups(new Set());
    fetchBundles(1, searchTerm);
  };

  const handleDeleteBundle = async (bundleId) => {
    if (!window.confirm('Are you sure you want to delete this QR bundle?')) {
      return;
    }

    try {
      await api.delete(`/qr/${bundleId}`);
      toast.success('QR bundle deleted successfully');
      fetchBundles(currentPage, searchTerm);
    } catch (error) {
      toast.error('Failed to delete QR bundle');
      console.error('Error deleting bundle:', error);
    }
  };

  // Simple effects for page changes and initial load
  useEffect(() => {
    fetchBundles(currentPage, searchTerm);
  }, [currentPage]);

  // Initial load
  useEffect(() => {
    fetchBundles(1, searchTerm);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
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
    
    // Setters
    setCurrentPage,
    handleSearchTermChange,
    setFilters,
    setShowFilters,
    setViewMode,
    
    // Actions
    fetchBundles,
    handleSearch,
    applyFilters,
    clearFilters,
    toggleGroup,
    handleGroupByChange,
    handleDeleteBundle
  };
};
