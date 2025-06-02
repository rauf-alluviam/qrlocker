import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  QrCodeIcon,
  DocumentIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { toast } from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const Analytics = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const [analytics, setAnalytics] = useState({
    scanStats: null,
    viewStats: null,
    topQRBundles: null,
    topDocuments: null,
    timeOfDay: null,
    location: null,
  });

  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      };

      // Basic analytics available to all users
      const [scanStatsRes, viewStatsRes, topQRRes, topDocRes] = await Promise.all([
        api.get('/analytics/scans', { params }),
        api.get('/analytics/views', { params }),
        api.get('/analytics/top-qr', { params }),
        api.get('/analytics/top-documents', { params }),
      ]);

      const newAnalytics = {
        scanStats: scanStatsRes.data,
        viewStats: viewStatsRes.data,
        topQRBundles: topQRRes.data,
        topDocuments: topDocRes.data,
      };

      // Advanced analytics for all authenticated users
      const [timeOfDayRes, locationRes] = await Promise.all([
        api.get('/analytics/time-of-day', { params }),
        api.get('/analytics/location', { params }),
      ]);

      newAnalytics.timeOfDay = timeOfDayRes.data;
      newAnalytics.location = locationRes.data;

      setAnalytics(newAnalytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'qr-bundles', name: 'QR Bundles', icon: QrCodeIcon },
    { id: 'documents', name: 'Documents', icon: DocumentIcon },
    ...(user?.role === 'admin' || user?.role === 'supervisor'
      ? [
          { id: 'time-analysis', name: 'Time Analysis', icon: ClockIcon },
          { id: 'location', name: 'Location', icon: MapPinIcon },
        ]
      : []),
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

  const formatChartData = (dailyStats) => {
    return dailyStats?.map(stat => ({
      date: new Date(stat.date).toLocaleDateString(),
      scans: stat.scans || 0,
      views: stat.views || 0,
      downloads: stat.downloads || 0,
    })) || [];
  };

  const formatTimeData = (hourlyData) => {
    return hourlyData?.map((count, hour) => ({
      hour: `${hour}:00`,
      scans: count,
    })) || [];
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const renderOverview = () => {
    const chartData = formatChartData(analytics.scanStats?.dailyStats);

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <QrCodeIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Scans</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {analytics.scanStats?.totalScans || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {/* <EyeIcon className="h-6 w-6 text-gray-400" /> */}
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Views</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {analytics.scanStats?.totalViews || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Downloads</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {analytics.scanStats?.totalDownloads || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Top QR Bundles</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {analytics.topQRBundles?.topQRBundles?.length || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Activity Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="scans"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="Scans"
                />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Views"
                />
                <Line
                  type="monotone"
                  dataKey="downloads"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  name="Downloads"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderQRBundles = () => (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Top QR Bundles</h3>
        <div className="space-y-4">
          {analytics.topQRBundles?.topQRBundles?.map((bundle, index) => (
            <div key={bundle.bundleId} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{bundle.title}</p>
                  <p className="text-sm text-gray-500">{bundle.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{bundle.scans} scans</p>
                <p className="text-sm text-gray-500">{bundle.currentViews} views</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Top Documents</h3>
        <div className="space-y-4">
          {analytics.topDocuments?.topDocuments?.map((doc, index) => (
            <div key={doc.documentId} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                  <p className="text-sm text-gray-500">
                    {doc.fileType} • Uploaded by {doc.uploadedBy}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{doc.views} views</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTimeAnalysis = () => {
    const timeData = formatTimeData(analytics.timeOfDay?.hourlyData);

    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Scans by Time of Day</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="scans" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderLocation = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Scans by Country</h3>
        <div className="space-y-4">
          {analytics.location?.byCountry?.map((country, index) => (
            <div key={country.country} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">{country.country}</span>
              <span className="text-sm text-gray-500">{country.count} scans</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Scans by City</h3>
        <div className="space-y-4">
          {analytics.location?.byCity?.map((city, index) => (
            <div key={`${city.country}-${city.city}`} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">
                {city.city}, {city.country}
              </span>
              <span className="text-sm text-gray-500">{city.count} scans</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        return renderOverview();
      case 'qr-bundles':
        return renderQRBundles();
      case 'documents':
        return renderDocuments();
      case 'time-analysis':
        return renderTimeAnalysis();
      case 'location':
        return renderLocation();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-2 text-gray-600">View usage analytics and statistics</p>
      </div>

      {/* Date Range Filter */}
      <div className="mb-6 bg-white shadow rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-medium text-gray-900 mb-4 sm:mb-0">Date Range</h3>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`${
                    selectedTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};

export default Analytics;
