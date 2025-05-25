import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  role?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ role = 'any' }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role is specified and doesn't match, redirect to appropriate dashboard
  if (role !== 'any' && user?.role !== role) {
    if (user?.role === 'customer') {
      return <Navigate to="/customer/dashboard" replace />;
    } else if (user?.role === 'executor') {
      return <Navigate to="/executor/dashboard" replace />;
    } else if (user?.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }

  // If authenticated and role matches, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
