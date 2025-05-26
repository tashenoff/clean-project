import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, companyAPI, responsesAPI } from '../../api/api';
import { useAuth } from '../../contexts/AuthContext';

interface ProfileData {
  id: number;
  name?: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  created_at: string;
  executor_profile?: {
    points: number;
    experience_level: string;
  };
}

interface CompanyData {
  id: number;
  name: string;
  bin: string;
  address: string;
  status: string;
}

interface Stats {
  totalResponses: number;
  acceptedResponses: number;
  rejectedResponses: number;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalResponses: 0,
    acceptedResponses: 0,
    rejectedResponses: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        // Получаем данные профиля пользователя
        const profileResponse = await userAPI.getProfile();
        setProfile(profileResponse.data.user);

        // Получаем данные компании пользователя
        if (profileResponse.data.company) {
          setCompany(profileResponse.data.company);
        }
        
        // Получаем статистику откликов из API
        const responsesResponse = await responsesAPI.getMyResponses({
          page: 1,
          per_page: 100 // Получаем достаточно большое количество для статистики
        });
        
        // Рассчитываем статистику на основе полученных данных
        const responses = responsesResponse.data.responses || [];
        const totalResponses = responsesResponse.data.total || 0;
        const acceptedResponses = responses.filter(r => r.status === 'accepted').length;
        const rejectedResponses = responses.filter(r => r.status === 'rejected').length;
        
        setStats({
          totalResponses,
          acceptedResponses,
          rejectedResponses
        });
        
        setError(null);
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Не удалось загрузить данные профиля. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

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
          onClick={() => navigate('/executor/dashboard')}
        >
          Вернуться на главную
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Профиль исполнителя</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="flex items-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-2xl font-bold mr-4">
            {profile?.name ? profile.name.charAt(0) : user?.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{profile?.name || 'Исполнитель'}</h2>
            <p className="text-gray-600">Исполнитель</p>
            <p className="text-gray-600">{user?.email}</p>
            <div className="mt-2 flex items-center">
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                {profile?.executor_profile?.experience_level || 'НОВИЧОК'}
              </span>
              <span className="ml-2 text-sm text-gray-600">
                {profile?.executor_profile?.points || 0} баллов
              </span>
            </div>
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
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Статистика</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-gray-600">Всего откликов:</p>
              <p className="text-xl font-bold">{stats.totalResponses}</p>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <p className="text-gray-600">Принято:</p>
              <p className="text-xl font-bold text-green-600">{stats.acceptedResponses}</p>
            </div>
            <div className="bg-red-50 p-3 rounded">
              <p className="text-gray-600">Отклонено:</p>
              <p className="text-xl font-bold text-red-600">{stats.rejectedResponses}</p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button 
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark mr-2"
            onClick={() => navigate('/executor/profile/edit')}
          >
            Редактировать профиль
          </button>
          <button 
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            onClick={() => navigate('/executor/dashboard')}
          >
            Назад
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
