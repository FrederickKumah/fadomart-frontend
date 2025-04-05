import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Link } from 'react-router-dom';
import { fetchAdminProducts, calculateDashboardStats } from '../../features/admin/adminSlice';
import { FaBox, FaShoppingCart, FaUsers, FaChartLine, FaUserShield } from 'react-icons/fa';
import AdminNav from '../../components/AdminNav';

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { products, loading, error, dashboardStats } = useSelector((state) => state.admin);
  const [loadingStats, setLoadingStats] = useState(true);
  const [renderError, setRenderError] = useState(null);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      try {
        // Fetch products first
        dispatch(fetchAdminProducts());
        
        // Calculate dashboard stats after products are loaded
        const timer = setTimeout(() => {
          dispatch(calculateDashboardStats());
          setLoadingStats(false);
        }, 500);
        
        return () => clearTimeout(timer);
      } catch (err) {
        console.error("Error in dashboard initialization:", err);
        setRenderError("Failed to initialize dashboard");
      }
    }
  }, [dispatch, isAdmin]);

  // Redirect if not admin
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  // Safely render product data
  const renderProductRow = (product) => {
    try {
      // Ensure we have a valid product object
      if (!product || typeof product !== 'object') {
        return null;
      }

      // Extract values with fallbacks
      const id = product._id || product.id || '';
      const name = typeof product.name === 'string' ? product.name : 'Unnamed Product';
      const category = typeof product.category === 'string' ? product.category : 'Uncategorized';
      const price = typeof product.price === 'number' ? product.price : 0;
      const stock = typeof product.stock === 'number' ? product.stock : 0;

      return (
        <tr key={id || Math.random().toString(36).substr(2, 9)}>
          <td className="px-6 py-4 whitespace-nowrap">{name}</td>
          <td className="px-6 py-4 whitespace-nowrap">{category}</td>
          <td className="px-6 py-4 whitespace-nowrap">${price.toFixed(2)}</td>
          <td className="px-6 py-4 whitespace-nowrap">{stock}</td>
          <td className="px-6 py-4 whitespace-nowrap">
            <Link to={`/admin/products/edit/${id}`} className="text-blue-500 hover:text-blue-700 mr-2">
              Edit
            </Link>
          </td>
        </tr>
      );
    } catch (err) {
      console.error("Error rendering product row:", err, product);
      return null;
    }
  };

  // If there's a render error, show a simple error message
  if (renderError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error</p>
          <p>{renderError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminNav />
      
      {/* Admin Banner */}
      <div className="bg-blue-600 text-white py-3 px-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <FaUserShield className="text-xl mr-2" />
            <span className="font-medium">Admin Dashboard</span>
          </div>
          <div className="text-sm">
            Welcome, {user?.userName || user?.email || 'Admin'}
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
                <FaBox className="text-2xl" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Products</p>
                <h3 className="text-2xl font-bold">{loadingStats ? '...' : dashboardStats?.totalProducts || 0}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
                <FaShoppingCart className="text-2xl" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Orders</p>
                <h3 className="text-2xl font-bold">{loadingStats ? '...' : dashboardStats?.totalOrders || 0}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-500 mr-4">
                <FaUsers className="text-2xl" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Users</p>
                <h3 className="text-2xl font-bold">{loadingStats ? '...' : dashboardStats?.totalUsers || 0}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-500 mr-4">
                <FaChartLine className="text-2xl" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Revenue</p>
                <h3 className="text-2xl font-bold">${loadingStats ? '...' : (dashboardStats?.totalRevenue || 0).toFixed(2)}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/admin/products" className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-center">
              Manage Products
            </Link>
            <Link to="/admin/inventory" className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md text-center">
              Manage Inventory
            </Link>
            <Link to="/admin/reports" className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-md text-center">
              View Reports
            </Link>
          </div>
        </div>

        {/* Recent Products */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Products</h2>
          {loading ? (
            <p>Loading products...</p>
          ) : error ? (
            <p className="text-red-500">Error loading products: {error}</p>
          ) : !Array.isArray(products) || products.length === 0 ? (
            <p>No products found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.slice(0, 5).map(renderProductRow).filter(Boolean)}
                </tbody>
              </table>
            </div>
          )}
          {Array.isArray(products) && products.length > 5 && (
            <div className="mt-4 text-right">
              <Link to="/admin/products" className="text-blue-500 hover:text-blue-700">
                View All Products
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 