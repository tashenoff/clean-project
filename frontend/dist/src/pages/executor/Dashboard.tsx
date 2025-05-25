import React, { useEffect, useState } from 'react';
import { userAPI, listingsAPI } from '../../api/api';
import { useAuth } from '../../contexts/AuthContext';

const ExecutorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalResponses: 0,
    acceptedResponses: 0,
    rejectedResponses: 0,
    pendingResponses: 0,
    points: 0,
    experienceLevel: ''
  });
  const [availableListings, setAvailableListings] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch user activity
        const activityResponse = await userAPI.getActivity();
        setRecentActivity(activityResponse.data.activities.slice(0, 5));
        
        // Fetch available listings
        const listingsResponse = await listingsAPI.getListings({ 
          status: 'published',
          page: 1,
          per_page: 5
        });
        setAvailableListings(listingsResponse.data.listings);
        
        // For a real implementation, we would fetch actual stats from an API endpoint
        // This is a placeholder that would be replaced with real API calls
        if (user?.executor_profile) {
          setStats({
            totalResponses: 17,
            acceptedResponses: 11,
            rejectedResponses: 1,
            pendingResponses: 5,
            points: user.executor_profile.points || 0,
            experienceLevel: user.executor_profile.experience_level || 'BEGINNER'
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Executor Dashboard</h1>
      
      {/* Welcome Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold mb-2">Welcome back, {user?.email}</h2>
            <p className="text-gray-600">
              Here's an overview of your activity and available listings.
            </p>
          </div>
          <div className="text-right">
            <div className="bg-secondary text-white px-4 py-2 rounded-lg font-bold">
              {stats.points} points
            </div>
            <div className="mt-2 bg-primary text-white px-4 py-1 rounded-lg text-sm">
              {stats.experienceLevel}
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Responses</h3>
          <p className="text-2xl font-bold">{stats.totalResponses}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Accepted</h3>
          <p className="text-2xl font-bold text-green-600">{stats.acceptedResponses}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Rejected</h3>
          <p className="text-2xl font-bold text-red-600">{stats.rejectedResponses}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Pending</h3>
          <p className="text-2xl font-bold text-yellow-600">{stats.pendingResponses}</p>
        </div>
      </div>
      
      {/* Available Listings */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-lg font-semibold mb-4">Available Listings</h2>
        {availableListings.length > 0 ? (
          <div className="space-y-4">
            {availableListings.map((listing) => (
              <div key={listing.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                <h3 className="font-medium">{listing.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{listing.description.substring(0, 100)}...</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-400">
                    {new Date(listing.created_at).toLocaleDateString()}
                  </span>
                  <button className="bg-primary hover:bg-primary-dark text-white text-xs px-3 py-1 rounded">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No available listings found.</p>
        )}
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
            Browse All Listings
          </button>
          <button className="bg-secondary hover:bg-secondary-dark text-white py-3 px-4 rounded-lg shadow-sm">
            View My Responses
          </button>
          <button className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg shadow-sm">
            Update Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExecutorDashboard;
