import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { listingsAPI } from '../../api/api';

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

const CustomerEditListing: React.FC = () => {
  const { id } = useParams<{ id: string }>();
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
    publication_period: '30'
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof ListingFormData, string>>>({});

  useEffect(() => {
    const fetchListingData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await listingsAPI.getListing(Number(id));
        
        if (!response.data) {
          throw new Error('No data received from server');
        }

        const { listing: listingData, owner } = response.data;

        if (!listingData) {
          throw new Error('Invalid listing data format');
        }

        // Форматируем дату для поля ввода (YYYY-MM-DD)
        const formattedDeliveryDate = listingData.delivery_date 
          ? new Date(listingData.delivery_date).toISOString().split('T')[0]
          : '';
        
        setFormData({
          title: listingData.title || '',
          description: listingData.description || '',
          category: listingData.category || '',
          budget: listingData.budget?.toString() || '',
          location: owner?.city && owner?.country ? `${owner.city}, ${owner.country}` : '',
          deadline: formattedDeliveryDate,
          contact_name: owner?.first_name && owner?.last_name 
            ? `${owner.first_name} ${owner.last_name}` 
            : owner?.company_name || '',
          contact_email: owner?.email || '',
          contact_phone: owner?.phone || '',
          status: listingData.status || 'unpublished',
          purchase_method: listingData.purchase_method || '',
          payment_terms: listingData.payment_terms || '',
          listing_type: listingData.listing_type || '',
          delivery_date: formattedDeliveryDate,
          publication_period: listingData.publication_period?.toString() || '30'
        });
      } catch (error: any) {
        console.error('Error fetching listing data:', error);
        setError(error.response?.data?.error || error.message || 'Failed to load listing details');
      } finally {
        setLoading(false);
      }
    };

    fetchListingData();
  }, [id]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!id || !validateForm()) return;
    
    try {
      setSubmitting(true);
      
      // Submit listing update request
      await listingsAPI.updateListing(Number(id), formData);
      
      // Navigate back to the listing detail page
      navigate(`/customer/listings/${id}`);
    } catch (err: any) {
      console.error('Error updating listing:', err);
      setError(err.response?.data?.error || 'Failed to update listing. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Редактировать заявку</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <form onSubmit={handleSubmit}>
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
            </div>
          </div>
          
          {/* Purchase Details */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Детали закупки</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <option value="quotation">Запрос котировок</option>
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
                  <option value="letter_of_credit">Аккредитив</option>
                </select>
                {validationErrors.payment_terms && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.payment_terms}</p>
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
                  Период публикации (дней) *
                </label>
                <input
                  type="number"
                  id="publication_period"
                  name="publication_period"
                  required
                  min="1"
                  max="90"
                  value={formData.publication_period}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary focus:border-primary ${
                    validationErrors.publication_period ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Укажите период публикации"
                />
                {validationErrors.publication_period && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.publication_period}</p>
                )}
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
                  placeholder="Укажите контактное лицо"
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
              onClick={() => navigate(`/customer/listings/${id}`)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
                submitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {submitting ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerEditListing;
