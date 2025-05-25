import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, userAPI } from '../api/api';

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
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  registerStep1: (userData: { email: string; password: string; role: string }) => Promise<void>;
  registerStep2: (companyData: { name: string; bin: string; address: string }) => Promise<void>;
  updateUser: (userData: User) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [initialCheckDone, setInitialCheckDone] = useState<boolean>(false);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Verify token and get user data
          const response = await authAPI.verifyToken();
          setUser(response.data.user);
        } catch (err) {
          // Token invalid or expired
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
      setInitialCheckDone(true);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.login({ email, password });
      
      // Save token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      setUser(response.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      // Call logout API
      await authAPI.logout();
      
      // Clear local storage and state
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      
      // Even if API call fails, clear local storage and state
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const registerStep1 = async (userData: { email: string; password: string; role: string }) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.registerStep1(userData);
      
      // Save token and partial user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      setUser(response.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerStep2 = async (companyData: { name: string; bin: string; address: string }) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.registerStep2(companyData);
      
      // Update user data with company info
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      setUser(response.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Company registration failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: loading && !initialCheckDone,
        error,
        login,
        logout,
        registerStep1,
        registerStep2,
        updateUser,
        clearError
      }}
    >
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
