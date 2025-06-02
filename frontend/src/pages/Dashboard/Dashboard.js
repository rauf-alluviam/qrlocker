import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import {
  DocumentTextIcon,
  QrCodeIcon,
  ArrowTrendingUpIcon,
  ArrowUpIcon,
  ClockIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    documents: { total: 0, recent: [] },
    qrBundles: { total: 0, recent: [] },
    scans: { total: 0, today: 0 },
    requests: { pending: 0, recent: [] },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch documents count and recent documents
        const documentsRes = await api.get('/documents/me');
        
        // Fetch QR bundles count and recent bundles
        const qrBundlesRes = await api.get('/qr/me');
        
        // Fetch scan statistics
        const scansRes = await api.get('/analytics/scans');
        
        // Get today's scan count
        const today = new Date().toISOString().split('T')[0];
        const todayStats = scansRes.data.dailyStats.find(day => day.date === today);
        const todayScans = todayStats ? todayStats.scans : 0;
        
        // For admins and supervisors, fetch pending requests
        let requestsData = { pending: 0, recent: [] };
        if (user.role === 'admin' || user.role === 'supervisor') {
          const requestsRes = await api.get('/requests?status=pending');
          requestsData = {
            pending: requestsRes.data.total,
            recent: requestsRes.data.requests.slice(0, 5),
          };
        }
        
        setStats({
          documents: { 
            total: documentsRes.data.total,
            recent: documentsRes.data.documents.slice(0, 5),
          },
          qrBundles: {
            total: qrBundlesRes.data.total,
            recent: qrBundlesRes.data.qrBundles.slice(0, 5),
          },
          scans: {
            total: scansRes.data.totalScans,
            today: todayScans,
          },
          requests: requestsData,
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user.role]);

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Documents Stats Card */}
        <div className="card p-6 bg-gradient-to-br from-white to-blue-50/50 border border-blue-100/50">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 p-3 shadow-soft">
              <DocumentTextIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Documents</dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900">
                    {loading ? (
                      <div className="h-6 w-12 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      stats.documents.total
                    )}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/documents" className="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200">
              View all documents
            </Link>
          </div>
        </div>

        {/* QR Bundles Stats Card */}
        <div className="card p-6 bg-gradient-to-br from-white to-purple-50/50 border border-purple-100/50">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 p-3 shadow-soft">
              <QrCodeIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">QR Bundles</dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900">
                    {loading ? (
                      <div className="h-6 w-12 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      stats.qrBundles.total
                    )}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/qr-bundles" className="text-sm font-medium text-accent-600 hover:text-accent-500 transition-colors duration-200">
              View all QR bundles
            </Link>
          </div>
        </div>

        {/* Scans Stats Card */}
        <div className="card p-6 bg-gradient-to-br from-white to-green-50/50 border border-green-100/50">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-xl bg-gradient-to-r from-success-500 to-success-600 p-3 shadow-soft">
              <ArrowTrendingUpIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Scans</dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900">
                    {loading ? (
                      <div className="h-6 w-12 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      stats.scans.total
                    )}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <div className="text-success-600 flex items-center">
              <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4 text-success-500" aria-hidden="true" />
              <span className="ml-1 font-medium">{stats.scans.today} today</span>
            </div>
            <div className="ml-4">
              <Link to="/analytics" className="text-sm font-medium text-success-600 hover:text-success-500 transition-colors duration-200">
                View analytics
              </Link>
            </div>
          </div>
        </div>

        {/* Pending Requests Card (All authenticated users) */}
        <div className="card p-6 bg-gradient-to-br from-white to-orange-50/50 border border-orange-100/50">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-xl bg-gradient-to-r from-warning-500 to-warning-600 p-3 shadow-soft">
                <ClockIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Requests</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      {loading ? (
                        <div className="h-6 w-12 bg-gray-200 animate-pulse rounded"></div>
                      ) : (
                        stats.requests.pending
                      )}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <Link to="/requests" className="text-sm font-medium text-warning-600 hover:text-warning-500 transition-colors duration-200">
                View all requests
              </Link>
            </div>
          </div>
        
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent QR Bundles */}
        <div className="card overflow-hidden bg-gradient-to-br from-white to-slate-50/50 border border-slate-100/50">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-5 border-b border-primary-200/50">
            <h3 className="text-lg leading-6 font-semibold text-white">Recent QR Bundles</h3>
          </div>
          <ul className="divide-y divide-gray-100">
            {loading ? (
              Array(3).fill().map((_, i) => (
                <li key={i} className="px-6 py-4">
                  <div className="h-5 bg-gray-200 rounded-lg animate-pulse w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-100 rounded-lg animate-pulse w-1/2"></div>
                </li>
              ))
            ) : stats.qrBundles.recent.length > 0 ? (
              stats.qrBundles.recent.map((bundle) => (
                <li key={bundle._id} className="px-6 py-4 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all duration-200">
                  <Link to={`/qr-bundles/${bundle._id}`} className="flex items-center group">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-primary-700 truncate group-hover:text-primary-600 transition-colors duration-200">{bundle.title}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {bundle.documents?.length || 0} document(s) • Created {new Date(bundle.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-colors duration-200 ${
                        bundle.accessControl?.isPublic 
                          ? 'bg-gradient-to-r from-success-100 to-success-200 text-success-800 border border-success-300/50' 
                          : 'bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800 border border-primary-300/50'
                      }`}>
                        {bundle.accessControl?.isPublic ? 'Public' : 'Private'}
                      </span>
                      {bundle.accessControl?.hasPasscode && (
                        <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-accent-100 to-accent-200 text-accent-800 border border-accent-300/50">
                          Passcode
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              ))
            ) : (
              <li className="px-6 py-8 text-center text-gray-500">
                <QrCodeIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-sm font-medium">No QR bundles created yet</p>
              </li>
            )}
          </ul>
          {stats.qrBundles.total > 0 && (
            <div className="bg-gradient-to-r from-slate-50 to-blue-50/50 px-6 py-4 border-t border-gray-100">
              <div className="text-sm">
                <Link to="/qr-bundles/create" className="font-semibold text-primary-600 hover:text-primary-500 transition-colors duration-200 inline-flex items-center">
                  Create new QR bundle
                  <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Recent Documents */}
        <div className="card overflow-hidden bg-gradient-to-br from-white to-slate-50/50 border border-slate-100/50">
          <div className="bg-gradient-to-r from-accent-500 to-accent-600 px-6 py-5 border-b border-accent-200/50">
            <h3 className="text-lg leading-6 font-semibold text-white">Recent Documents</h3>
          </div>
          <ul className="divide-y divide-gray-100">
            {loading ? (
              Array(3).fill().map((_, i) => (
                <li key={i} className="px-6 py-4">
                  <div className="h-5 bg-gray-200 rounded-lg animate-pulse w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-100 rounded-lg animate-pulse w-1/2"></div>
                </li>
              ))
            ) : stats.documents.recent.length > 0 ? (
              stats.documents.recent.map((doc) => (
                <li key={doc._id} className="px-6 py-4 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-transparent transition-all duration-200">
                  <Link to={`/documents`} className="flex items-center group">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-accent-700 truncate group-hover:text-accent-600 transition-colors duration-200">{doc.originalName}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {(doc.fileSize / 1024).toFixed(2)} KB • {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      {doc.bundle ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-success-100 to-success-200 text-success-800 border border-success-300/50">
                          In QR Bundle
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-300/50">
                          Unbundled
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              ))
            ) : (
              <li className="px-6 py-8 text-center text-gray-500">
                <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-sm font-medium">No documents uploaded yet</p>
              </li>
            )}
          </ul>
          {stats.documents.total > 0 && (
            <div className="bg-gradient-to-r from-slate-50 to-purple-50/50 px-6 py-4 border-t border-gray-100">
              <div className="text-sm">
                <Link to="/documents/upload" className="font-semibold text-accent-600 hover:text-accent-500 transition-colors duration-200 inline-flex items-center">
                  Upload new documents
                  <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Pending Requests (All authenticated users) */}
        {stats.requests.recent.length > 0 && (
          <div className="card overflow-hidden lg:col-span-2">
            <div className="bg-white px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Pending Document Requests</h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {loading ? (
                Array(3).fill().map((_, i) => (
                  <li key={i} className="px-6 py-4">
                    <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2"></div>
                  </li>
                ))
              ) : (
                stats.requests.recent.map((request) => (
                  <li key={request._id} className="px-6 py-4 hover:bg-gray-50">
                    <Link to={`/requests`} className="flex items-center">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-primary-600 truncate">{request.requestTitle}</p>
                        <p className="text-sm text-gray-500 truncate">
                          From: {request.requesterName} ({request.requesterEmail})
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0 flex">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {request.status}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}

        {/* Empty state for new users */}
        {!loading && stats.documents.total === 0 && stats.qrBundles.total === 0 && (
          <div className="card overflow-hidden lg:col-span-2 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 border border-primary-100/50">
            <div className="flex flex-col items-center justify-center py-16 px-8">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full blur-lg opacity-20 animate-pulse-soft"></div>
                <EyeIcon className="relative h-16 w-16 text-primary-500 animate-float" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-primary-700 to-accent-600 bg-clip-text text-transparent mb-3">
                Welcome to QRLocker!
              </h3>
              <p className="text-center text-gray-600 max-w-md mb-8 leading-relaxed">
                Get started by uploading documents and creating QR bundles for secure, trackable document sharing with advanced analytics.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/documents/upload" className="btn-primary px-6 py-3 text-base hover-lift">
                  <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Documents
                </Link>
                <Link to="/qr-bundles/create" className="btn-outline px-6 py-3 text-base hover-lift">
                  <QrCodeIcon className="mr-2 h-5 w-5" />
                  Create QR Bundle
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;