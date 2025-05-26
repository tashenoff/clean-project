import axios, { AxiosError } from 'axios';

/// <reference types="vite/client" />

// Объявляем типы для Vite env
declare global {
  interface ImportMetaEnv {
    VITE_API_URL: string;
  }
}

// В режиме разработки используем process.env, в продакшене import.meta.env
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log('API URL:', API_URL); // Для отладки

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Добавляем таймаут
  timeout: 10000,
});

// Add request interceptor to include auth token in requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    console.log('Request Config:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    console.log('Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error: AxiosError) => {
    // Логируем детали ошибки
    console.error('API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data
      }
    });

    // Handle specific error cases
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Unauthorized - clear storage and reload page
          console.error('Unauthorized error - clearing auth data');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;
        case 403:
          // Forbidden - user doesn't have permission
          console.error('Permission denied');
          break;
        case 404:
          // Not found
          console.error('Resource not found');
          break;
        case 422:
          // Validation error
          console.error('Validation error:', error.response.data);
          break;
        case 500:
          // Server error
          console.error('Server error:', error.response.data);
          break;
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('No response received:', {
        request: error.request,
        config: error.config
      });
    } else {
      // Error in request configuration
      console.error('Request configuration error:', error.message);
    }

    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: async (credentials: { email: string; password: string }) => {
    console.log('Attempting login with:', { email: credentials.email });
    try {
      const response = await apiClient.post('/auth/login', credentials);
      console.log('Login response:', response.data);
      
      // Проверяем структуру ответа
      if (!response.data || !response.data.token || !response.data.user) {
        console.error('Invalid login response format:', response.data);
        throw new Error('Invalid response format from server');
      }
      
      // Проверяем наличие необходимых полей у пользователя
      if (!response.data.user.role) {
        console.error('User data missing role:', response.data.user);
        throw new Error('Invalid user data from server');
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  verifyToken: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }

    try {
      const response = await apiClient.get('/auth/verify');
      
      // Проверяем структуру ответа
      if (!response.data || !response.data.user_id || !response.data.role) {
        throw new Error('Invalid response format from server');
      }

      // Получаем полные данные пользователя
      const userResponse = await userAPI.getProfile();
      
      return {
        ...response,
        data: {
          ...response.data,
          user: userResponse.data
        }
      };
    } catch (error) {
      console.error('Token verification error:', error);
      throw error;
    }
  },
  
  logout: async () => {
    try {
      const response = await apiClient.post('/auth/logout');
      return response;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },
  
  registerStep1: async (userData: {
    email: string;
    password: string;
    role: string;
    phone?: string;
    city?: string;
    country?: string;
  }) => {
    try {
      const response = await apiClient.post('/auth/register/step1', userData);
      return response;
    } catch (error) {
      console.error('Registration Step 1 error:', error);
      throw error;
    }
  },
  
  registerStep2: async (companyData: {
    user_id: number;
    company_name: string;
    bin: string;
    address: string;
  }) => {
    try {
      const response = await apiClient.post('/auth/register/step2', companyData);
      return response;
    } catch (error) {
      console.error('Registration Step 2 error:', error);
      throw error;
    }
  }
};

// User API
export const userAPI = {
  getProfile: () => {
    return apiClient.get('/users/profile');
  },
  
  getBalance: () => {
    return apiClient.get('/users/balance');
  },
  
  updateProfile: (profileData: any) => {
    return apiClient.put('/users/profile', profileData);
  },
  
  changePassword: (passwordData: { current_password: string; new_password: string }) => {
    return apiClient.put('/users/password', passwordData);
  },
  
  getActivity: () => {
    return apiClient.get('/users/activity');
  }
};

// Listings API
export const listingsAPI = {
  getListings: async (params?: {
    status?: string;
    category?: string;
    page?: number;
    per_page?: number;
  }) => {
    try {
      console.log('Fetching listings with params:', params);
      const response = await apiClient.get('/listings', { params });
      return response;
    } catch (error) {
      console.error('Error fetching listings:', error);
      throw error;
    }
  },
  
  getMyListings: async (params?: {
    status?: string;
    page?: number;
    per_page?: number;
  }) => {
    try {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      console.log('Fetching my listings:', {
        params,
        hasToken: !!token,
        user: user ? JSON.parse(user) : null,
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined
        }
      });
      
      const response = await apiClient.get('/listings/my-listings', { params });
      
      console.log('My listings response:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        listingsCount: response.data?.listings?.length
      });
      
      return response;
    } catch (error: any) {
      console.error('Error fetching my listings:', {
        error: {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        },
        params,
        user: localStorage.getItem('user')
      });
      throw error;
    }
  },
  
  getListing: async (id: number) => {
    try {
      console.log('Fetching listing details for ID:', id);
      const response = await apiClient.get(`/listings/${id}`);
      console.log('API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      });
      return response;
    } catch (error: any) {
      console.error('Error fetching listing details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      throw error;
    }
  },
  
  createListing: async (listingData: {
    title: string;
    description: string;
    category: string;
    budget?: string;
    location?: string;
    deadline?: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    status: 'published' | 'unpublished';
    purchase_method: string;
    payment_terms: string;
    listing_type: string;
    delivery_date: string;
    publication_period: string;
  }) => {
    try {
      // Валидация обязательных полей
      if (!listingData.title?.trim()) {
        throw new Error('Title is required');
      }
      if (!listingData.description?.trim()) {
        throw new Error('Description is required');
      }
      if (!listingData.category?.trim()) {
        throw new Error('Category is required');
      }
      if (!listingData.purchase_method?.trim()) {
        throw new Error('Purchase method is required');
      }
      if (!listingData.payment_terms?.trim()) {
        throw new Error('Payment terms is required');
      }
      if (!listingData.listing_type?.trim()) {
        throw new Error('Listing type is required');
      }
      if (!listingData.delivery_date?.trim()) {
        throw new Error('Delivery date is required');
      }
      if (!listingData.publication_period?.trim()) {
        throw new Error('Publication period is required');
      }

      console.log('Creating listing:', listingData);
      
      // Форматируем данные перед отправкой
      const formattedData = {
        ...listingData,
        budget: listingData.budget ? Number(listingData.budget) : undefined,
        deadline: listingData.deadline || undefined,
        contact_name: listingData.contact_name?.trim() || undefined,
        contact_email: listingData.contact_email?.trim() || undefined,
        contact_phone: listingData.contact_phone?.trim() || undefined,
        publication_period: Number(listingData.publication_period)
      };

      const response = await apiClient.post('/listings', formattedData);
      console.log('Listing created successfully:', response.data);
      return response;
    } catch (error) {
      console.error('Error creating listing:', error);
      throw error;
    }
  },
  
  updateListing: async (id: number, listingData: {
    title: string;
    description: string;
    category: string;
    budget?: string;
    location?: string;
    deadline?: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    status: 'published' | 'unpublished';
    purchase_method: string;
    payment_terms: string;
    listing_type: string;
    delivery_date: string;
    publication_period: string;
  }) => {
    try {
      // Валидация обязательных полей
      if (!listingData.title?.trim()) {
        throw new Error('Title is required');
      }
      if (!listingData.description?.trim()) {
        throw new Error('Description is required');
      }
      if (!listingData.category?.trim()) {
        throw new Error('Category is required');
      }
      if (!listingData.purchase_method?.trim()) {
        throw new Error('Purchase method is required');
      }
      if (!listingData.payment_terms?.trim()) {
        throw new Error('Payment terms is required');
      }
      if (!listingData.listing_type?.trim()) {
        throw new Error('Listing type is required');
      }
      if (!listingData.delivery_date?.trim()) {
        throw new Error('Delivery date is required');
      }
      if (!listingData.publication_period?.trim()) {
        throw new Error('Publication period is required');
      }

      console.log('Updating listing:', { id, data: listingData });
      
      // Форматируем данные перед отправкой
      const formattedData = {
        ...listingData,
        budget: listingData.budget ? Number(listingData.budget) : undefined,
        deadline: listingData.deadline || undefined,
        contact_name: listingData.contact_name?.trim() || undefined,
        contact_email: listingData.contact_email?.trim() || undefined,
        contact_phone: listingData.contact_phone?.trim() || undefined,
        publication_period: Number(listingData.publication_period)
      };

      const response = await apiClient.put(`/listings/${id}`, formattedData);
      console.log('Listing updated successfully:', response.data);
      return response;
    } catch (error) {
      console.error('Error updating listing:', error);
      throw error;
    }
  },
  
  deleteListing: async (id: number) => {
    try {
      console.log('Deleting listing:', id);
      const response = await apiClient.delete(`/listings/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting listing:', error);
      throw error;
    }
  },
  
  changeListingStatus: async (id: number, statusData: { status: 'published' | 'unpublished' | 'closed' | 'cancelled' }) => {
    try {
      console.log('Changing listing status:', { id, status: statusData.status });
      const response = await apiClient.put(`/listings/${id}/status`, statusData);
      return response;
    } catch (error) {
      console.error('Error changing listing status:', error);
      throw error;
    }
  }
};

// Responses API
export const responsesAPI = {
  getListingResponses: (listingId: number) => {
    return apiClient.get(`/listings/${listingId}/responses`);
  },
  
  getMyResponses: (params?: {
    status?: string;
    listing_id?: number;
    page?: number;
    per_page?: number;
  }) => {
    return apiClient.get('/responses/my-responses', { params });
  },
  
  createResponse: (listingId: number, responseData: { message?: string }) => {
    return apiClient.post(`/listings/${listingId}/responses`, responseData);
  },
  
  updateResponseStatus: (responseId: number, statusData: { status: 'accepted' | 'rejected' }) => {
    return apiClient.put(`/responses/${responseId}/status`, statusData);
  },
  
  deleteResponse: (responseId: number) => {
    return apiClient.delete(`/responses/${responseId}`);
  }
};

// Company API
export const companyAPI = {
  getCompanyProfile: () => {
    return apiClient.get('/companies/profile');
  },
  
  getCompanyById: (id: number) => {
    return apiClient.get(`/companies/${id}`);
  },
  
  updateCompanyProfile: (profileData: any) => {
    return apiClient.put('/companies/profile', profileData);
  },
  
  getEmployees: (companyId: number) => {
    return apiClient.get(`/companies/${companyId}`);
  },
  
  addEmployee: (employeeData: any) => {
    return apiClient.post(`/companies/${employeeData.company_id}/employees`, employeeData);
  },
  
  removeEmployee: (employeeId: number) => {
    return apiClient.delete(`/companies/employees/${employeeId}`);
  },

  getBalance: (companyId: number) => {
    return apiClient.get(`/companies/${companyId}/balance`);
  },

  addBalance: (companyId: number, data: { amount: number }) => {
    return apiClient.post(`/companies/${companyId}/balance`, data);
  },

  addEmployeeBalance: async (companyId: number, userId: number, data: { amount: number, description?: string }) => {
    try {
      // Добавляем баланс сотруднику
      await apiClient.post(`/companies/${companyId}/employees/${userId}/balance`, data);
      
      // Получаем обновленный баланс пользователя
      const balanceResponse = await userAPI.getBalance();
      return balanceResponse;
    } catch (error) {
      console.error('Error adding employee balance:', error);
      throw error;
    }
  }
};

// Admin API
export const adminAPI = {
  getUsers: () => {
    return apiClient.get('/admin/users');
  },
  
  getCompanies: () => {
    return apiClient.get('/admin/companies');
  },
  
  getActivityLog: () => {
    return apiClient.get('/admin/activity-log');
  },
  
  updateUserStatus: (userId: number, status: string) => {
    return apiClient.put(`/admin/users/${userId}/status`, { status });
  }
};

export default apiClient;