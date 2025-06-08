import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, companyAPI } from '../../api/api';
import { useAuth } from '../../contexts/AuthContext';

interface ProfileData {
  id: number;
  name?: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  created_at: string;
}

interface CompanyData {
  id: number;
  name: string;
  bin: string;
  address: string;
  status: 'approved' | 'pending' | 'rejected';
  created_at: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState<number>(0);

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        // Получаем данные профиля пользователя
        const profileResponse = await userAPI.getProfile();
        setProfile(profileResponse.data.user);

        // Получаем данные компании пользователя, если они есть
        if (profileResponse.data.user?.company_id) {
          const companyResponse = await companyAPI.getCompanyProfile();
          setCompany(companyResponse.data.company);
        }
        
        if (user?.role === 'executor' && user?.id) {
          fetch(`/api/users/${user.id}/reviews`)
            .then(res => res.json())
            .then(data => {
              setReviews(data.reviews || []);
              setAvgRating(data.average_rating || null);
              setReviewCount(data.count || 0);
            });
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Не удалось загрузить данные профиля. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
        <button 
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
          onClick={() => navigate('/customer/dashboard')}
        >
          Вернуться на главную
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Профиль пользователя</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="flex items-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-2xl font-bold mr-4">
            {profile?.name ? profile.name.charAt(0) : user?.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{profile?.name || 'Пользователь'}</h2>
            <p className="text-gray-600">
              {user?.role === 'customer' ? 'Заказчик' : 
               user?.role === 'executor' ? 'Исполнитель' : 
               user?.role === 'admin' ? 'Администратор' : user?.role}
            </p>
            <p className="text-gray-600">{user?.email}</p>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Личная информация</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Телефон:</p>
              <p>{profile?.phone || 'Не указан'}</p>
            </div>
            <div>
              <p className="text-gray-600">Дата регистрации:</p>
              <p>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Не указана'}</p>
            </div>
            <div>
              <p className="text-gray-600">Город:</p>
              <p>{profile?.city || 'Не указан'}</p>
            </div>
            <div>
              <p className="text-gray-600">Страна:</p>
              <p>{profile?.country || 'Не указана'}</p>
            </div>
          </div>
        </div>
        
        {company && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Компания</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Название:</p>
                <p>{company.name}</p>
              </div>
              <div>
                <p className="text-gray-600">БИН:</p>
                <p>{company.bin}</p>
              </div>
              <div>
                <p className="text-gray-600">Адрес:</p>
                <p>{company.address}</p>
              </div>
              <div>
                <p className="text-gray-600">Статус:</p>
                <p className={`${
                  company.status === 'approved' ? 'text-green-600' : 
                  company.status === 'pending' ? 'text-yellow-600' : 
                  'text-red-600'
                }`}>
                  {company.status === 'approved' ? 'Активна' : 
                   company.status === 'pending' ? 'На проверке' : 
                   'Отклонена'}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {user?.role === 'executor' && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Отзывы и рейтинг</h3>
            <div className="flex items-center mb-2">
              <span className="font-medium mr-2">Средний рейтинг:</span>
              {avgRating !== null ? (
                <span className="text-yellow-500 font-bold">{avgRating.toFixed(2)} ★</span>
              ) : (
                <span className="text-gray-400">Нет отзывов</span>
              )}
              <span className="ml-2 text-gray-500 text-sm">({reviewCount} отзывов)</span>
            </div>
            {reviews.length > 0 && (
              <div className="max-h-40 overflow-y-auto border rounded p-2 bg-gray-50">
                {reviews.map((rev: any) => (
                  <div key={rev.id} className="mb-2 border-b pb-1 last:border-b-0 last:pb-0">
                    <div className="flex items-center text-sm">
                      <span className="text-yellow-500 mr-1">{'★'.repeat(rev.rating)}</span>
                      <span className="text-gray-500 ml-2">{rev.customer_email}</span>
                      <span className="ml-2 text-gray-400">{new Date(rev.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="text-gray-700 text-sm">{rev.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        <div className="flex justify-end">
          <button 
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark mr-2"
            onClick={() => navigate('/customer/profile/edit')}
          >
            Редактировать профиль
          </button>
          <button 
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            onClick={() => navigate('/customer/dashboard')}
          >
            Назад
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
