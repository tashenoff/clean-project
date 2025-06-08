import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { listingsAPI, responsesAPI } from '../../api/api';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table';
import { useAuth } from "../../contexts/AuthContext";

const CustomerListingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [responseLoading, setResponseLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { user } = useAuth();
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedExecutor, setSelectedExecutor] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [executorReviews, setExecutorReviews] = useState<any[]>([]);
  const [executorAvgRating, setExecutorAvgRating] = useState<number | null>(null);
  const [executorReviewCount, setExecutorReviewCount] = useState<number>(0);
  const [modalResponses, setModalResponses] = useState<any[]>([]);

  useEffect(() => {
    const fetchListingData = async () => {
      if (!id) {
        console.log('No listing ID provided');
        setError('Invalid listing ID');
        return;
      }
      
      try {
        setLoading(true);
        console.log('Fetching listing details for ID:', id);
        
        const listingResponse = await listingsAPI.getListing(Number(id));
        console.log('Received listing response:', listingResponse);
        
        if (!listingResponse.data) {
          console.error('No data in response');
          setError('Failed to load listing details: No data received');
          return;
        }

        const { listing: listingData, owner, responses: responsesData } = listingResponse.data;

        if (!listingData) {
          console.error('No listing data in response');
          setError('Failed to load listing details: Invalid data format');
          return;
        }

        const combinedData = {
          ...listingData,
          contact_name: owner?.first_name && owner?.last_name 
            ? `${owner.first_name} ${owner.last_name}` 
            : owner?.company_name || 'Not specified',
          contact_email: owner?.email || 'Not specified',
          contact_phone: owner?.phone || 'Not specified',
          location: owner?.city && owner?.country ? `${owner.city}, ${owner.country}` : 'Not specified',
          budget: listingData.budget || 'Not specified',
          deadline: listingData.delivery_date || 'Not specified',
          purchase_method: listingData.purchase_method || 'Not specified',
          payment_terms: listingData.payment_terms || 'Not specified',
          listing_type: listingData.listing_type || 'Not specified',
          publication_period: listingData.publication_period || 'Not specified',
          owner,
          responses: responsesData || { accepted: null, pending: null, rejected: null, total: 0 }
        };
        
        console.log('Combined listing data:', combinedData);
        setListing(combinedData);

        // Если это новое объявление, показываем сообщение об успехе
        const isNew = new URLSearchParams(window.location.search).get('new') === 'true';
        if (isNew) {
          setSuccessMessage('Объявление успешно создано!');
        }

      } catch (error: any) {
        console.error('Error fetching listing data:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Failed to load listing details';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchListingData();
  }, [id]);

  // Получить отзывы выбранного исполнителя (если выбран)
  useEffect(() => {
    if (!selectedExecutor) return;
    fetch(`/api/users/${selectedExecutor}/reviews`)
      .then(res => res.json())
      .then(data => {
        setExecutorReviews(data.reviews || []);
        setExecutorAvgRating(data.average_rating || null);
        setExecutorReviewCount(data.count || 0);
      });
  }, [selectedExecutor, showCompleteModal]);

  // Проверка прав доступа
  const hasAccess = user && listing?.owner && user.id === listing.owner.id;

  const handleStatusChange = async (newStatus: 'published' | 'unpublished' | 'closed' | 'cancelled') => {
    if (!id || !listing) return;
    
    try {
      setResponseLoading(true);
      await listingsAPI.changeListingStatus(Number(id), { status: newStatus });
      
      // Update local state
      setListing({
        ...listing,
        status: newStatus
      });
    } catch (error: any) {
      console.error('Error changing listing status:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update listing status. Please try again.';
      setError(errorMessage);
    } finally {
      setResponseLoading(false);
    }
  };

  const handleResponseAction = async (responseId: number, status: 'accepted' | 'rejected') => {
    try {
      setResponseLoading(true);
      await responsesAPI.updateResponseStatus(responseId, { status });
      
      // Update local state
      setResponses(responses.map(response => 
        response.id === responseId ? { ...response, status } : response
      ));
    } catch (error) {
      console.error('Error updating response status:', error);
      setError('Failed to update response status. Please try again.');
    } finally {
      setResponseLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      published: { variant: 'default' as const, text: 'Published' },
      unpublished: { variant: 'secondary' as const, text: 'Unpublished' },
      completed: { variant: 'default' as const, text: 'Completed' }
    };
    const { variant, text } = variants[status as keyof typeof variants] || { variant: 'secondary', text: status };
    return <Badge variant={variant}>{text}</Badge>;
  };

  const getResponseStatusBadge = (status: string) => {
    const variants = {
      accepted: { variant: 'default' as const, text: 'Accepted' },
      rejected: { variant: 'destructive' as const, text: 'Rejected' },
      pending: { variant: 'secondary' as const, text: 'Pending' }
    };
    const { variant, text } = variants[status as keyof typeof variants] || { variant: 'secondary', text: status };
    return <Badge variant={variant}>{text}</Badge>;
  };

  const handleOpenCompleteModal = async () => {
    setShowCompleteModal(true);
    setSelectedExecutor(null);
    setReviewText('');
    setRating(5);
    setReviewError('');
    // Загружаем отклики для модального окна
    if (id) {
      try {
        const res = await responsesAPI.getListingResponses(Number(id));
        setModalResponses(res.data.responses || []);
      } catch (e) {
        setModalResponses([]);
      }
    }
  };

  const handleSubmitComplete = async () => {
    if (!selectedExecutor) {
      setReviewError('Выберите исполнителя');
      return;
    }
    if (!rating || rating < 1 || rating > 5) {
      setReviewError('Поставьте рейтинг от 1 до 5');
      return;
    }
    setSubmittingReview(true);
    setReviewError('');
    try {
      const res = await fetch(`/api/listings/${id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ executor_id: selectedExecutor, rating, text: reviewText })
      });
      if (!res.ok) {
        const data = await res.json();
        setReviewError(data.error || 'Ошибка завершения заявки');
        setSubmittingReview(false);
        return;
      }
      setShowCompleteModal(false);
      setListing({ ...listing, status: 'completed' });
      setSuccessMessage('Заявка завершена и отзыв отправлен!');
    } catch (e) {
      setReviewError('Ошибка завершения заявки');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Not Found!</strong>
        <span className="block sm:inline"> The requested listing could not be found.</span>
      </div>
    );
  }

  if (showCompleteModal) {
    console.log('DEBUG responses for complete modal:', responses);
  }

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}

      {/* Listing Details */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{listing.title}</CardTitle>
              <CardDescription className="flex items-center mt-2 space-x-4">
                {getStatusBadge(listing.status)}
                <span>Создано: {new Date(listing.created_at).toLocaleDateString()}</span>
                <span>Категория: {listing.category}</span>
              </CardDescription>
            </div>
            {hasAccess && (
              <div className="flex space-x-2">
                <Link 
                  to={`/customer/listings/${id}/edit`}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-md text-sm font-medium"
                >
                  Редактировать
                </Link>
                {listing.status === 'unpublished' && (
                  <button
                    onClick={() => handleStatusChange('published')}
                    disabled={responseLoading}
                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-sm font-medium disabled:opacity-50"
                  >
                    Опубликовать
                  </button>
                )}
                {listing.status === 'published' && (
                  <button
                    onClick={() => handleStatusChange('unpublished')}
                    disabled={responseLoading}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-md text-sm font-medium disabled:opacity-50"
                  >
                    Снять с публикации
                  </button>
                )}
                {(listing.status === 'published' || listing.status === 'unpublished') && (
                  <button
                    onClick={handleOpenCompleteModal}
                    disabled={responseLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium disabled:opacity-50"
                  >
                    Завершить
                  </button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {/* Left Column - Details */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Детали</h3>
              <div className="space-y-4">
                <div className="flex">
                  <span className="text-gray-600 w-32">Тип заявки:</span>
                  <span className="text-gray-900">{listing.listing_type}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-32">Способ закупки:</span>
                  <span className="text-gray-900">{listing.purchase_method}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-32">Условия оплаты:</span>
                  <span className="text-gray-900">{listing.payment_terms}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-32">Бюджет:</span>
                  <span className="text-gray-900">{listing.budget}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-32">Местоположение:</span>
                  <span className="text-gray-900">{listing.location}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-32">Срок поставки:</span>
                  <span className="text-gray-900">
                    {listing.delivery_date 
                      ? new Date(listing.delivery_date).toLocaleDateString() 
                      : 'Не указан'}
                  </span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-32">Период публикации:</span>
                  <span className="text-gray-900">{listing.publication_period} дней</span>
                </div>
              </div>
            </div>

            {/* Right Column - Contact Information */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Контактная информация</h3>
              <div className="space-y-4">
                <div className="flex">
                  <span className="text-gray-600 w-32">Контактное лицо:</span>
                  <span className="text-gray-900">{listing.contact_name}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-32">Email:</span>
                  <span className="text-gray-900">{listing.contact_email}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-32">Телефон:</span>
                  <span className="text-gray-900">{listing.contact_phone}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Responses Section */}
      {responses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Отклики ({responses.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Исполнитель</TableHead>
                  <TableHead>Опыт</TableHead>
                  <TableHead>Сообщение</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {responses.map((response) => (
                  <TableRow key={response.id}>
                    <TableCell>
                      <div className="font-medium">{response.email}</div>
                      <div className="text-sm text-gray-500">{response.city}, {response.country}</div>
                    </TableCell>
                    <TableCell>{response.experience_level}</TableCell>
                    <TableCell>
                      <div className="truncate max-w-xs">{response.message}</div>
                    </TableCell>
                    <TableCell>{getResponseStatusBadge(response.status)}</TableCell>
                    <TableCell>{new Date(response.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Link to={`/customer/responses/${response.id}`} className="text-primary hover:text-primary-dark">
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Модальное окно завершения заявки */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Завершить заявку и оставить отзыв</h2>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Выберите исполнителя</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={selectedExecutor || ''}
                onChange={e => setSelectedExecutor(Number(e.target.value))}
              >
                <option value="">-- Выберите --</option>
                {modalResponses.filter(r => r.status === 'accepted').map(r => (
                  <option key={r.user_id} value={r.user_id}>{r.email} ({r.city}, {r.country})</option>
                ))}
              </select>
            </div>
            {selectedExecutor && (
              <div className="mb-4">
                <div className="flex items-center mb-1">
                  <span className="font-medium mr-2">Средний рейтинг исполнителя:</span>
                  {executorAvgRating !== null ? (
                    <span className="text-yellow-500 font-bold">{executorAvgRating.toFixed(2)} ★</span>
                  ) : (
                    <span className="text-gray-400">Нет отзывов</span>
                  )}
                  <span className="ml-2 text-gray-500 text-sm">({executorReviewCount} отзывов)</span>
                </div>
                {executorReviews.length > 0 && (
                  <div className="max-h-32 overflow-y-auto border rounded p-2 bg-gray-50">
                    {executorReviews.map((rev: any) => (
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
            <div className="mb-4">
              <label className="block mb-1 font-medium">Рейтинг</label>
              <div className="flex space-x-1">
                {[1,2,3,4,5].map(star => (
                  <button
                    key={star}
                    type="button"
                    className={star <= rating ? 'text-yellow-400 text-2xl' : 'text-gray-300 text-2xl'}
                    onClick={() => setRating(star)}
                    aria-label={`Поставить ${star} звезд`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Отзыв</label>
              <textarea
                className="w-full border rounded px-3 py-2"
                rows={3}
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                placeholder="Ваш отзыв об исполнителе..."
              />
            </div>
            {reviewError && <div className="text-red-600 mb-2 text-sm">{reviewError}</div>}
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setShowCompleteModal(false)}
                disabled={submittingReview}
              >
                Отмена
              </button>
              <button
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
                onClick={handleSubmitComplete}
                disabled={submittingReview}
              >
                Завершить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerListingDetail;
