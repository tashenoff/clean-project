import React, { useEffect, useState } from 'react';
import { userAPI } from '../../api/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Добро пожаловать, {user?.email}</h2>
        <p className="text-gray-600">
          Здесь вы можете увидеть обзор вашей активности и заявок.
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Всего заявок</h3>
          <p className="text-2xl font-bold">{stats.totalListings}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Активные заявки</h3>
          <p className="text-2xl font-bold text-primary">{stats.activeListings}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Завершенные заявки</h3>
          <p className="text-2xl font-bold text-green-600">{stats.completedListings}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Всего откликов</h3>
          <p className="text-2xl font-bold text-secondary">{stats.totalResponses}</p>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          onClick={() => navigate('/customer/listings/create')}
          className="bg-primary hover:bg-primary-dark text-white py-3 px-4 rounded-lg shadow-sm transition-colors"
        >
          Создать заявку
        </button>
        <button 
          onClick={() => navigate('/customer/listings')}
          className="bg-secondary hover:bg-secondary-dark text-white py-3 px-4 rounded-lg shadow-sm transition-colors"
        >
          Просмотр заявок
        </button>
        <button 
          onClick={() => navigate('/customer/profile')}
          className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg shadow-sm transition-colors"
        >
          Обновить профиль
        </button>
      </div>
      
      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Последняя активность</h2>
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
          <p className="text-gray-500">Нет последней активности.</p>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
