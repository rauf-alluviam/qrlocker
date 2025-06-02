import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bars3Icon, BellIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../stores/authStore';

const Header = ({ setSidebarOpen }) => {
  const location = useLocation();
  const { user } = useAuthStore();
  
  // Get the current page title based on the path
  const getPageTitle = () => {
    const path = location.pathname;
    
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/documents')) return 'Documents';
    if (path.startsWith('/qr-bundles')) return 'QR Bundles';
    if (path.startsWith('/analytics')) return 'Analytics';
    if (path.startsWith('/requests')) return 'Document Requests';
    if (path.startsWith('/organizations')) return 'Organizations';
    if (path.startsWith('/users')) return 'User Management';
    if (path.startsWith('/profile')) return 'Profile';
    
    return 'QRLocker';
  };

  // Get action button based on the path
  const getActionButton = () => {
    const path = location.pathname;
    
    if (path === '/documents') {
      return (
        <Link to="/documents/upload" className="btn-primary">
          Upload Documents
        </Link>
      );
    }
    
    if (path === '/qr-bundles') {
      return (
        <Link to="/qr-bundles/create" className="btn-primary">
          Create QR Bundle
        </Link>
      );
    }
    
    if (path === '/organizations' && user?.role === 'admin') {
      return (
        <button className="btn-primary">
          Add Organization
        </button>
      );
    }
    
    return null;
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-soft-sm z-10 sticky top-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              type="button"
              className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex md:hidden items-center justify-center rounded-xl text-gray-500 hover:text-primary-600 hover:bg-primary-50/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:bg-primary-50"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
            <div className="flex-shrink-0 flex items-center ml-2 md:ml-0">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                {getPageTitle()}
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex">
              {getActionButton()}
            </div>
            <div className="flex items-center">
              <button
                type="button"
                className="relative p-2 rounded-xl text-gray-500 hover:text-primary-600 hover:bg-primary-50/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 group"
              >
                <span className="sr-only">View notifications</span>
                <BellIcon className="h-6 w-6" aria-hidden="true" />
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white group-hover:ring-primary-50 transition-all duration-200"></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;