import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../api/api';
import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    users: {
      total_users: 0,
      customers: 0,
      executors: 0,
      admins: 0
    },
    companies: {
      total_companies: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    },
    listings: {
      total_listings: 0,
      published: 0,
      unpublished: 0,
      completed: 0
    },
    responses: {
      total_responses: 0,
      pending: 0,
      accepted: 0,
      rejected: 0
    }
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch system statistics
        const statsResponse = await adminAPI.getStatistics();
        setStats(statsResponse.data);
        
        // Fetch recent activity log
        const activityResponse = await adminAPI.getActivityLog({
          page: 1,
          per_page: 10
        });
        setRecentActivity(activityResponse.data.logs);
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Welcome Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-xl font-semibold mb-2">Welcome, Administrator</h2>
        <p className="text-gray-600">
          Here's an overview of the system statistics and recent activity.
        </p>
      </div>
      
      {/* Users Stats */}
      <h2 className="text-lg font-semibold mb-3">Users</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
          <p className="text-2xl font-bold">{stats.users.total_users}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Customers</h3>
          <p className="text-2xl font-bold text-primary">{stats.users.customers}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Executors</h3>
          <p className="text-2xl font-bold text-secondary">{stats.users.executors}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Admins</h3>
          <p className="text-2xl font-bold text-red-600">{stats.users.admins}</p>
        </div>
      </div>
      
      {/* Companies Stats */}
      <h2 className="text-lg font-semibold mb-3">Companies</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Companies</h3>
          <p className="text-2xl font-bold">{stats.companies.total_companies}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Pending</h3>
          <p className="text-2xl font-bold text-yellow-600">{stats.companies.pending}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Approved</h3>
          <p className="text-2xl font-bold text-green-600">{stats.companies.approved}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Rejected</h3>
          <p className="text-2xl font-bold text-red-600">{stats.companies.rejected}</p>
        </div>
      </div>
      
      {/* Listings and Responses Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Listings */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Listings</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">Total</h3>
              <p className="text-2xl font-bold">{stats.listings.total_listings}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">Published</h3>
              <p className="text-2xl font-bold text-primary">{stats.listings.published}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">Unpublished</h3>
              <p className="text-2xl font-bold text-gray-600">{stats.listings.unpublished}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">Completed</h3>
              <p className="text-2xl font-bold text-green-600">{stats.listings.completed}</p>
            </div>
          </div>
        </div>
        
        {/* Responses */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Responses</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">Total</h3>
              <p className="text-2xl font-bold">{stats.responses.total_responses}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">Pending</h3>
              <p className="text-2xl font-bold text-yellow-600">{stats.responses.pending}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">Accepted</h3>
              <p className="text-2xl font-bold text-green-600">{stats.responses.accepted}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">Rejected</h3>
              <p className="text-2xl font-bold text-red-600">{stats.responses.rejected}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        {recentActivity.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentActivity.map((activity, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {activity.user_email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {activity.action_type}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {activity.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(activity.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No recent activity found.</p>
        )}
      </div>
      
      {/* Quick Actions */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-primary hover:bg-primary-dark text-white py-3 px-4 rounded-lg shadow-sm">
            Manage Companies
          </button>
          <button className="bg-secondary hover:bg-secondary-dark text-white py-3 px-4 rounded-lg shadow-sm">
            Manage Users
          </button>
          <button className="bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg shadow-sm">
            View Full Activity Log
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
