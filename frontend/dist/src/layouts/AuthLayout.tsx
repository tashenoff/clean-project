import React from 'react';
import { Outlet } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';

const AuthLayout: React.FC = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Outlet />
      </div>
    </AuthProvider>
  );
};

export default AuthLayout;
