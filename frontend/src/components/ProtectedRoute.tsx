import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  role?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ role = 'any' }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Подробное логирование состояния
  const logState = () => {
    const state = {
      isAuthenticated,
      user,
      loading,
      requiredRole: role,
      currentPath: location.pathname,
      token: localStorage.getItem('token') ? 'exists' : 'missing',
      storedUser: localStorage.getItem('user') ? 'exists' : 'missing'
    };
    console.log('ProtectedRoute State:', state);
    return state;
  };

  try {
    const state = logState();

    // Показываем загрузку
    if (loading) {
      console.log('ProtectedRoute: Loading state');
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }

    // Проверяем аутентификацию
    if (!isAuthenticated || !user) {
      console.log('ProtectedRoute: Authentication check failed', { isAuthenticated, user });
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Проверяем роль
    if (role !== 'any' && user.role !== role) {
      console.log('ProtectedRoute: Role mismatch', {
        required: role,
        actual: user.role
      });
      
      const dashboardRoutes = {
        customer: '/customer/dashboard',
        executor: '/executor/dashboard',
        admin: '/admin/dashboard'
      };

      // Если пользователь пытается получить доступ к неправильному маршруту,
      // перенаправляем его на соответствующий дашборд
      const redirectTo = dashboardRoutes[user.role as keyof typeof dashboardRoutes];
      
      if (redirectTo) {
        console.log('ProtectedRoute: Redirecting to correct dashboard:', redirectTo);
        return <Navigate to={redirectTo} replace />;
      } else {
        console.error('ProtectedRoute: Unknown user role:', user.role);
        return <Navigate to="/login" state={{ from: location }} replace />;
      }
    }

    // Если все проверки пройдены, отображаем защищенный контент
    console.log('ProtectedRoute: Access granted for path:', location.pathname);
    return <Outlet />;
  } catch (error) {
    console.error('ProtectedRoute: Unexpected error', error);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
};

export default ProtectedRoute;
