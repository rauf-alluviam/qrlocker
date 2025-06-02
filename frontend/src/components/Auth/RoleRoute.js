import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const RoleRoute = ({ roles, children }) => {
  const { user } = useAuthStore();
  
  // Check if user exists and has one of the required roles
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RoleRoute;