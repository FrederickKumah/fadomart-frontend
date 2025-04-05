import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { 
  fetchAdminProducts, 
  updateInventory,
  setInventoryUpdate,
  clearInventoryUpdates,
  clearAdminError,
  clearAdminSuccess
} from '../../features/admin/adminSlice';
import { FaSave, FaExclamationTriangle, FaUserShield } from 'react-icons/fa';
import toast from 'react-hot-toast';
import AdminNav from '../../components/AdminNav';
import { adminAPI } from '../../services/adminAPI';

export default function InventoryManagement() {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { products, loading, error, success, inventoryUpdates } = useSelector((state) => state.admin);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [showLowStock, setShowLowStock] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      dispatch(fetchAdminProducts());
    }
  }, [dispatch, isAdmin]);

  useEffect(() => {
    if (success) {
      toast.success(success);
      dispatch(clearAdminSuccess());
    }
    if (error) {
      toast.error(error);
      dispatch(clearAdminError());
    }
  }, [success, error, dispatch]);

  useEffect(() => {
    // Extract unique categories from products
    if (products.length > 0) {
      const uniqueCategories = [...new Set(products.map(product => product.category))];
      setCategories(uniqueCategories);
    }
  }, [products]);

  const handleQuantityChange = (productId, newQuantity) => {
    // Ensure quantity is a non-negative integer
    const quantity = Math.max(0, parseInt(newQuantity) || 0);
    dispatch(setInventoryUpdate({ id: productId, quantity }));
  };

  const handleSaveInventory = async () => {
    // Get all product IDs that have inventory updates
    const productIds = Object.keys(inventoryUpdates);
    
    if (productIds.length === 0) {
      toast.info('No inventory changes to save');
      return;
    }
    
    // Show loading toast
    const loadingToast = toast.loading('Updating inventory...');
    
    try {
      // Update each product's inventory
      for (const productId of productIds) {
        const quantity = inventoryUpdates[productId];
        await dispatch(updateInventory({ id: productId, quantity })).unwrap();
      }
      
      // Clear inventory updates after successful save
      dispatch(clearInventoryUpdates());
      
      // Update toast
      toast.success('Inventory updated successfully', { id: loadingToast });
    } catch (error) {
      console.error('Error updating inventory:', error);
      toast.error('Failed to update inventory', { id: loadingToast });
    }
  };

  const filteredProducts = products.filter(product => {
    // Filter by search term
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by category
    const matchesCategory = filterCategory === '' || product.category === filterCategory;
    
    // Filter by low stock
    const matchesLowStock = !showLowStock || product.quantity <= lowStockThreshold;
    
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  // Redirect if not admin
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" replace />;
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
        <h1 className="text-3xl font-bold mb-8">Inventory Management</h1>
        
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="search">
                Search Products
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Search by product name..."
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
                Filter by Category
              </label>
              <select
                id="category"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lowStock">
                Low Stock Threshold
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  id="lowStock"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                  className="shadow appearance-none border rounded w-20 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
                  min="1"
                />
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showLowStock}
                    onChange={(e) => setShowLowStock(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Show only low stock items</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Inventory Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-semibold">Product Inventory</h2>
            <button
              onClick={handleSaveInventory}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md flex items-center"
              disabled={Object.keys(inventoryUpdates).length === 0}
            >
              <FaSave className="mr-2" /> Save Changes
            </button>
          </div>
          
          {loading ? (
            <p className="p-4">Loading inventory...</p>
          ) : error ? (
            <p className="p-4 text-red-500">{error}</p>
          ) : filteredProducts.length === 0 ? (
            <p className="p-4">No products found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      New Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => {
                    const updatedQuantity = inventoryUpdates[product._id] !== undefined
                      ? inventoryUpdates[product._id]
                      : product.quantity;
                    
                    const isLowStock = product.quantity <= lowStockThreshold;
                    const hasChanges = inventoryUpdates[product._id] !== undefined;
                    
                    return (
                      <tr key={product._id} className={hasChanges ? 'bg-blue-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <img className="h-10 w-10 rounded-full object-cover" src={product.image} alt={product.name} />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{product.category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{product.quantity}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            value={updatedQuantity}
                            onChange={(e) => handleQuantityChange(product._id, e.target.value)}
                            className="shadow appearance-none border rounded w-20 py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            min="0"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isLowStock ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              <FaExclamationTriangle className="mr-1" /> Low Stock
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              In Stock
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Inventory Summary */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Inventory Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-blue-800">Total Products</h3>
              <p className="text-2xl font-bold text-blue-600">{products.length}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-red-800">Low Stock Items</h3>
              <p className="text-2xl font-bold text-red-600">
                {products.filter(product => product.quantity <= lowStockThreshold).length}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-green-800">Out of Stock</h3>
              <p className="text-2xl font-bold text-green-600">
                {products.filter(product => product.quantity === 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 