import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { listingsAPI, responsesAPI } from '../../api/api';

const CustomerListingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [responseLoading, setResponseLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    const fetchListingData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        // Fetch listing details
        const listingResponse = await listingsAPI.getListing(Number(id));
        setListing(listingResponse.data);
        
        // Fetch responses for this listing
        const responsesResponse = await responsesAPI.getListingResponses(Number(id));
        setResponses(responsesResponse.data.responses);
      } catch (error) {
        console.error('Error fetching listing data:', error);
        setError('Failed to load listing details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchListingData();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!id || !listing) return;
    
    try {
      setResponseLoading(true);
      await listingsAPI.changeListingStatus(Number(id), { status: newStatus });
      
      // Update local state
      setListing({
        ...listing,
        status: newStatus
      });
    } catch (error) {
      console.error('Error changing listing status:', error);
      setError('Failed to update listing status. Please try again.');
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
        <div className="flex space-x-2">
          <Link 
            to={`/customer/listings/${id}/edit`}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md"
          >
            Edit
          </Link>
          {listing.status === 'unpublished' && (
            <button
              onClick={() => handleStatusChange('published')}
              disabled={responseLoading}
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md disabled:opacity-50"
            >
              Publish
            </button>
          )}
          {listing.status === 'published' && (
            <button
              onClick={() => handleStatusChange('unpublished')}
              disabled={responseLoading}
              className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-md disabled:opacity-50"
            >
              Unpublish
            </button>
          )}
          {(listing.status === 'published' || listing.status === 'unpublished') && (
            <button
              onClick={() => handleStatusChange('completed')}
              disabled={responseLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md disabled:opacity-50"
            >
              Mark as Completed
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Listing Details
          </button>
          <button
            onClick={() => setActiveTab('responses')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'responses'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Responses ({responses.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'details' ? (
        <div className="bg-white p-6 rounded-lg shadow-sm">
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
      ) : (
        <div className="bg-white rounded-lg shadow-sm">
          {responses.length > 0 ? (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Executor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Experience
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Message
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {responses.map((response) => (
                    <tr key={response.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{response.email}</div>
                        <div className="text-xs text-gray-500">{response.city}, {response.country}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{response.experience_level}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 truncate max-w-xs">{response.message}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getResponseStatusBadge(response.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(response.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {response.status === 'pending' && (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleResponseAction(response.id, 'accepted')}
                              disabled={responseLoading}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleResponseAction(response.id, 'rejected')}
                              disabled={responseLoading}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            >
                              Reject
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
            <div className="p-6 text-center">
              <p className="text-gray-500">No responses yet for this listing.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerListingDetail;
