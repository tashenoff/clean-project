import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listingsAPI } from '../../api/api';
import { useAuth } from '../../contexts/AuthContext';

interface Listing {
  id: number;
  title: string;
  category: string;
  status: string;
  created_at: string;
  company_id: number;
  description: string;
  budget?: number;
  location?: string;
  deadline?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
}

const CustomerListings: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('my');
  const { user } = useAuth();

  console.log('Component State:', {
    user,
    activeTab,
    filter,
    listingsCount: listings.length
  });

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        console.log('Fetching listings:', { 
          activeTab, 
          filter,
          user: {
            id: user?.id,
            company_id: user?.company_id,
            role: user?.role
          }
        });
        
        const response = activeTab === 'my' 
          ? await listingsAPI.getMyListings({
              status: filter !== 'all' ? filter : undefined
            })
          : await listingsAPI.getListings({
              status: filter !== 'all' ? filter : undefined
            });
        
        console.log('API Response:', {
          status: response.status,
          statusText: response.statusText,
          data: response.data,
          headers: response.headers
        });
        
        if (response.data.listings) {
          console.log('Setting listings:', {
            count: response.data.listings.length,
            listings: response.data.listings
          });
          setListings(response.data.listings);
        }
      } catch (error) {
        console.error('Error fetching listings:', {
          error,
          activeTab,
          filter,
          user: user?.id
        });
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [filter, activeTab, user]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log('Filter changed:', e.target.value);
    setFilter(e.target.value);
  };

  const handleTabChange = (tab: 'all' | 'my') => {
    console.log('Tab changed:', tab);
    setActiveTab(tab);
  };

  const filteredListings = listings;

  console.log('Render state:', {
    totalListings: listings.length,
    activeTab,
    userCompanyId: user?.company_id,
    filter,
    isLoading: loading
  });

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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Listings</h1>
        <Link 
          to="/customer/listings/create"
          className="bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-md"
        >
          Create New Listing
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex" aria-label="Tabs">
          <button
            onClick={() => handleTabChange('my')}
            className={`${
              activeTab === 'my'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm mr-8`}
          >
            My Listings
          </button>
          <button
            onClick={() => handleTabChange('all')}
            className={`${
              activeTab === 'all'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            All Listings
          </button>
        </nav>
      </div>

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
            <option value="published">Published</option>
            <option value="unpublished">Unpublished</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Listings */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : filteredListings.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredListings.map((listing) => (
                <tr key={listing.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link to={`/customer/listings/${listing.id}`} className="text-primary hover:text-primary-dark font-medium">
                      {listing.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {listing.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(listing.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(listing.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link to={`/customer/listings/${listing.id}`} className="text-primary hover:text-primary-dark mr-3">
                      View
                    </Link>
                    {listing.company_id === user?.company_id && (
                      <Link to={`/customer/listings/${listing.id}/edit`} className="text-gray-600 hover:text-gray-900">
                        Edit
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-sm text-center">
          <p className="text-gray-500 mb-4">
            {activeTab === 'my' ? "You don't have any listings yet." : "No listings found."}
          </p>
          {activeTab === 'my' && (
            <Link 
              to="/customer/listings/create"
              className="inline-block bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-md"
            >
              Create Your First Listing
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerListings;
