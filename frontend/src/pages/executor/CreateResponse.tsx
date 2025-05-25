import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { responsesAPI, listingsAPI } from '../../api/api';
import { useAuth } from '../../contexts/AuthContext';

const ExecutorCreateResponse: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchListingData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await listingsAPI.getListing(Number(id));
        setListing(response.data);
      } catch (error) {
        console.error('Error fetching listing data:', error);
        setError('Failed to load listing details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchListingData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!id) return;
    
    try {
      setSubmitting(true);
      
      // Submit response
      await responsesAPI.createResponse(Number(id), { message });
      
      // Navigate back to the listing detail page
      navigate(`/executor/listings/${id}`);
    } catch (err: any) {
      console.error('Error creating response:', err);
      setError(err.response?.data?.error || 'Failed to submit response. Please try again.');
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
      <h1 className="text-2xl font-bold mb-6">Create Response</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {/* Listing Summary */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-lg font-semibold mb-2">{listing.title}</h2>
        <div className="flex items-center mb-4 text-sm text-gray-500">
          <span className="mr-4">Category: {listing.category}</span>
          <span>Posted: {new Date(listing.created_at).toLocaleDateString()}</span>
        </div>
        <p className="text-gray-700 mb-4 line-clamp-3">{listing.description}</p>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {listing.location && <span className="mr-4">Location: {listing.location}</span>}
            {listing.deadline && (
              <span>Deadline: {new Date(listing.deadline).toLocaleDateString()}</span>
            )}
          </div>
          {listing.budget && (
            <div className="text-lg font-bold text-primary">${listing.budget}</div>
          )}
        </div>
      </div>
      
      {/* Response Form */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Your Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Describe why you're interested in this listing and what you can offer..."
            ></textarea>
            <p className="mt-1 text-sm text-gray-500">
              This will cost 1 point from your balance. Your current balance: {user?.executor_profile?.points || 0} points.
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(`/executor/listings/${id}`)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || (user?.executor_profile?.points || 0) < 1}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Response (1 point)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExecutorCreateResponse;
