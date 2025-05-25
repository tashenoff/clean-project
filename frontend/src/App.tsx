import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';

// Auth Pages
import Login from './pages/auth/Login';
import RegisterStep1 from './pages/auth/RegisterStep1';
import RegisterStep2 from './pages/auth/RegisterStep2';

// Customer Pages
import CustomerDashboard from './pages/customer/Dashboard';
import CustomerListings from './pages/customer/Listings';
import CustomerListingDetail from './pages/customer/ListingDetail';
import CustomerCreateListing from './pages/customer/CreateListing';
import CustomerProfile from './pages/customer/Profile';

// Executor Pages
import ExecutorDashboard from './pages/executor/Dashboard';
import ExecutorListings from './pages/executor/Listings';
import ExecutorListingDetail from './pages/executor/ListingDetail';
import ExecutorResponses from './pages/executor/Responses';
import ExecutorProfile from './pages/executor/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminCompanies from './pages/admin/Companies';
import AdminUsers from './pages/admin/Users';
import AdminActivityLog from './pages/admin/ActivityLog';

// Company Pages
import CompanyDashboard from './pages/company/Dashboard';
import CompanyEmployees from './pages/company/Employees';
import CompanyBalance from './pages/company/Balance';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import CustomerLayout from './layouts/CustomerLayout';
import ExecutorLayout from './layouts/ExecutorLayout';
import AdminLayout from './layouts/AdminLayout';
import CompanyLayout from './layouts/CompanyLayout';

// Auth Guard
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<RegisterStep1 />} />
              <Route path="/register/company" element={<RegisterStep2 />} />
            </Route>

            {/* Customer Routes */}
            <Route element={
              <ErrorBoundary>
                <ProtectedRoute role="customer" />
              </ErrorBoundary>
            }>
              <Route element={<CustomerLayout />}>
                <Route path="/customer/dashboard" element={<CustomerDashboard />} />
                <Route path="/customer/listings" element={<CustomerListings />} />
                <Route path="/customer/listings/:id" element={<CustomerListingDetail />} />
                <Route path="/customer/listings/create" element={<CustomerCreateListing />} />
                <Route path="/customer/profile" element={<CustomerProfile />} />
              </Route>
            </Route>

            {/* Executor Routes */}
            <Route element={
              <ErrorBoundary>
                <ProtectedRoute role="executor" />
              </ErrorBoundary>
            }>
              <Route element={<ExecutorLayout />}>
                <Route path="/executor/dashboard" element={<ExecutorDashboard />} />
                <Route path="/executor/listings" element={<ExecutorListings />} />
                <Route path="/executor/listings/:id" element={<ExecutorListingDetail />} />
                <Route path="/executor/responses" element={<ExecutorResponses />} />
                <Route path="/executor/profile" element={<ExecutorProfile />} />
              </Route>
            </Route>

            {/* Admin Routes */}
            <Route element={
              <ErrorBoundary>
                <ProtectedRoute role="admin" />
              </ErrorBoundary>
            }>
              <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/companies" element={<AdminCompanies />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/activity-log" element={<AdminActivityLog />} />
              </Route>
            </Route>

            {/* Company Routes */}
            <Route element={
              <ErrorBoundary>
                <ProtectedRoute role="any" />
              </ErrorBoundary>
            }>
              <Route element={<CompanyLayout />}>
                <Route path="/company/:id/dashboard" element={<CompanyDashboard />} />
                <Route path="/company/:id/employees" element={<CompanyEmployees />} />
                <Route path="/company/:id/balance" element={<CompanyBalance />} />
              </Route>
            </Route>

            {/* Redirect root to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Catch all - 404 */}
            <Route path="*" element={
              <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-red-600">404</h1>
                  <p className="text-xl mt-2">Страница не найдена</p>
                  <button 
                    className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
                    onClick={() => window.history.back()}
                  >
                    Вернуться назад
                  </button>
                </div>
              </div>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
