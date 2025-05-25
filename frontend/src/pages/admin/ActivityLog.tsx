import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../api/api';

const ActivityLog = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  useEffect(() => {
    fetchActivityLog();
  }, [pagination.page, filterAction, dateRange]);

  const fetchActivityLog = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        per_page: pagination.per_page
      };

      // Добавляем параметр action_type только если выбрано конкретное действие
      if (filterAction !== 'all') {
        params.action_type = filterAction;
      }

      const response = await adminAPI.getActivityLog(params);
      setActivities(response.data.logs);
      setPagination({
        page: response.data.page,
        per_page: response.data.per_page,
        total: response.data.total,
        total_pages: response.data.total_pages
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching activity log:', err);
      setError('Failed to load activity log. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация на стороне клиента для поиска
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = 
      (activity.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      activity.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const handleExport = () => {
    // Логика экспорта журнала
    alert('Журнал активности экспортирован');
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.total_pages) {
      setPagination({...pagination, page: newPage});
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Журнал активности</h1>
        <button 
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
          onClick={handleExport}
        >
          Экспорт журнала
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Поиск</label>
            <input
              type="text"
              id="search"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Пользователь или детали..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-64">
            <label htmlFor="action" className="block text-sm font-medium text-gray-700 mb-1">Действие</label>
            <select
              id="action"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              value={filterAction}
              onChange={(e) => {
                setFilterAction(e.target.value);
                setPagination({...pagination, page: 1}); // Сбрасываем на первую страницу при изменении фильтра
              }}
            >
              <option value="all">Все действия</option>
              <option value="create_listing">Создание заявки</option>
              <option value="create_response">Отклик на заявку</option>
              <option value="login">Вход в систему</option>
              <option value="update_profile">Редактирование профиля</option>
              <option value="block_user">Блокировка пользователя</option>
            </select>
          </div>
          <div className="w-full md:w-64">
            <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 mb-1">Период</label>
            <select
              id="dateRange"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                setPagination({...pagination, page: 1}); // Сбрасываем на первую страницу при изменении фильтра
              }}
            >
              <option value="all">Все время</option>
              <option value="today">Сегодня</option>
              <option value="yesterday">Вчера</option>
              <option value="week">Последняя неделя</option>
              <option value="month">Последний месяц</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Пользователь</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действие</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Детали</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Время</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP-адрес</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredActivities.length > 0 ? (
                    filteredActivities.map((activity) => (
                      <tr key={activity.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{activity.user_email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.action_type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(activity.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.ip_address || 'N/A'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        Записи не найдены
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Пагинация */}
            {pagination.total_pages > 1 && (
              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-gray-500">
                  Показано {(pagination.page - 1) * pagination.per_page + 1} - {Math.min(pagination.page * pagination.per_page, pagination.total)} из {pagination.total}
                </div>
                <div className="flex space-x-2">
                  <button
                    className={`px-3 py-1 rounded ${pagination.page === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-dark'}`}
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    Назад
                  </button>
                  <button
                    className={`px-3 py-1 rounded ${pagination.page === pagination.total_pages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-dark'}`}
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.total_pages}
                  >
                    Вперед
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
