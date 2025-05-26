import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listingsAPI } from '../../api/api';
import { AxiosError } from 'axios';

interface ListingFormData {
  title: string;
  description: string;
  category: string;
  budget: string;
  location: string;
  deadline: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  status: 'published' | 'unpublished';
  purchase_method: string;
  payment_terms: string;
  listing_type: string;
  delivery_date: string;
  publication_period: string;
}

const CustomerCreateListing: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ListingFormData>({
    title: '',
    description: '',
    category: '',
    budget: '',
    location: '',
    deadline: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    status: 'unpublished',
    purchase_method: '',
    payment_terms: '',
    listing_type: '',
    delivery_date: '',
    publication_period: '30' // По умолчанию 30 дней
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof ListingFormData, string>>>({});

  const validateForm = () => {
    const errors: Partial<Record<keyof ListingFormData, string>> = {};

    if (!formData.title.trim()) {
      errors.title = 'Название обязательно для заполнения';
    }
    if (!formData.description.trim()) {
      errors.description = 'Описание обязательно для заполнения';
    }
    if (!formData.category) {
      errors.category = 'Выберите категорию';
    }
    if (!formData.purchase_method) {
      errors.purchase_method = 'Выберите способ закупки';
    }
    if (!formData.payment_terms) {
      errors.payment_terms = 'Выберите условия оплаты';
    }
    if (!formData.listing_type) {
      errors.listing_type = 'Выберите тип заявки';
    }
    if (!formData.delivery_date) {
      errors.delivery_date = 'Укажите дату поставки';
    }
    if (!formData.publication_period) {
      errors.publication_period = 'Укажите период публикации';
    }
    if (formData.budget && isNaN(Number(formData.budget))) {
      errors.budget = 'Бюджет должен быть числом';
    }
    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      errors.contact_email = 'Неверный формат email';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Очищаем ошибку валидации при изменении поля
    if (validationErrors[name as keyof ListingFormData]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleError = (err: unknown) => {
    console.error('Error handling listing creation:', err);
    if (err instanceof AxiosError) {
      const errorMessage = err.response?.data?.error || err.message;
      setError(errorMessage);
    } else if (err instanceof Error) {
      setError(err.message);
    } else {
      setError('Произошла неизвестная ошибка. Пожалуйста, попробуйте позже.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      setLoading(true);
      
      // Submit listing creation request
      const response = await listingsAPI.createListing(formData);
      
      // Navigate to the new listing detail page with success parameter
      navigate(`/customer/listings/${response.data.listing_id}?new=true`);
    } catch (err: any) {
      console.error('Error creating listing:', err);
      setError(err.response?.data?.error || 'Failed to create listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      setLoading(true);
      
      // Set status to published and submit
      const response = await listingsAPI.createListing({
        ...formData,
        status: 'published'
      });
      
      // Navigate to the new listing detail page with success parameter
      navigate(`/customer/listings/${response.data.listing_id}?new=true`);
    } catch (err: any) {
      console.error('Error publishing listing:', err);
      setError(err.response?.data?.error || 'Failed to publish listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Создать новую заявку</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <form onSubmit={(e) => handleSubmit(e)}>
          {/* Basic Information */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Основная информация</h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Название *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary focus:border-primary ${
                    validationErrors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Введите название заявки"
                />
                {validationErrors.title && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.title}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="listing_type" className="block text-sm font-medium text-gray-700 mb-1">
                  Тип заявки *
                </label>
                <select
                  id="listing_type"
                  name="listing_type"
                  required
                  value={formData.listing_type}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary focus:border-primary ${
                    validationErrors.listing_type ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Выберите тип заявки</option>
                  <option value="purchase">Закупка</option>
                  <option value="sale">Продажа</option>
                  <option value="service">Услуга</option>
                  <option value="cooperation">Сотрудничество</option>
                </select>
                {validationErrors.listing_type && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.listing_type}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="purchase_method" className="block text-sm font-medium text-gray-700 mb-1">
                  Способ закупки *
                </label>
                <select
                  id="purchase_method"
                  name="purchase_method"
                  required
                  value={formData.purchase_method}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary focus:border-primary ${
                    validationErrors.purchase_method ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Выберите способ закупки</option>
                  <option value="direct">Прямая закупка</option>
                  <option value="tender">Тендер</option>
                  <option value="auction">Аукцион</option>
                  <option value="request">Запрос предложений</option>
                </select>
                {validationErrors.purchase_method && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.purchase_method}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="payment_terms" className="block text-sm font-medium text-gray-700 mb-1">
                  Условия оплаты *
                </label>
                <select
                  id="payment_terms"
                  name="payment_terms"
                  required
                  value={formData.payment_terms}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary focus:border-primary ${
                    validationErrors.payment_terms ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Выберите условия оплаты</option>
                  <option value="prepayment">Предоплата</option>
                  <option value="postpayment">Постоплата</option>
                  <option value="partial">Частичная предоплата</option>
                  <option value="installments">Рассрочка платежа</option>
                </select>
                {validationErrors.payment_terms && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.payment_terms}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Категория *
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary focus:border-primary ${
                    validationErrors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Выберите категорию</option>
                  <option value="Metal Processing">Металлообработка</option>
                  <option value="Construction">Строительство</option>
                  <option value="Manufacturing">Производство</option>
                  <option value="Transportation">Транспорт</option>
                  <option value="Other">Другое</option>
                </select>
                {validationErrors.category && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.category}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Описание *
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={5}
                  value={formData.description}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary focus:border-primary ${
                    validationErrors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Подробно опишите требования"
                ></textarea>
                {validationErrors.description && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.description}</p>
                )}
              </div>

              <div>
                <label htmlFor="delivery_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Дата поставки *
                </label>
                <input
                  type="date"
                  id="delivery_date"
                  name="delivery_date"
                  required
                  value={formData.delivery_date}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary focus:border-primary ${
                    validationErrors.delivery_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {validationErrors.delivery_date && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.delivery_date}</p>
                )}
              </div>

              <div>
                <label htmlFor="publication_period" className="block text-sm font-medium text-gray-700 mb-1">
                  Период публикации (в днях) *
                </label>
                <select
                  id="publication_period"
                  name="publication_period"
                  required
                  value={formData.publication_period}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary focus:border-primary ${
                    validationErrors.publication_period ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="7">7 дней</option>
                  <option value="14">14 дней</option>
                  <option value="30">30 дней</option>
                  <option value="60">60 дней</option>
                  <option value="90">90 дней</option>
                </select>
                {validationErrors.publication_period && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.publication_period}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Additional Details */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Дополнительная информация</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
                  Бюджет
                </label>
                <input
                  type="number"
                  id="budget"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary focus:border-primary ${
                    validationErrors.budget ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Укажите бюджет"
                />
                {validationErrors.budget && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.budget}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Местоположение
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="Укажите местоположение"
                />
              </div>
              
              <div>
                <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
                  Срок выполнения
                </label>
                <input
                  type="date"
                  id="deadline"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
          </div>
          
          {/* Contact Information */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Контактная информация</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="contact_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Контактное лицо
                </label>
                <input
                  type="text"
                  id="contact_name"
                  name="contact_name"
                  value={formData.contact_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="Укажите имя"
                />
              </div>
              
              <div>
                <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email для связи
                </label>
                <input
                  type="email"
                  id="contact_email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary focus:border-primary ${
                    validationErrors.contact_email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Укажите email"
                />
                {validationErrors.contact_email && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.contact_email}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Телефон для связи
                </label>
                <input
                  type="tel"
                  id="contact_phone"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="Укажите телефон"
                />
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/customer/listings')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Отмена
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium text-white bg-gray-500 hover:bg-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Сохранение...' : 'Сохранить черновик'}
            </button>
            
            <button
              type="button"
              onClick={(e) => handlePublish(e)}
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Публикация...' : 'Опубликовать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerCreateListing;
