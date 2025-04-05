import axios from 'axios';
import { isValidItemId } from '../utils/cartDebug';

const API_BASE_URL = 'https://fadomart-api.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('Request interceptor - Token:', token ? 'Present' : 'Missing');
    console.log('Request URL:', config.url);
    console.log('Request Method:', config.method);
    
    if (token) {
      // Log the first 10 characters of the token for debugging (don't log the full token for security)
      console.log('Token preview:', token.substring(0, 10) + '...');
      
      // Clean the token if it already has 'Bearer ' prefix
      const cleanToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      config.headers.Authorization = cleanToken;
      
      // Log headers for debugging
      const previewToken = cleanToken.substring(0, 16) + '...';
      console.log('Authorization header set:', previewToken);
      console.log('Request headers:', {
        ...config.headers,
        Authorization: previewToken
      });
    } else {
      console.warn('No authentication token found in localStorage');
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      console.error('Authentication error: Token may be invalid or expired');
      // You could dispatch a logout action here if needed
      // store.dispatch(logout());
    }
    
    return Promise.reject(error);
  }
);

// Function to refresh token
export const refreshToken = async () => {
  try {
    // This assumes your backend has a refresh token endpoint
    // You may need to adjust this based on your actual API
    const response = await api.post('/users/refresh-token');
    
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      console.log('Token refreshed successfully');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    return false;
  }
};

// Function to check if token is valid
export const checkTokenValidity = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found in localStorage');
      return false;
    }
    
    // Try to make a simple request to verify token
    const response = await api.get('/users/me');
    console.log('Token validation response:', response.status);
    return true;
  } catch (error) {
    console.error('Token validation error:', error.response?.status);
    if (error.response?.status === 401) {
      console.warn('Token is invalid or expired');
      
      // Try to refresh the token
      const refreshed = await refreshToken();
      if (refreshed) {
        return true;
      }
      
      // Clear the invalid token
      localStorage.removeItem('token');
    }
    return false;
  }
};

// API endpoints
export const authAPI = {
  login: (credentials) => api.post('/users/login', credentials),
  register: (userData) => api.post('/users/signUp', userData),
  logout: () => api.post('/users/logout'),
  getProfile: () => api.get('/users/me'),
  requestPasswordReset: () => api.post('/request-password-reset'),
  resetPassword: (data) => api.post('/reset-password', data),
};

