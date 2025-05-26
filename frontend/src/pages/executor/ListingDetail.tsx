import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { listingsAPI, responsesAPI } from '../../api/api';

const ExecutorListingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<any>(null);
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [responseLoading, setResponseLoading] = useState(false);
  const [error, setError] = useState('');
  const [responseMessage, setResponseMessage] = useState('');

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
        
        // Fetch listing details
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

        // Объединяем данные объявления с данными владельца
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
          responses: responsesData
        };
        
        console.log('Combined listing data:', combinedData);
        setListing(combinedData);
      } catch (error: any) {
        console.error('Error fetching listing data:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Failed to load listing details. Please try again later.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchListingData();
  }, [id]);

  const handleCreateResponse = async () => {
    if (!id) return;
    
    try {
      setResponseLoading(true);
      const response = await responsesAPI.createResponse(Number(id), {
        message: responseMessage || "I'm interested in this listing and would like to offer my services."
      });
      
      // Update local state
      setResponse({
        id: response.data.response_id,
        status: 'pending',
        message: responseMessage || "I'm interested in this listing and would like to offer my services.",
        created_at: new Date().toISOString()
      });
      
      setResponseMessage('');
    } catch (error: any) {
      console.error('Error creating response:', error);
      setError(error.response?.data?.error || 'Failed to submit response. Please try again.');
    } finally {
      setResponseLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">Published</span>;
      case 'unpublished':
        return <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">Unpublished</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">Completed</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getResponseStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">Accepted</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">Rejected</span>;
      case 'pending':
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-800">Pending</span>;
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

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{listing.title}</h1>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span>Категория: {listing.category}</span>
          <span>•</span>
          <span>Создано: {new Date(listing.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Description */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Описание</h2>
        <p className="text-gray-700 whitespace-pre-line">{listing.description}</p>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column - Details */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Детали</h3>
          <div className="space-y-3">
            <div className="flex">
              <span className="font-medium w-32">Тип заявки:</span>
              <span className="text-gray-700">{listing.listing_type}</span>
            </div>
            <div className="flex">
              <span className="font-medium w-32">Способ закупки:</span>
              <span className="text-gray-700">{listing.purchase_method}</span>
            </div>
            <div className="flex">
              <span className="font-medium w-32">Условия оплаты:</span>
              <span className="text-gray-700">{listing.payment_terms}</span>
            </div>
            <div className="flex">
              <span className="font-medium w-32">Бюджет:</span>
              <span className="text-gray-700">{listing.budget}</span>
            </div>
            <div className="flex">
              <span className="font-medium w-32">Местоположение:</span>
              <span className="text-gray-700">{listing.location}</span>
            </div>
            <div className="flex">
              <span className="font-medium w-32">Срок поставки:</span>
              <span className="text-gray-700">
                {listing.delivery_date 
                  ? new Date(listing.delivery_date).toLocaleDateString() 
                  : 'Not specified'}
              </span>
            </div>
            <div className="flex">
              <span className="font-medium w-32">Период публикации:</span>
              <span className="text-gray-700">{listing.publication_period} дней</span>
            </div>
          </div>
        </div>

        {/* Right Column - Contact Information */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Контактная информация</h3>
          <div className="space-y-3">
            <div className="flex">
              <span className="font-medium w-32">Контактное лицо:</span>
              <span className="text-gray-700">{listing.contact_name}</span>
            </div>
            <div className="flex">
              <span className="font-medium w-32">Email:</span>
              <span className="text-gray-700">{listing.contact_email}</span>
            </div>
            <div className="flex">
              <span className="font-medium w-32">Телефон:</span>
              <span className="text-gray-700">{listing.contact_phone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Response Form */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Откликнуться на заявку</h3>
        <form onSubmit={handleCreateResponse} className="space-y-4">
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Сообщение (необязательно)
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Введите ваше сообщение..."
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={responseLoading}
              className="bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-md disabled:opacity-50"
            >
              {responseLoading ? 'Отправка...' : 'Откликнуться'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExecutorListingDetail;
