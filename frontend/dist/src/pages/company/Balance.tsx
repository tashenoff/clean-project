import React, { useState, useEffect } from 'react';
import { companyAPI } from '../../api/api';

const CompanyBalance: React.FC = () => {
  const [balance, setBalance] = useState({
    current: 0,
    max: 0,
    used: 0
  });
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    amount: '',
    payment_method: 'credit_card'
  });
  const [distributionData, setDistributionData] = useState<{[key: number]: string}>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDistributeForm, setShowDistributeForm] = useState(false);

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      
      // Fetch company balance
      const balanceResponse = await companyAPI.getBalance();
      setBalance({
        current: balanceResponse.data.current_balance,
        max: balanceResponse.data.max_balance,
        used: balanceResponse.data.used_balance
      });
      
      // Fetch employees
      const employeesResponse = await companyAPI.getEmployees();
      setEmployees(employeesResponse.data.employees);
      
      // Initialize distribution data
      const initialDistribution: {[key: number]: string} = {};
      employeesResponse.data.employees.forEach((employee: any) => {
        initialDistribution[employee.id] = '0';
      });
      setDistributionData(initialDistribution);
    } catch (error) {
      console.error('Error fetching company data:', error);
      setError('Failed to load company data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleDistributionChange = (employeeId: number, value: string) => {
    setDistributionData(prevState => ({
      ...prevState,
      [employeeId]: value
    }));
  };

  const handleAddBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      setLoading(true);
      await companyAPI.addBalance({
        amount: parseInt(formData.amount),
        payment_method: formData.payment_method
      });
      
      // Reset form and refresh data
      setFormData({
        amount: '',
        payment_method: 'credit_card'
      });
      setShowAddForm(false);
      setSuccess('Balance added successfully!');
      
      // Refresh company data
      fetchCompanyData();
    } catch (err: any) {
      console.error('Error adding balance:', err);
      setError(err.response?.data?.error || 'Failed to add balance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDistributeBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Calculate total distribution
    const totalDistribution = Object.values(distributionData).reduce(
      (sum, value) => sum + parseInt(value || '0'), 0
    );
    
    if (totalDistribution > balance.current) {
      setError(`Cannot distribute more than available balance (${balance.current} points).`);
      return;
    }
    
    try {
      setLoading(true);
      
      // Format distribution data for API
      const distributions = Object.entries(distributionData).map(([employeeId, amount]) => ({
        employee_id: parseInt(employeeId),
        amount: parseInt(amount || '0')
      })).filter(item => item.amount > 0);
      
      await companyAPI.distributeBalance({ distributions });
      
      // Reset form and refresh data
      setShowDistributeForm(false);
      setSuccess('Balance distributed successfully!');
      
      // Refresh company data
      fetchCompanyData();
    } catch (err: any) {
      console.error('Error distributing balance:', err);
      setError(err.response?.data?.error || 'Failed to distribute balance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Company Balance</h1>
        <div className="space-x-2">
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setShowDistributeForm(false);
            }}
            className="bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-md"
          >
            {showAddForm ? 'Cancel' : 'Add Balance'}
          </button>
          <button
            onClick={() => {
              setShowDistributeForm(!showDistributeForm);
              setShowAddForm(false);
            }}
            disabled={balance.current === 0 || employees.length === 0}
            className="bg-secondary hover:bg-secondary-dark text-white py-2 px-4 rounded-md disabled:opacity-50"
          >
            {showDistributeForm ? 'Cancel' : 'Distribute Balance'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6" role="alert">
          <span className="block sm:inline">{success}</span>
        </div>
      )}
      
      {/* Balance Overview */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-lg font-semibold mb-4">Balance Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Available Balance</h3>
            <p className="text-2xl font-bold text-primary">{balance.current} points</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Maximum Balance</h3>
            <p className="text-2xl font-bold">{balance.max} points</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Used Balance</h3>
            <p className="text-2xl font-bold text-secondary">{balance.used} points</p>
          </div>
        </div>
      </div>
      
      {/* Add Balance Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h2 className="text-lg font-semibold mb-4">Add Balance</h2>
          <form onSubmit={handleAddBalance}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (points) *
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="Enter amount"
                />
              </div>
              
              <div>
                <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method *
                </label>
                <select
                  id="payment_method"
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                >
                  <option value="credit_card">Credit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Add Balance'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Distribute Balance Form */}
      {showDistributeForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h2 className="text-lg font-semibold mb-4">Distribute Balance</h2>
          <form onSubmit={handleDistributeBalance}>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Available balance: <span className="font-medium">{balance.current} points</span>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Allocate points to employees below. Total allocation cannot exceed available balance.
              </p>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Position
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Points to Allocate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {employees.map((employee) => (
                      <tr key={employee.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {employee.position}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {employee.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            value={distributionData[employee.id] || '0'}
                            onChange={(e) => handleDistributionChange(employee.id, e.target.value)}
                            min="0"
                            max={balance.current.toString()}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium">
                Total Allocation: {Object.values(distributionData).reduce(
                  (sum, value) => sum + parseInt(value || '0'), 0
                )} points
              </div>
              <button
                type="submit"
                disabled={loading || Object.values(distributionData).reduce(
                  (sum, value) => sum + parseInt(value || '0'), 0
                ) === 0}
                className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary-dark disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Distribute Balance'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Transaction History */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Transaction History</h2>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Transaction history will be displayed here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyBalance;
