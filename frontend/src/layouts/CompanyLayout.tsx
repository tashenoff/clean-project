import React from 'react';
import { Outlet, Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const CompanyLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { id: companyId } = useParams<{ id: string }>();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Determine return path based on user role
  const getReturnPath = () => {
    if (user?.role === 'customer' || user?.role === 'executor') {
      return `/${user.role}/dashboard`;
    } else if (user?.role === 'admin') {
      return '/admin/dashboard';
    }
    return '/login';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-primary">INEED</h1>
            <span className="ml-2 px-2 py-1 bg-secondary text-white text-xs rounded-md">COMPANY</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 h-12">
            <Link
              to={getReturnPath()}
              className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              ← Back to Dashboard
            </Link>
            <Link
              to={`/company/${companyId}/dashboard`}
              className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Company Dashboard
            </Link>
            <Link
              to={`/company/${companyId}/employees`}
              className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Employees
            </Link>
            <Link
              to={`/company/${companyId}/balance`}
              className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Balance
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white shadow-inner mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            &copy; 2025 INEED. All rights reserved
          </p>
        </div>
      </footer>
    </div>
  );
};

export default CompanyLayout;
