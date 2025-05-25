import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { authAPI, userAPI } from '../api/api';
import { AxiosError } from 'axios';

interface User {
  id: number;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  city?: string;
  country?: string;
  created_at: string;
  executor_profile?: {
    points: number;
    experience_level: string;
  };
  company_id?: number;
  is_company_admin?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  registerStep1: (userData: { email: string; password: string; role: string }) => Promise<void>;
  registerStep2: (companyData: { name: string; bin: string; address: string }) => Promise<void>;
  updateUser: (userData: User) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const verifyingRef = useRef<boolean>(false);

  // Функция для синхронизации состояния аутентификации
  const updateAuthState = (newUser: User | null, token?: string) => {
    console.log('Updating auth state:', { 
      hasUser: !!newUser, 
      hasToken: !!token,
      userRole: newUser?.role
    });

    if (newUser && token) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      setIsAuthenticated(true);
      setError(null);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    }
  };

  const handleAuthError = (err: unknown) => {
    if (err instanceof AxiosError) {
      const errorMessage = err.response?.data?.error || err.message;
      console.error('Auth error:', {
        status: err.response?.status,
        message: errorMessage,
        data: err.response?.data
      });
      setError(errorMessage);
    } else if (err instanceof Error) {
      console.error('Auth error:', err.message);
      setError(err.message);
    } else {
      console.error('Unknown auth error:', err);
      setError('An unexpected error occurred');
    }
    updateAuthState(null);
  };

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      if (verifyingRef.current) {
        console.log('Verification already in progress, skipping...');
        return;
      }

      console.log('Checking authentication state...');
      verifyingRef.current = true;
      
      try {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (!token || !savedUser) {
          console.log('No stored auth data found');
          updateAuthState(null);
          return;
        }

        // Verify token and get fresh user data
        const response = await authAPI.verifyToken();
        const verificationData = response.data;
        
        if (!verificationData.user_id || !verificationData.role) {
          throw new Error('Invalid verification data received');
        }

        // Проверяем соответствие сохраненных данных с верификацией
        const parsedUser = JSON.parse(savedUser) as User;
        if (parsedUser.id === verificationData.user_id && parsedUser.role === verificationData.role) {
          console.log('Token verification successful, user data matches');
          updateAuthState(parsedUser, token);
        } else {
          console.log('User data mismatch, clearing auth state');
          throw new Error('User data mismatch');
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        updateAuthState(null);
      } finally {
        verifyingRef.current = false;
        setLoading(false);
      }
    };

    checkAuth();

    return () => {
      verifyingRef.current = false;
    };
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Attempting login for:', email);
      const response = await authAPI.login({ email, password });
      
      if (!response.data.token || !response.data.user) {
        throw new Error('Invalid response format from login');
      }
      
      console.log('Login successful:', {
        user: response.data.user,
        hasToken: !!response.data.token
      });
      
      updateAuthState(response.data.user, response.data.token);
      return response.data.user;
    } catch (err) {
      console.error('Login failed:', err);
      updateAuthState(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      console.log('Logging out...');
      
      // Сначала очищаем состояние на клиенте
      updateAuthState(null);
      sessionStorage.removeItem('loginForm');
      
      // Затем делаем запрос на сервер
      await authAPI.logout();
      
      console.log('Logout completed successfully');
    } catch (err) {
      console.error('Logout error:', err);
      // Состояние уже очищено в начале функции
    } finally {
      setLoading(false);
    }
  };

  const registerStep1 = async (userData: { email: string; password: string; role: string }) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Attempting registration step 1:', { email: userData.email, role: userData.role });
      const response = await authAPI.registerStep1(userData);
      
      if (!response.data.token || !response.data.user) {
        throw new Error('Invalid response format from registration');
      }
      
      console.log('Registration step 1 successful:', response.data.user);
      updateAuthState(response.data.user, response.data.token);
    } catch (err) {
      console.error('Registration step 1 failed:', err);
      handleAuthError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerStep2 = async (companyData: { name: string; bin: string; address: string }) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Attempting registration step 2:', companyData);
      const response = await authAPI.registerStep2(companyData);
      
      if (!response.data.user) {
        throw new Error('Invalid response format from registration step 2');
      }
      
      console.log('Registration step 2 successful:', response.data.user);
      updateAuthState(response.data.user);
    } catch (err) {
      console.error('Registration step 2 failed:', err);
      handleAuthError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    registerStep1,
    registerStep2,
    updateUser,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
