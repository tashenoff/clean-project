import React, { useEffect, useState } from 'react';
import { userAPI } from '../../api/api';
import { useAuth } from '../../contexts/AuthContext';

const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    completedListings: 0,
    totalResponses: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch user activity
        const activityResponse = await userAPI.getActivity();
        setRecentActivity(activityResponse.data.activities.slice(0, 5));
        
        // For a real implementation, we would fetch actual stats from an API endpoint
        // This is a placeholder that would be replaced with real API calls
        setStats({
          totalListings: 12,
          activeListings: 5,
          completedListings: 7,
          totalResponses: 34
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
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
      <h1 className="text-2xl font-bold mb-6">Customer Dashboard</h1>
      
      {/* Welcome Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-xl font-semibold mb-2">Welcome back, {user?.email}</h2>
        <p className="text-gray-600">
          Here's an overview of your activity and listings.
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Listings</h3>
          <p className="text-2xl font-bold">{stats.totalListings}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Active Listings</h3>
          <p className="text-2xl font-bold text-primary">{stats.activeListings}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Completed Listings</h3>
          <p className="text-2xl font-bold text-green-600">{stats.completedListings}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Responses</h3>
          <p className="text-2xl font-bold text-secondary">{stats.totalResponses}</p>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        {recentActivity.length > 0 ? (
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="border-b pb-3 last:border-b-0 last:pb-0">
                <p className="text-sm text-gray-600">{activity.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(activity.created_at).toLocaleString()}
                </p>
              </div>
            ))}
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
            Create New Listing
          </button>
          <button className="bg-secondary hover:bg-secondary-dark text-white py-3 px-4 rounded-lg shadow-sm">
            View Active Listings
          </button>
          <button className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg shadow-sm">
            Update Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
