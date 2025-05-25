import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const [formData, setFormData] = useState(() => {
    // Пытаемся восстановить данные формы из sessionStorage
    const savedForm = sessionStorage.getItem('loginForm');
    return savedForm ? JSON.parse(savedForm) : {
      email: '',
      password: ''
    };
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Обработка редиректа при авторизации
  const handleAuthRedirect = useCallback(() => {
    if (isAuthenticated && user) {
      sessionStorage.removeItem('loginForm');
      const dashboardRoutes = {
        customer: '/customer/dashboard',
        executor: '/executor/dashboard',
        admin: '/admin/dashboard'
      };

      const redirectTo = dashboardRoutes[user.role as keyof typeof dashboardRoutes];
      if (redirectTo) {
        navigate(redirectTo, { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Сохраняем данные формы в sessionStorage при изменении
  useEffect(() => {
    if (!isAuthenticated && !isSubmitting) {
      sessionStorage.setItem('loginForm', JSON.stringify(formData));
    }
  }, [formData, isAuthenticated, isSubmitting]);

  // Проверяем авторизацию только при монтировании
  useEffect(() => {
    handleAuthRedirect();
  }, [handleAuthRedirect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || isSubmitting) return;

    setError('');
    setIsSubmitting(true);
    
    try {
      setLoading(true);
      console.log('Attempting to login with:', { email: formData.email });
      
      // Очищаем старые данные из localStorage перед новым входом
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      await login(formData.email, formData.password);
      handleAuthRedirect();
      
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || err.message || 'Ошибка входа. Пожалуйста, проверьте ваши данные.');
      // Очищаем данные при ошибке
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Войти в аккаунт
          </h2>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Пароль</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Пароль"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </div>
          
          <div className="text-sm text-center">
            <Link to="/register" className="font-medium text-primary hover:text-primary-dark">
              Нет аккаунта? Зарегистрироваться
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
