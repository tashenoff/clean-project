import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../api/api';

const Users = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, filterRole]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        per_page: pagination.per_page
      };

      // Добавляем параметр role только если выбрана конкретная роль
      if (filterRole !== 'all') {
        params.role = filterRole;
      }

      const response = await adminAPI.getUsers(params);
      setUsers(response.data.users);
      setPagination({
        page: response.data.page,
        per_page: response.data.per_page,
        total: response.data.total,
        total_pages: response.data.total_pages
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация на стороне клиента для поиска
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleViewUser = (id) => {
    navigate(`/admin/users/${id}`);
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      try {
        await adminAPI.deleteUser(id);
        // Обновляем список пользователей после удаления
        fetchUsers();
      } catch (err) {
        console.error('Error deleting user:', err);
        alert('Не удалось удалить пользователя. Пожалуйста, попробуйте позже.');
      }
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.total_pages) {
      setPagination({...pagination, page: newPage});
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Управление пользователями</h1>
        <button 
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
          onClick={() => navigate('/admin/users/create')}
        >
          Добавить пользователя
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
              placeholder="Email пользователя..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-64">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
            <select
              id="role"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value);
                setPagination({...pagination, page: 1}); // Сбрасываем на первую страницу при изменении фильтра
              }}
            >
              <option value="all">Все роли</option>
              <option value="customer">Заказчик</option>
              <option value="executor">Исполнитель</option>
              <option value="admin">Администратор</option>
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
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Роль</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Город</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата регистрации</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.role === 'customer' ? 'Заказчик' : 
                           user.role === 'executor' ? 'Исполнитель' : 
                           user.role === 'admin' ? 'Администратор' : user.role}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.city || 'Не указан'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button 
                            className="text-primary hover:text-primary-dark mr-2"
                            onClick={() => handleViewUser(user.id)}
                          >
                            Просмотр
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            Удалить
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        Пользователи не найдены
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

export default Users;
