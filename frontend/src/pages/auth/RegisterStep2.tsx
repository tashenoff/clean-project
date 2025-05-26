import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authAPI, userAPI } from '../../api/api';
import { useAuth } from '../../contexts/AuthContext';

interface LocationState {
  userId: number;
  userRole: string;
  email?: string;
}

const RegisterStep2: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  const { user, login } = useAuth();
  
  const [formData, setFormData] = useState({
    user_id: 0,
    company_name: '',
    bin: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if we have user_id from step 1
    const userId = state?.userId || localStorage.getItem('userId');
    
    if (!userId) {
      // If no user ID, redirect back to step 1
      navigate('/register');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      user_id: Number(userId)
    }));
  }, [state, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      setLoading(true);
      
      // Submit registration step 2
      await authAPI.registerStep2({
        user_id: formData.user_id,
        company_name: formData.company_name,
        bin: formData.bin,
        address: formData.address
      });

      // Получаем временный пароль из localStorage
      const tempPassword = localStorage.getItem('tempPassword');
      if (!tempPassword) {
        throw new Error('Missing temporary password');
      }

      // Получаем email из state или localStorage
      const userEmail = state?.email || localStorage.getItem('userEmail');
      if (!userEmail) {
        throw new Error('Missing email');
      }

      // Переавторизуемся для обновления данных в контексте
      await login(userEmail, tempPassword);
      
      // Determine where to redirect based on user role
      const userRole = state?.userRole || localStorage.getItem('userRole');
      
      // Очищаем временные данные
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
      localStorage.removeItem('tempPassword');
      
      if (userRole === 'customer') {
        navigate('/customer/dashboard');
      } else if (userRole === 'executor') {
        navigate('/executor/dashboard');
      } else {
        navigate('/login');
      }
      
    } catch (err: any) {
      console.error('Company registration error:', err);
      setError(err.response?.data?.error || 'Company registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const skipCompanyRegistration = () => {
    // Clear temporary storage
    localStorage.removeItem('userId');
    
    // Redirect to login
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Complete your registration
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Step 2: Company Information
          </p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="company_name" className="sr-only">Company Name</label>
              <input
                id="company_name"
                name="company_name"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Company Name"
                value={formData.company_name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="bin" className="sr-only">Business Identification Number</label>
              <input
                id="bin"
                name="bin"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Business Identification Number (BIN)"
                value={formData.bin}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="address" className="sr-only">Company Address</label>
              <input
                id="address"
                name="address"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Company Address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Processing...' : 'Complete Registration'}
            </button>
            
            <button
              type="button"
              onClick={skipCompanyRegistration}
              className="text-sm text-primary hover:text-primary-dark focus:outline-none"
            >
              Skip this step for now
            </button>
          </div>
          
          <div className="text-sm text-center">
            <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterStep2;
