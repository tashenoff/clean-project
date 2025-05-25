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
      if (!id) return;
      
      try {
        setLoading(true);
        // Fetch listing details
        const listingResponse = await listingsAPI.getListing(Number(id));
        setListing(listingResponse.data);
        
        // Check if user has already responded to this listing
        try {
          const responsesResponse = await responsesAPI.getMyResponses({
            listing_id: Number(id)
          });
          
          if (responsesResponse.data.responses.length > 0) {
            setResponse(responsesResponse.data.responses[0]);
          }
        } catch (error) {
          console.error('Error checking for existing response:', error);
        }
      } catch (error) {
        console.error('Error fetching listing data:', error);
        setError('Failed to load listing details. Please try again later.');
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
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">{listing.title}</h1>
          <div className="flex items-center mt-2 space-x-4">
            <div>{getStatusBadge(listing.status)}</div>
            <div className="text-sm text-gray-500">
              Created: {new Date(listing.created_at).toLocaleDateString()}
            </div>
            <div className="text-sm text-gray-500">
              Category: {listing.category}
            </div>
          </div>
        </div>
        <div>
          {listing.budget && (
            <div className="text-xl font-bold text-secondary">
              ${listing.budget}
            </div>
          )}
        </div>
      </div>

      {/* Listing Details */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-lg font-semibold mb-4">Description</h2>
        <p className="text-gray-700 whitespace-pre-line mb-6">{listing.description}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-md font-semibold mb-2">Details</h3>
            <div className="space-y-2">
              <div className="flex">
                <span className="font-medium w-32">Budget:</span>
                <span>{listing.budget ? `$${listing.budget}` : 'Not specified'}</span>
              </div>
              <div className="flex">
                <span className="font-medium w-32">Location:</span>
                <span>{listing.location || 'Not specified'}</span>
              </div>
              <div className="flex">
                <span className="font-medium w-32">Deadline:</span>
                <span>
                  {listing.deadline 
                    ? new Date(listing.deadline).toLocaleDateString() 
                    : 'Not specified'}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-semibold mb-2">Contact Information</h3>
            <div className="space-y-2">
              <div className="flex">
                <span className="font-medium w-32">Contact Name:</span>
                <span>{listing.contact_name || 'Not specified'}</span>
              </div>
              <div className="flex">
                <span className="font-medium w-32">Contact Email:</span>
                <span>{listing.contact_email || 'Not specified'}</span>
              </div>
              <div className="flex">
                <span className="font-medium w-32">Contact Phone:</span>
                <span>{listing.contact_phone || 'Not specified'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Response Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Your Response</h2>
        
        {response ? (
          <div>
            <div className="flex items-center mb-4">
              <span className="mr-2">Status:</span>
              {getResponseStatusBadge(response.status)}
            </div>
            
            <div className="mb-4">
              <h3 className="text-md font-medium mb-2">Your Message:</h3>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-md">{response.message}</p>
            </div>
            
            <div className="text-sm text-gray-500">
              Submitted on: {new Date(response.created_at).toLocaleString()}
            </div>
            
            {response.status === 'pending' && (
              <div className="mt-4">
                <button
                  onClick={async () => {
                    try {
                      await responsesAPI.deleteResponse(response.id);
                      setResponse(null);
                    } catch (error) {
                      console.error('Error deleting response:', error);
                      setError('Failed to delete response. Please try again.');
                    }
                  }}
                  className="text-red-600 hover:text-red-900 text-sm font-medium"
                >
                  Delete Response
                </button>
              </div>
            )}
          </div>
        ) : listing.status === 'published' ? (
          <div>
            <p className="mb-4">
              Respond to this listing to express your interest. This will cost 1 point from your balance.
            </p>
            
            <div className="mb-4">
              <label htmlFor="response-message" className="block text-sm font-medium text-gray-700 mb-1">
                Message (optional)
              </label>
              <textarea
                id="response-message"
                rows={4}
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="I'm interested in this listing and would like to offer my services."
              ></textarea>
            </div>
            
            <button
              onClick={handleCreateResponse}
              disabled={responseLoading}
              className="bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-md disabled:opacity-50"
            >
              {responseLoading ? 'Submitting...' : 'Submit Response (1 point)'}
            </button>
          </div>
        ) : (
          <p className="text-gray-500">
            This listing is {listing.status} and is no longer accepting responses.
          </p>
        )}
      </div>
      
      {/* Back Button */}
      <div className="mt-6">
        <Link 
          to="/executor/listings"
          className="text-primary hover:text-primary-dark font-medium"
        >
          &larr; Back to Listings
        </Link>
      </div>
    </div>
  );
};

export default ExecutorListingDetail;
