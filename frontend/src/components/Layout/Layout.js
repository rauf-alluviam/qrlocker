import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  const { user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-sidebar-gradient shadow-soft-2xl">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto custom-scrollbar">
              <div className="flex items-center flex-shrink-0 px-4">
                <Link to="/" className="flex items-center group transition-transform duration-200 hover:scale-105">
                  <div className="relative">
                    <svg className="h-8 w-auto text-white drop-shadow-sm" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 4H20V20H4V4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M7 7H17V17H7V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10 10H14V14H10V10Z" fill="currentColor" />
                    </svg>
                    <div className="absolute inset-0 bg-white/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  </div>
                  <span className="ml-3 text-white text-xl font-bold tracking-tight drop-shadow-sm">QRLocker</span>
                </Link>
              </div>
              <nav className="mt-8 flex-1 px-3 space-y-2">
                <Sidebar.Navigation />
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-primary-400/20 p-4 bg-gradient-to-r from-primary-600/30 to-primary-800/30 backdrop-blur-sm">
              <div className="flex-shrink-0 w-full group block">
                <div className="flex items-center">
                  <div>
                    <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm text-white border border-white/30 shadow-soft transition-all duration-200 group-hover:bg-white/30 group-hover:scale-105">
                      <span className="text-sm font-bold">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-semibold text-white drop-shadow-sm">{user?.name}</p>
                    <p className="text-xs font-medium text-primary-200 group-hover:text-white transition-colors duration-200">
                      {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <Header setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 relative overflow-y-auto focus:outline-none custom-scrollbar">
          <div className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;