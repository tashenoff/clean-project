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
                    onClick={() => handleStatusChange('closed')}
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
    </div>
  );
};

export default CustomerListingDetail;
