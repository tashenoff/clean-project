import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token in requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors (token expired or invalid)
    if (error.response && error.response.status === 401) {
      // Clear local storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: (credentials: { email: string; password: string }) => {
    return apiClient.post('/auth/login', credentials);
  },
  
  registerStep1: (userData: {
    email: string;
    password: string;
    role: string;
  }) => {
    return apiClient.post('/auth/register/step1', userData);
  },
  
  registerStep2: (companyData: {
    name: string;
    bin: string;
    address: string;
  }) => {
    return apiClient.post('/auth/register/step2', companyData);
  },
  
  logout: () => {
    return apiClient.post('/auth/logout');
  },
  
  verifyToken: () => {
    return apiClient.get('/auth/verify');
  }
};

// User API
export const userAPI = {
  getProfile: () => {
    return apiClient.get('/users/profile');
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
  getListings: (params?: {
    status?: string;
    category?: string;
    page?: number;
    per_page?: number;
  }) => {
    return apiClient.get('/listings', { params });
  },
  
  getMyListings: (params?: {
    status?: string;
    page?: number;
    per_page?: number;
  }) => {
    return apiClient.get('/listings/my', { params });
  },
  
  getListing: (id: number) => {
    return apiClient.get(`/listings/${id}`);
  },
  
  createListing: (listingData: any) => {
    return apiClient.post('/listings', listingData);
  },
  
  updateListing: (id: number, listingData: any) => {
    return apiClient.put(`/listings/${id}`, listingData);
  },
  
  deleteListing: (id: number) => {
    return apiClient.delete(`/listings/${id}`);
  },
  
  changeListingStatus: (id: number, statusData: { status: string }) => {
    return apiClient.put(`/listings/${id}/status`, statusData);
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
  getCompany: (id?: number) => {
    return apiClient.get(id ? `/companies/${id}` : '/companies/my');
  },
  
  updateCompany: (companyData: any) => {
    return apiClient.put('/companies/my', companyData);
  },
  
  getBalance: (id?: number) => {
    return apiClient.get(id ? `/companies/${id}/balance` : '/companies/my/balance');
  },
  
  addBalance: (balanceData: { amount: number; payment_method: string }) => {
    return apiClient.post('/companies/my/balance', balanceData);
  },
  
  getEmployees: () => {
    return apiClient.get('/companies/my/employees');
  },
  
  addEmployee: (employeeData: { email: string; name: string; position: string }) => {
    return apiClient.post('/companies/my/employees', employeeData);
  },
  
  deleteEmployee: (employeeId: number) => {
    return apiClient.delete(`/companies/my/employees/${employeeId}`);
  },
  
  distributeBalance: (distributionData: { distributions: Array<{ employee_id: number; amount: number }> }) => {
    return apiClient.post('/companies/my/balance/distribute', distributionData);
  }
};

// Admin API
export const adminAPI = {
  getStatistics: () => {
    return apiClient.get('/admin/statistics');
  },
  
  getUsers: (params?: {
    role?: string;
    page?: number;
    per_page?: number;
  }) => {
    return apiClient.get('/admin/users', { params });
  },
  
  getUser: (id: number) => {
    return apiClient.get(`/admin/users/${id}`);
  },
  
  updateUser: (id: number, userData: any) => {
    return apiClient.put(`/admin/users/${id}`, userData);
  },
  
  deleteUser: (id: number) => {
    return apiClient.delete(`/admin/users/${id}`);
  },
  
  getCompanies: (params?: {
    status?: string;
    page?: number;
    per_page?: number;
  }) => {
    return apiClient.get('/admin/companies', { params });
  },
  
  updateCompanyStatus: (id: number, statusData: { status: string }) => {
    return apiClient.put(`/admin/companies/${id}/status`, statusData);
  },
  
  getActivityLog: (params?: {
    page?: number;
    per_page?: number;
  }) => {
    return apiClient.get('/admin/activity-log', { params });
  }
};

export default apiClient;
