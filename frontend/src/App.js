import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout/Layout';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import DocumentsList from './pages/Documents/DocumentsList';
import DocumentUpload from './pages/Documents/DocumentUpload';
import DocumentView from './pages/Documents/DocumentView';
import QRBundlesList from './pages/QRBundles/QRBundlesList';
import QRBundleCreate from './pages/QRBundles/QRBundleCreate';
import QRBundleView from './pages/QRBundles/QRBundleView';
import QRScanView from './pages/QRScan/QRScanView';
import PasscodeEntry from './pages/QRScan/PasscodeEntry';
import Analytics from './pages/Analytics/Analytics';
import DocumentRequestsList from './pages/Requests/DocumentRequestsList';
import DocumentRequestCreate from './pages/Requests/DocumentRequestCreate';
import InternalRequestsList from './pages/Requests/InternalRequestsList';
import PublicLanding from './pages/Public/PublicLanding';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import RoleRoute from './components/Auth/RoleRoute';
import OrganizationsList from './pages/Organizations/OrganizationsList';
import DepartmentsList from './pages/Organizations/DepartmentsList';
import UserManagement from './pages/Admin/UserManagement';
import NotFound from './pages/NotFound';
import Profile from './pages/Auth/Profile';

function App() {
  const { checkAuth, isInitialized } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) {
      checkAuth();
    }
  }, [checkAuth, isInitialized]);

  // Show loading screen while initializing authentication
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/public" element={<PublicLanding />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/request" element={<DocumentRequestCreate />} />
      
      {/* Public QR Scan Routes */}
      <Route path="/scan/:uuid" element={<QRScanView />} />
      <Route path="/qr/:uuid" element={<QRScanView />} />

      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="documents" element={<DocumentsList />} />
        <Route path="documents/upload" element={<DocumentUpload />} />
        <Route path="documents/:id" element={<DocumentView />} />
        <Route path="qr-bundles" element={<QRBundlesList />} />
        <Route path="qr-bundles/create" element={<QRBundleCreate />} />
        <Route path="qr-bundles/:id" element={<QRBundleView />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="requests" element={<DocumentRequestsList />} />
        <Route path="internal-requests" element={<InternalRequestsList />} />
        
        {/* Routes accessible to all authenticated users */}
        <Route path="organizations" element={<OrganizationsList />} />
        <Route path="organizations/:id/departments" element={<DepartmentsList />} />
        
        {/* Admin Only Routes */}
        <Route 
          path="users" 
          element={<RoleRoute roles={['admin']}><UserManagement /></RoleRoute>} 
        />
      </Route>

      {/* 404 and redirects */}
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

export default App;