import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { authAPI, userAPI } from '../api/api';
import { AxiosError } from 'axios';

interface User {
  id: number;
  email: string;
  role: string;
  balance?: number;
  company_role?: 'owner' | 'admin' | 'manager' | 'employee';
  first_name?: string;
  last_name?: string;
  phone?: string;
  city?: string;
  country?: string;
  created_at?: string;
  executor_profile?: {
    points: number;
    experience_level: string;
  };
  company?: {
    id: number;
    name: string;
    bin: string;
    address: string;
    status: string;
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
  updateUserBalance: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('token');
  });
  const verifyingRef = useRef<boolean>(false);
  const verificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Функция для синхронизации состояния аутентификации
  const updateAuthState = (newUser: User | null, token?: string) => {
    console.log('Updating auth state:', { 
      hasUser: !!newUser, 
      hasToken: !!token,
      userRole: newUser?.role 
    });

    if (token) {
      localStorage.setItem('token', token);
    }

    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Функция для верификации токена
  const verifyToken = async () => {
    if (verifyingRef.current) {
      console.log('Verification already in progress, skipping');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, clearing auth state');
      updateAuthState(null);
      setLoading(false);
      return;
    }

    try {
      verifyingRef.current = true;
      console.log('Starting token verification');
      
      const response = await authAPI.verifyToken();
      const verifiedData = response.data;
      
      // Если у нас есть сохраненные данные пользователя, объединяем их с данными верификации
      const storedUser = localStorage.getItem('user');
      const currentUser = storedUser ? JSON.parse(storedUser) : null;
      
      if (currentUser && verifiedData.user_id === currentUser.id) {
        // Обновляем только критические поля из верификации
        const updatedUser = {
          ...currentUser,
          role: verifiedData.role
        };

        // Если пользователь - исполнитель, загружаем его баланс
        if (verifiedData.role === 'executor') {
          try {
            const balanceResponse = await userAPI.getBalance();
            updatedUser.balance = balanceResponse.data.balance;
          } catch (error) {
            console.error('Failed to load balance:', error);
          }
        }

        updateAuthState(updatedUser);
      } else {
        // Если нет сохраненных данных или ID не совпадает, используем данные верификации
        const newUser: User = {
          id: verifiedData.user_id,
          role: verifiedData.role,
          email: verifiedData.email || '',
        };

        // Если пользователь - исполнитель, загружаем его баланс
        if (verifiedData.role === 'executor') {
          try {
            const balanceResponse = await userAPI.getBalance();
            newUser.balance = balanceResponse.data.balance;
          } catch (error) {
            console.error('Failed to load balance:', error);
          }
        }

        updateAuthState(newUser);
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      updateAuthState(null);
    } finally {
      verifyingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    // Очищаем предыдущий таймаут при размонтировании
    return () => {
      if (verificationTimeoutRef.current) {
        clearTimeout(verificationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Запускаем верификацию только если есть токен
    if (localStorage.getItem('token')) {
      // Добавляем небольшую задержку перед верификацией
      verificationTimeoutRef.current = setTimeout(() => {
        verifyToken();
      }, 100);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      setError(null);
      const response = await authAPI.login({ email, password });
      const { user: newUser, token } = response.data;

      // Если пользователь - исполнитель, загружаем его баланс
      if (newUser.role === 'executor') {
        try {
          const balanceResponse = await userAPI.getBalance();
          newUser.balance = balanceResponse.data.balance;
        } catch (error) {
          console.error('Failed to load balance:', error);
        }
      }

      updateAuthState(newUser, token);
      return newUser;
    } catch (error) {
      const message = error instanceof AxiosError 
        ? error.response?.data?.error || 'Login failed'
        : 'An unexpected error occurred';
      setError(message);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      updateAuthState(null);
    }
  };

  const registerStep1 = async (userData: { email: string; password: string; role: string }): Promise<void> => {
    try {
      setError(null);
      const response = await authAPI.registerStep1(userData);
      const { user: newUser, token } = response.data;

      // Если пользователь - исполнитель, загружаем его баланс
      if (newUser.role === 'executor') {
        try {
          const balanceResponse = await userAPI.getBalance();
          newUser.balance = balanceResponse.data.balance;
        } catch (error) {
          console.error('Failed to load balance:', error);
        }
      }

      updateAuthState(newUser, token);
    } catch (error) {
      const message = error instanceof AxiosError 
        ? error.response?.data?.error || 'Registration failed'
        : 'An unexpected error occurred';
      setError(message);
      throw error;
    }
  };

  const registerStep2 = async (companyData: { name: string; bin: string; address: string }): Promise<void> => {
    try {
      setError(null);
      const userId = user?.id;
      if (!userId) {
        throw new Error('User ID is required for company registration');
      }
      
      const response = await authAPI.registerStep2({
        user_id: userId,
        company_name: companyData.name,
        bin: companyData.bin,
        address: companyData.address
      });
      const { user: updatedUser } = response.data;

      // Если пользователь - исполнитель, загружаем его баланс
      if (updatedUser.role === 'executor') {
        try {
          const balanceResponse = await userAPI.getBalance();
          updatedUser.balance = balanceResponse.data.balance;
        } catch (error) {
          console.error('Failed to load balance:', error);
        }
      }

      updateAuthState(updatedUser);
    } catch (error) {
      const message = error instanceof AxiosError 
        ? error.response?.data?.error || 'Company registration failed'
        : 'An unexpected error occurred';
      setError(message);
      throw error;
    }
  };

  const updateUserBalance = async () => {
    if (user?.role === 'executor') {
      try {
        const balanceResponse = await userAPI.getBalance();
        const updatedUser = { ...user, balance: balanceResponse.data.balance };
        updateAuthState(updatedUser);
      } catch (error) {
        console.error('Failed to update balance:', error);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated,
        login,
        logout,
        registerStep1,
        registerStep2,
        updateUserBalance
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