export const productsAPI = {
  getAllProducts: (params) => api.get('/products', { params }),
  getProductById: (id) => {
    console.log('API - Fetching product by ID:', id);
    
    // Validate ID
    if (!id) {
      console.error('API - Invalid product ID: ID is undefined or empty');
      return Promise.reject(new Error('Invalid product ID'));
    }
    
    return api.get(`/products/${id}`).then(response => {
      console.log('API - Product response:', response.data);
      return response;
    }).catch(error => {
      console.error('API - Product fetch error:', error.response?.data || error.message);
      throw error;
    });
  },
  addProduct: (productData) => {
    const formData = new FormData();
    // Append all product data to formData
    Object.keys(productData).forEach(key => {
      if (key === 'image' && productData[key] instanceof File) {
        formData.append('image', productData[key]);
      } else {
        formData.append(key, productData[key]);
      }
    });
    return api.post('/products', formData, {
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
    return api.patch(`/products/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteProduct: (id) => api.delete(`/products/${id}`),
  getProductsCount: () => api.get('/products/count'),
  syncProductInventory: (productId) => api.put(`/${productId}/sync-inventory`),
};

export const cartAPI = {
  getCart: () => {
    console.log('API - Fetching cart...');
    return api.get('/cart').then(response => {
      console.log('API - Cart response:', response.data);
      return response;
    }).catch(error => {
      console.error('API - Cart fetch error:', error.response?.data || error.message);
      throw error;
    });
  },
  addToCart: (productId, quantity) => {
    console.log('API - Adding to cart:', { product: productId, quantity });
    return api.post('/cart', { product: productId, quantity }).then(response => {
      console.log('API - Add to cart response:', response.data);
      return response;
    }).catch(error => {
      console.error('API - Add to cart error:', error.response?.data || error.message);
      throw error;
    });
  },
  updateCartItem: (itemId, quantity) => {
    // Validate itemId
    if (!isValidItemId(itemId)) {
      console.error('API - Invalid itemId for update:', itemId);
      return Promise.reject(new Error('Invalid item ID'));
    }
    
    // Ensure itemId is a string
    const itemIdString = String(itemId);
    
    // Validate quantity
    if (!quantity || quantity < 1) {
      console.error('API - Invalid quantity:', quantity);
      return Promise.reject(new Error('Invalid quantity'));
    }
    
    console.log('API - Updating cart item:', { itemId: itemIdString, quantity });
    
    // Try to find the item in the cart first to verify it exists
    return api.get('/cart').then(cartResponse => {
      console.log('API - Current cart items:', cartResponse.data);
      
      // Check if cartResponse.data is an array
      if (!Array.isArray(cartResponse.data)) {
        console.log('API - Cart response is not an array, checking if it has cart property');
        
        // Check if response has a cart property that is an array
        if (cartResponse.data && cartResponse.data.cart && Array.isArray(cartResponse.data.cart)) {
          console.log('API - Using cart property from response');
          
          // Check if the item exists in the cart
          const itemExists = cartResponse.data.cart.some(item => 
            String(item._id) === itemIdString || 
            String(item.id) === itemIdString || 
            String(item.product?._id) === itemIdString
          );
          
          if (!itemExists) {
            console.error('API - Item not found in cart:', itemIdString);
            return Promise.reject({ 
              response: { 
                data: { message: 'Cart item not found' },
                status: 404
              } 
            });
          }
        } else if (cartResponse.data && typeof cartResponse.data === 'object') {
          // Handle case where response is a single cart item
          console.log('API - Response is a single cart item');
          
          // Check if this is the item we want to update
          const isTargetItem = 
            String(cartResponse.data._id) === itemIdString || 
            String(cartResponse.data.id) === itemIdString || 
            String(cartResponse.data.product?._id) === itemIdString;
          
          if (!isTargetItem) {
            console.error('API - Item not found in cart:', itemIdString);
            return Promise.reject({ 
              response: { 
                data: { message: 'Cart item not found' },
                status: 404
              } 
            });
          }
        } else {
          console.error('API - Unexpected cart response structure:', cartResponse.data);
          return Promise.reject({ 
            response: { 
              data: { message: 'Invalid cart data structure' },
              status: 500
            } 
          });
        }
      } else {
        // Check if the item exists in the cart
        const itemExists = cartResponse.data.some(item => 
          String(item._id) === itemIdString || 
          String(item.id) === itemIdString || 
          String(item.product?._id) === itemIdString
        );
        
        if (!itemExists) {
          console.error('API - Item not found in cart:', itemIdString);
          return Promise.reject({ 
            response: { 
              data: { message: 'Cart item not found' },
              status: 404
            } 
          });
        }
      }
      
      // Proceed with update if item exists
      return api.put(`/cart/${itemIdString}`, { quantity }).then(response => {
        console.log('API - Update cart item response:', response.data);
        return response;
      }).catch(error => {
        console.error('API - Update cart item error:', error.response?.data || error.message);
        
        // Log additional details for debugging
        if (error.response) {
          console.error('API - Error status:', error.response.status);
          console.error('API - Error headers:', error.response.headers);
        }
        
        throw error;
      });
    }).catch(error => {
      console.error('API - Error fetching cart:', error.response?.data || error.message);
      throw error;
    });
  },
  removeFromCart: (itemId) => {
    // Validate itemId
    if (!isValidItemId(itemId)) {
      console.error('API - Invalid itemId for removal:', itemId);
      return Promise.reject(new Error('Invalid item ID'));
    }
    
    // Ensure itemId is a string
    const itemIdString = String(itemId);
    
    console.log('API - Removing from cart:', itemIdString);
    console.log('API - Item ID type:', typeof itemIdString);
    
    // Try to find the item in the cart first to verify it exists
    return api.get('/cart').then(cartResponse => {
      console.log('API - Current cart items:', cartResponse.data);
      
      // Check if cartResponse.data is an array
      if (!Array.isArray(cartResponse.data)) {
        console.log('API - Cart response is not an array, checking if it has cart property');
        
        // Check if response has a cart property that is an array
        if (cartResponse.data && cartResponse.data.cart && Array.isArray(cartResponse.data.cart)) {
          console.log('API - Using cart property from response');
          
          // Check if the item exists in the cart
          const itemExists = cartResponse.data.cart.some(item => 
            String(item._id) === itemIdString || 
            String(item.id) === itemIdString || 
            String(item.product?._id) === itemIdString
          );
          
          if (!itemExists) {
            console.error('API - Item not found in cart:', itemIdString);
            return Promise.reject({ 
              response: { 
                data: { message: 'Cart item not found' },
                status: 404
              } 
            });
          }
        } else if (cartResponse.data && typeof cartResponse.data === 'object') {
          // Handle case where response is a single cart item
          console.log('API - Response is a single cart item');
          
          // Check if this is the item we want to remove
          const isTargetItem = 
            String(cartResponse.data._id) === itemIdString || 
            String(cartResponse.data.id) === itemIdString || 
            String(cartResponse.data.product?._id) === itemIdString;
          
          if (!isTargetItem) {
            console.error('API - Item not found in cart:', itemIdString);
            return Promise.reject({ 
              response: { 
                data: { message: 'Cart item not found' },
                status: 404
              } 
            });
          }
        } else {
          console.error('API - Unexpected cart response structure:', cartResponse.data);
          return Promise.reject({ 
            response: { 
              data: { message: 'Invalid cart data structure' },
              status: 500
            } 
          });
        }
      } else {
        // Check if the item exists in the cart
        const itemExists = cartResponse.data.some(item => 
          String(item._id) === itemIdString || 
          String(item.id) === itemIdString || 
          String(item.product?._id) === itemIdString
        );
        
        if (!itemExists) {
          console.error('API - Item not found in cart:', itemIdString);
          return Promise.reject({ 
            response: { 
              data: { message: 'Cart item not found' },
              status: 404
            } 
          });
        }
      }
      
      // Proceed with removal if item exists
      return api.delete(`/cart/${itemIdString}`).then(response => {
        console.log('API - Remove from cart response:', response.data);
        return response;
      }).catch(error => {
        console.error('API - Remove from cart error:', error.response?.data || error.message);
        
        // Log additional details for debugging
        if (error.response) {
          console.error('API - Error status:', error.response.status);
          console.error('API - Error headers:', error.response.headers);
        }
        
        throw error;
      });
    }).catch(error => {
      console.error('API - Error fetching cart:', error.response?.data || error.message);
      throw error;
    });
  },
  clearCart: () => {
    console.log('API - Clearing cart...');
    return api.delete('/cart').then(response => {
      console.log('API - Clear cart response:', response.data);
      return response;
    }).catch(error => {
      console.error('API - Clear cart error:', error.response?.data || error.message);
      throw error;
    });
  },
};

export const ordersAPI = {
  createOrder: (orderData) => api.post('/orders', orderData),
  getOrders: () => api.get('/orders'),
  getOrderById: (orderId) => api.get(`/orders/${orderId}`),
};

export const userAPI = {
  getProfile: () => api.get('/users/me'),
  getProfiles: () => api.get('/users'),
  updateProfile: (userData) => api.patch('/users/update', userData),
};

export default api; 