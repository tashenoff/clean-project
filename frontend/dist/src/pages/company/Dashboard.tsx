import React, { useEffect, useState } from 'react';
import { companyAPI } from '../../api/api';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const CompanyDashboard: React.FC = () => {
  const { id: companyId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [company, setCompany] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [balance, setBalance] = useState({
    current: 0,
    max: 0,
    used: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!companyId) return;
      
      try {
        // Fetch company details
        const companyResponse = await companyAPI.getCompany(Number(companyId));
        setCompany(companyResponse.data);
        
        // Fetch company balance
        const balanceResponse = await companyAPI.getBalance(Number(companyId));
        setBalance({
          current: balanceResponse.data.current_balance,
          max: balanceResponse.data.max_balance,
          used: balanceResponse.data.used_balance
        });
        
        // For a real implementation, we would fetch employees from an API endpoint
        // This is a placeholder that would be replaced with real API calls
        setEmployees([
          { id: 1, name: 'John Doe', position: 'Manager', email: 'john@example.com', date_added: '2025-01-15' },
          { id: 2, name: 'Jane Smith', position: 'Developer', email: 'jane@example.com', date_added: '2025-02-20' },
          { id: 3, name: 'Bob Johnson', position: 'Designer', email: 'bob@example.com', date_added: '2025-03-10' }
        ]);
      } catch (error) {
        console.error('Error fetching company data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [companyId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> Company not found or you don't have access.</span>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Company Dashboard</h1>
      
      {/* Company Info */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold mb-2">{company.name}</h2>
            <p className="text-gray-600 mb-1">
              <span className="font-medium">BIN:</span> {company.bin}
            </p>
            <p className="text-gray-600 mb-1">
              <span className="font-medium">Address:</span> {company.address}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Status:</span>{' '}
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                company.status === 'approved' ? 'bg-green-100 text-green-800' :
                company.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {company.status.toUpperCase()}
              </span>
            </p>
          </div>
          <div className="text-right">
            <div className="bg-primary text-white px-4 py-2 rounded-lg">
              <div className="text-sm">Balance</div>
              <div className="text-2xl font-bold">{balance.current} / {balance.max}</div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Used: {balance.used} points
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Employees</h3>
          <p className="text-2xl font-bold">{employees.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Available Balance</h3>
          <p className="text-2xl font-bold text-primary">{balance.current}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Used Balance</h3>
          <p className="text-2xl font-bold text-secondary">{balance.used}</p>
        </div>
      </div>
      
      {/* Recent Employees */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Recent Employees</h2>
          <button className="text-primary hover:text-primary-dark text-sm font-medium">
            View All
          </button>
        </div>
        
        {employees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Added
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{employee.position}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{employee.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(employee.date_added).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No employees found.</p>
        )}
      </div>
      
      {/* Quick Actions */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-primary hover:bg-primary-dark text-white py-3 px-4 rounded-lg shadow-sm">
            Add Employee
          </button>
          <button className="bg-secondary hover:bg-secondary-dark text-white py-3 px-4 rounded-lg shadow-sm">
            Add Balance
          </button>
          <button className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg shadow-sm">
            Distribute Balance
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;
