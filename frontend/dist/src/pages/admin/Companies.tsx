import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../api/api';

const Companies = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchCompanies();
  }, [pagination.page, filterType]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        per_page: pagination.per_page
      };

      // Добавляем параметр status только если выбран конкретный тип
      if (filterType !== 'all') {
        params.status = filterType;
      }

      const response = await adminAPI.getCompanies(params);
      setCompanies(response.data.companies);
      setPagination({
        page: response.data.page,
        per_page: response.data.per_page,
        total: response.data.total,
        total_pages: response.data.total_pages
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError('Failed to load companies. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация на стороне клиента для поиска
  const filteredCompanies = companies.filter(company => {
    return company.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleViewCompany = (id) => {
    navigate(`/admin/companies/${id}`);
  };

  const handleUpdateStatus = async (companyId, newStatus) => {
    if (window.confirm(`Вы уверены, что хотите изменить статус компании на "${newStatus}"?`)) {
      try {
        await adminAPI.updateCompanyStatus(companyId, { status: newStatus });
        // Обновляем список компаний после изменения статуса
        fetchCompanies();
      } catch (err) {
        console.error('Error updating company status:', err);
        alert('Не удалось обновить статус компании. Пожалуйста, попробуйте позже.');
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
        <h1 className="text-2xl font-bold">Управление компаниями</h1>
        <button 
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
          onClick={() => navigate('/admin/companies/create')}
        >
          Добавить компанию
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
              placeholder="Название компании..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-64">
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
            <select
              id="type"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPagination({...pagination, page: 1}); // Сбрасываем на первую страницу при изменении фильтра
              }}
            >
              <option value="all">Все статусы</option>
              <option value="pending">На проверке</option>
              <option value="approved">Активна</option>
              <option value="rejected">Отклонена</option>
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
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Название</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Тип</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сотрудники</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата регистрации</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCompanies.length > 0 ? (
                    filteredCompanies.map((company) => (
                      <tr key={company.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{company.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{company.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{company.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{company.employee_count || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(company.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${company.status === 'approved' ? 'bg-green-100 text-green-800' : 
                              company.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'}`}>
                            {company.status === 'approved' ? 'Активна' : 
                             company.status === 'pending' ? 'На проверке' : 
                             'Отклонена'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button 
                            className="text-primary hover:text-primary-dark mr-2"
                            onClick={() => handleViewCompany(company.id)}
                          >
                            Просмотр
                          </button>
                          {company.status !== 'approved' && (
                            <button 
                              className="text-green-600 hover:text-green-900 mr-2"
                              onClick={() => handleUpdateStatus(company.id, 'approved')}
                            >
                              Активировать
                            </button>
                          )}
                          {company.status !== 'rejected' && (
                            <button 
                              className="text-red-600 hover:text-red-900"
                              onClick={() => handleUpdateStatus(company.id, 'rejected')}
                            >
                              Отклонить
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        Компании не найдены
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

export default Companies;
