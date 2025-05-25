import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listingsAPI, responsesAPI } from '../../api/api';

const ExecutorListings: React.FC = () => {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('published');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        const response = await listingsAPI.getListings({
          status: filter,
          category: category || undefined,
          page,
          per_page: 10
        });
        
        setListings(response.data.listings);
        setTotalPages(response.data.total_pages);
      } catch (error) {
        console.error('Error fetching listings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [filter, category, page]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter(e.target.value);
    setPage(1); // Reset to first page when filter changes
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
    setPage(1); // Reset to first page when category changes
  };

  const handleCreateResponse = async (listingId: number) => {
    try {
      await responsesAPI.createResponse(listingId, {
        message: "I'm interested in this listing and would like to offer my services."
      });
      
      // Refresh listings to update response status
      const response = await listingsAPI.getListings({
        status: filter,
        category: category || undefined,
        page,
        per_page: 10
      });
      
      setListings(response.data.listings);
    } catch (error) {
      console.error('Error creating response:', error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Available Listings</h1>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center">
            <label htmlFor="status-filter" className="mr-2 text-sm font-medium text-gray-700">
              Status:
            </label>
            <select
              id="status-filter"
              value={filter}
              onChange={handleFilterChange}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary"
            >
              <option value="published">Published</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <label htmlFor="category-filter" className="mr-2 text-sm font-medium text-gray-700">
              Category:
            </label>
            <select
              id="category-filter"
              value={category}
              onChange={handleCategoryChange}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary"
            >
              <option value="">All Categories</option>
              <option value="Metal Processing">Metal Processing</option>
              <option value="Construction">Construction</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Transportation">Transportation</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Listings */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : listings.length > 0 ? (
        <div className="space-y-4">
          {listings.map((listing) => (
            <div key={listing.id} className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <Link 
                    to={`/executor/listings/${listing.id}`}
                    className="text-xl font-semibold text-primary hover:text-primary-dark"
                  >
                    {listing.title}
                  </Link>
                  <div className="flex items-center mt-1 space-x-4">
                    <span className="text-sm text-gray-500">
                      Category: {listing.category}
                    </span>
                    <span className="text-sm text-gray-500">
                      Posted: {new Date(listing.created_at).toLocaleDateString()}
                    </span>
                    {listing.location && (
                      <span className="text-sm text-gray-500">
                        Location: {listing.location}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  {listing.budget && (
                    <div className="text-lg font-bold text-secondary">
                      ${listing.budget}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-gray-700">
                  {listing.description.length > 200 
                    ? `${listing.description.substring(0, 200)}...` 
                    : listing.description}
                </p>
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <Link 
                  to={`/executor/listings/${listing.id}`}
                  className="text-primary hover:text-primary-dark text-sm font-medium"
                >
                  View Details
                </Link>
                
                {listing.has_responded ? (
                  <span className="text-sm text-gray-500 italic">
                    You have already responded to this listing
                  </span>
                ) : (
                  <button
                    onClick={() => handleCreateResponse(listing.id)}
                    className="bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-md text-sm"
                  >
                    Respond (1 point)
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow-sm">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    page === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      &larr;
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i + 1)}
                        className={`relative inline-flex items-center px-4 py-2 border ${
                          page === i + 1
                            ? 'bg-primary border-primary text-white'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        } text-sm font-medium`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        page === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      &rarr;
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-sm text-center">
          <p className="text-gray-500 mb-4">No listings found matching your criteria.</p>
          <button
            onClick={() => {
              setFilter('published');
              setCategory('');
              setPage(1);
            }}
            className="inline-block bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-md"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default ExecutorListings;
