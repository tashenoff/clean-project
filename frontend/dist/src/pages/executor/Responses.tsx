import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { responsesAPI } from '../../api/api';

const ExecutorResponses: React.FC = () => {
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        setLoading(true);
        const response = await responsesAPI.getMyResponses({
          status: filter !== 'all' ? filter : undefined,
          page,
          per_page: 10
        });
        
        setResponses(response.data.responses);
        setTotalPages(response.data.total_pages);
      } catch (error) {
        console.error('Error fetching responses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResponses();
  }, [filter, page]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter(e.target.value);
    setPage(1); // Reset to first page when filter changes
  };

  const getStatusBadge = (status: string) => {
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

  const handleDeleteResponse = async (responseId: number) => {
    try {
      await responsesAPI.deleteResponse(responseId);
      
      // Refresh responses
      const response = await responsesAPI.getMyResponses({
        status: filter !== 'all' ? filter : undefined,
        page,
        per_page: 10
      });
      
      setResponses(response.data.responses);
      
      // If we deleted the last item on the page and it's not the first page,
      // go back one page
      if (response.data.responses.length === 0 && page > 1) {
        setPage(page - 1);
      }
    } catch (error) {
      console.error('Error deleting response:', error);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Responses</h1>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
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
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Responses */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : responses.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Listing
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
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
                <tr key={response.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link 
                      to={`/executor/listings/${response.listing_id}`}
                      className="text-primary hover:text-primary-dark font-medium"
                    >
                      {response.listing_title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {response.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(response.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(response.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link 
                      to={`/executor/listings/${response.listing_id}`}
                      className="text-primary hover:text-primary-dark mr-3"
                    >
                      View Listing
                    </Link>
                    {response.status === 'pending' && (
                      <button
                        onClick={() => handleDeleteResponse(response.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
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
          <p className="text-gray-500 mb-4">You haven't responded to any listings yet.</p>
          <Link 
            to="/executor/listings"
            className="inline-block bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-md"
          >
            Browse Available Listings
          </Link>
        </div>
      )}
    </div>
  );
};

export default ExecutorResponses;
