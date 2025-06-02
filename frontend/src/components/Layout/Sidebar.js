import React, { Fragment } from 'react';
import { NavLink } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  HomeIcon,
  DocumentTextIcon,
  QrCodeIcon,
  ChartBarIcon,
  InboxIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../stores/authStore';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  return (
    <>
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 flex z-40 md:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-sidebar-gradient shadow-soft-2xl">
              <Transition.Child
                as={Fragment}
                enter="ease-in-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in-out duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                  <button
                    type="button"
                    className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white backdrop-blur-sm bg-white/10 hover:bg-white/20 transition-colors duration-200"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon className="h-6 w-6 text-white drop-shadow-sm" aria-hidden="true" />
                  </button>
                </div>
              </Transition.Child>
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto custom-scrollbar">
                <div className="flex-shrink-0 flex items-center px-4">
                  <NavLink to="/" className="flex items-center group transition-transform duration-200 hover:scale-105">
                    <div className="relative">
                      <svg className="h-8 w-auto text-white drop-shadow-sm" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 4H20V20H4V4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M7 7H17V17H7V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M10 10H14V14H10V10Z" fill="currentColor" />
                      </svg>
                      <div className="absolute inset-0 bg-white/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                    </div>
                    <span className="ml-3 text-white text-xl font-bold tracking-tight drop-shadow-sm">QRLocker</span>
                  </NavLink>
                </div>
                <nav className="mt-8 px-3 space-y-2">
                  <Sidebar.Navigation />
                </nav>
              </div>
            </div>
          </Transition.Child>
          <div className="flex-shrink-0 w-14">{/* Force sidebar to shrink to fit close icon */}</div>
        </Dialog>
      </Transition.Root>
    </>
  );
};

const Navigation = () => {
  const { user, logout } = useAuthStore();
  
  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon, roles: ['user', 'supervisor', 'admin'] },
    { name: 'Documents', href: '/documents', icon: DocumentTextIcon, roles: ['user', 'supervisor', 'admin'] },
    { name: 'QR Bundles', href: '/qr-bundles', icon: QrCodeIcon, roles: ['user', 'supervisor', 'admin'] },
    // { name: 'Analytics', href: '/analytics', icon: ChartBarIcon, roles: ['user', 'supervisor', 'admin'] },
    // { name: 'Document Requests', href: '/requests', icon: InboxIcon, roles: ['user', 'supervisor', 'admin'] },
    { name: 'Internal Requests', href: '/internal-requests', icon: UsersIcon, roles: ['user', 'supervisor', 'admin'] },
    { name: 'Organizations', href: '/organizations', icon: BuildingOfficeIcon, roles: ['user', 'supervisor', 'admin'] },
    { name: 'Users', href: '/users', icon: UserGroupIcon, roles: ['admin'] },
  ];

  const filteredNavigation = navigation.filter(
    (item) => item.roles.includes(user?.role)
  );

  return (
    <>
      {filteredNavigation.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          className={({ isActive }) =>
            `sidebar-item ${
              isActive
                ? 'sidebar-item-active'
                : 'sidebar-item-inactive'
            }`
          }
        >
          <item.icon
            className="mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200"
            aria-hidden="true"
          />
          <span className="text-sm font-medium">{item.name}</span>
          {({ isActive }) => isActive && (
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-xl pointer-events-none"></div>
          )}
        </NavLink>
      ))}
      <div className="pt-6 mt-6 border-t border-primary-500/30">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `sidebar-item ${
              isActive
                ? 'sidebar-item-active'
                : 'sidebar-item-inactive'
            }`
          }
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-sm font-medium">Profile</span>
        </NavLink>
        <button
          onClick={logout}
          className="w-full mt-2 sidebar-item sidebar-item-inactive group hover:bg-red-500/20 hover:text-red-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </>
  );
};

Sidebar.Navigation = Navigation;

export default Sidebar;