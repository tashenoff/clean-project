import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listingsAPI, responsesAPI } from '../../api/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface Listing {
  id: number;
  title: string;
  category: string;
  status: string;
  created_at: string;
  company_id: number;
  description: string;
  budget?: number;
  location?: string;
  deadline?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
}

interface Response {
  id: number;
  user_id: number;
  listing_id: number;
  status: string;
  created_at: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  experience_level: string;
  message: string;
  listing_title: string;
  listing_category: string;
}

const CustomerListings: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'my' | 'all' | 'responses'>('my');
  const { user } = useAuth();

  console.log('Component State:', {
    user,
    activeTab,
    filter,
    listingsCount: listings.length
  });

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        console.log('Fetching listings:', { 
          activeTab, 
          filter,
          user: {
            id: user?.id,
            company_id: user?.company_id,
            role: user?.role
          }
        });
        
        if (activeTab === 'responses') {
          // Получаем список всех объявлений пользователя
          const myListingsResponse = await listingsAPI.getMyListings();
          
          if (!myListingsResponse.data.listings || myListingsResponse.data.listings.length === 0) {
            console.log('No listings found');
            setResponses([]);
            return;
          }
          
          console.log('Found listings:', myListingsResponse.data.listings);
          
          // Для каждого объявления получаем отклики
          const allResponses: Response[] = [];
          for (const listing of myListingsResponse.data.listings) {
            try {
              console.log('Fetching responses for listing:', listing.id);
              const responsesResponse = await responsesAPI.getListingResponses(listing.id);
              
              if (responsesResponse.data.responses && responsesResponse.data.responses.length > 0) {
                // Добавляем информацию об объявлении к каждому отклику
                const responsesWithListing = responsesResponse.data.responses.map(response => ({
                  ...response,
                  listing_title: listing.title,
                  listing_category: listing.category
                }));
                allResponses.push(...responsesWithListing);
              }
            } catch (error) {
              console.error(`Error fetching responses for listing ${listing.id}:`, error);
            }
          }
          
          console.log('Total responses found:', allResponses.length);
          setResponses(allResponses);
        } else {
          const response = activeTab === 'my' 
            ? await listingsAPI.getMyListings({
                status: filter !== 'all' ? filter : undefined
              })
            : await listingsAPI.getListings({
                status: filter !== 'all' ? filter : undefined
              });
          
        console.log('API Response:', {
          status: response.status,
          statusText: response.statusText,
          data: response.data,
          headers: response.headers
        });
        
        if (response.data.listings) {
          console.log('Setting listings:', {
            count: response.data.listings.length,
            listings: response.data.listings
          });
          setListings(response.data.listings);
        }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Ошибка при загрузке данных');
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [filter, activeTab, user]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log('Filter changed:', e.target.value);
    setFilter(e.target.value);
  };

  const handleTabChange = (tab: 'my' | 'all' | 'responses') => {
    console.log('Tab changed:', tab);
    setActiveTab(tab);
  };

  const handleResponseAction = async (responseId: number, action: 'accepted' | 'rejected') => {
    try {
      await responsesAPI.updateResponseStatus(responseId, { status: action });
      
      // Обновляем список откликов
      const updatedResponses = responses.map(response => 
        response.id === responseId 
          ? { ...response, status: action }
          : response
      );
      
      setResponses(updatedResponses);
      toast.success(`Отклик ${action === 'accepted' ? 'принят' : 'отклонен'}`);
    } catch (error) {
      console.error('Error updating response:', error);
      toast.error('Ошибка при обновлении статуса отклика');
    }
  };

  const filteredListings = listings;

  console.log('Render state:', {
    totalListings: listings.length,
    activeTab,
    userCompanyId: user?.company_id,
    filter,
    isLoading: loading
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">Опубликовано</span>;
      case 'unpublished':
        return <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">Не опубликовано</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">Завершено</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-800">Ожидает</span>;
      case 'accepted':
        return <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">Принят</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">Отклонен</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Объявления</h1>
        <Link 
          to="/customer/listings/create"
          className="bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-md"
        >
          Создать объявление
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex" aria-label="Tabs">
          <button
            onClick={() => handleTabChange('my')}
            className={`${
              activeTab === 'my'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm mr-8`}
          >
            Мои объявления
          </button>
          <button
            onClick={() => handleTabChange('all')}
            className={`${
              activeTab === 'all'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm mr-8`}
          >
            Все объявления
          </button>
          <button
            onClick={() => handleTabChange('responses')}
            className={`${
              activeTab === 'responses'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Отклики
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex items-center">
          <label htmlFor="status-filter" className="mr-2 text-sm font-medium text-gray-700">
            Статус:
          </label>
          <select
            id="status-filter"
            value={filter}
            onChange={handleFilterChange}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary"
          >
            <option value="all">Все</option>
            <option value="published">Опубликованные</option>
            <option value="unpublished">Не опубликованные</option>
            <option value="completed">Завершенные</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : activeTab === 'responses' ? (
        responses.length > 0 ? (
          // Responses Table
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Исполнитель
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Объявление
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {responses.map((response) => (
                  <tr key={response.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{response.email}</div>
                      <div className="text-sm text-gray-500">
                        {response.city}, {response.country}
                      </div>
                      <div className="text-sm text-gray-500">
                        Опыт: {response.experience_level}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{response.listing_title}</div>
                      <div className="text-sm text-gray-500">{response.listing_category}</div>
                      <div className="text-sm text-gray-500 mt-1">{response.message}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(response.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(response.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {response.status === 'pending' && (
                        <div className="space-x-2">
                          <button
                            onClick={() => handleResponseAction(response.id, 'accepted')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Принять
                          </button>
                          <button
                            onClick={() => handleResponseAction(response.id, 'rejected')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Отклонить
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <p className="text-gray-500 mb-4">
              На ваши объявления пока нет откликов.
            </p>
          </div>
        )
      ) : (
        // Listings Table
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Название
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Категория
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Создано
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredListings.map((listing) => (
                <tr key={listing.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{listing.title}</div>
                    <div className="text-sm text-gray-500">{listing.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {listing.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(listing.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(listing.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/customer/listings/${listing.id}`}
                      className="text-primary hover:text-primary-dark"
                    >
                      Подробнее
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CustomerListings;
