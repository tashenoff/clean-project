import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ExecutorLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      // Добавляем небольшую задержку, чтобы убедиться, что состояние очистилось
      await new Promise(resolve => setTimeout(resolve, 100));
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      // Даже в случае ошибки, перенаправляем на страницу входа
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-primary">INEED</h1>
          </div>
          <div className="flex items-center space-x-4">
            {user?.executor_profile && (
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-secondary rounded-full text-white text-xs font-medium">
                  {user.executor_profile.experience_level}
                </span>
                <span className="px-3 py-1 bg-primary rounded-full text-white text-xs font-medium">
                  {user.executor_profile.points} points
                </span>
              </div>
            )}
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
              to="/executor/dashboard"
              className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Dashboard
            </Link>
            <Link
              to="/executor/listings"
              className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Available Listings
            </Link>
            <Link
              to="/executor/responses"
              className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              My Responses
            </Link>
            <Link
              to="/executor/profile"
              className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Profile
            </Link>
            {user?.company && (
              <Link
                to={`/company/${user.company.id}/dashboard`}
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                Company
              </Link>
            )}
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

export default ExecutorLayout;
