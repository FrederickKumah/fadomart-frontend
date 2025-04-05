import api from './api';

// Admin API endpoints
export const adminAPI = {
  // Product management
  getAllProducts: (params) => api.get('/admin/products', { params }),
  getProductById: (id) => api.get(`/admin/products/${id}`),
  createProduct: (productData) => {
    const formData = new FormData();
    // Append all product data to formData
    Object.keys(productData).forEach(key => {
      if (key === 'image' && productData[key] instanceof File) {
        formData.append('image', productData[key]);
      } else {
        formData.append(key, productData[key]);
      }
    });
    return api.post('/admin/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  updateProduct: (id, productData) => {
    const formData = new FormData();
    // Append all product data to formData
    Object.keys(productData).forEach(key => {
      if (key === 'image' && productData[key] instanceof File) {
        formData.append('image', productData[key]);
      } else {
        formData.append(key, productData[key]);
      }
    });
    return api.patch(`/admin/products/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  
  // Inventory management
  updateInventory: (id, quantity) => api.patch(`/admin/products/${id}/inventory`, { quantity }),
  getInventoryReport: () => api.get('/admin/reports/inventory'),
  
  // Sales reports
  getSalesReport: (params) => api.get('/admin/reports/sales', { params }),
  getOrderDetails: (orderId) => api.get(`/admin/orders/${orderId}`),
  
  // User management
  getAllUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, userData) => api.patch(`/admin/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  
  // Dashboard statistics
  getDashboardStats: async () => {
    try {
      // Try to fetch from the API
      return await api.get('/admin/dashboard/stats');
    } catch (error) {
      console.warn('Dashboard stats endpoint not available, using fallback data');
      
      // Return a mock response with the same structure as the API would return
      return {
        data: {
          totalProducts: 0,
          totalOrders: 0,
          totalUsers: 0,
          totalRevenue: 0
        }
      };
    }
  },
};

export default adminAPI; 