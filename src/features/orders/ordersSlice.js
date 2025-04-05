import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ordersAPI } from '../../services/api';

// Create an order
export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData, { rejectWithValue, getState }) => {
    try {
      console.log('Creating order with data:', orderData);
      
      // Get current auth state
      const { auth } = getState();
      console.log('Current auth state:', {
        isAuthenticated: auth.isAuthenticated,
        hasUser: !!auth.user,
        userId: auth.user?._id,
        hasToken: !!auth.token,
        userEmail: auth.user?.email
      });
      
      // Check if we have a token but no user ID
      if (auth.token && (!auth.user || !auth.user._id)) {
        console.log('Token exists but user data is missing, attempting to fetch user profile');
        try {
          // Try to fetch user profile to get the ID
          const response = await fetch('/api/users/me', {
            headers: {
              'Authorization': `Bearer ${auth.token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            console.log('User profile fetched successfully:', userData);
            // Update the user ID in the order data
            orderData.user = userData._id;
          } else {
            console.error('Failed to fetch user profile:', response.status);
            return rejectWithValue({ message: 'Authentication required. Please log in again.' });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          return rejectWithValue({ message: 'Authentication required. Please log in again.' });
        }
      }
      
      // Validate required fields
      if (!orderData.user) {
        console.error('Missing user ID in order data');
        return rejectWithValue({ message: 'User ID is required' });
      }
      
      if (!orderData.products || !Array.isArray(orderData.products) || orderData.products.length === 0) {
        console.error('Invalid products array:', orderData.products);
        return rejectWithValue({ message: 'At least one product is required' });
      }
      
      if (!orderData.totalPrice || orderData.totalPrice <= 0) {
        console.error('Invalid total price:', orderData.totalPrice);
        return rejectWithValue({ message: 'Total price must be greater than 0' });
      }
      
      if (!orderData.shippingAddress) {
        console.error('Missing shipping address');
        return rejectWithValue({ message: 'Shipping address is required' });
      }
      
      // Validate shipping address fields
      const requiredAddressFields = ['street', 'city', 'state', 'phone', 'email'];
      for (const field of requiredAddressFields) {
        if (!orderData.shippingAddress[field]) {
          console.error(`Missing required shipping address field: ${field}`);
          return rejectWithValue({ message: `${field} is required in shipping address` });
        }
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(orderData.shippingAddress.email)) {
        console.error('Invalid email format:', orderData.shippingAddress.email);
        return rejectWithValue({ message: 'Invalid email format in shipping address' });
      }
      
      // Validate each product
      for (const product of orderData.products) {
        console.log('Validating product:', product);
        
        // Check if product ID exists in any of the possible formats
        if (!product.product) {
          console.error('Missing product ID in order item:', product);
          return rejectWithValue({ message: 'Product ID is required for each item' });
        }
        
        if (!product.quantity || product.quantity < 1) {
          console.error('Invalid quantity in order item:', product);
          return rejectWithValue({ message: 'Quantity must be at least 1 for each product' });
        }
        
        // Check if price is present
        if (!product.price || product.price <= 0) {
          console.error('Invalid price in order item:', product);
          return rejectWithValue({ message: 'Price must be greater than 0 for each product' });
        }
      }
      
      // Log the order data in detail
      console.log('OrdersSlice - Order data structure:', {
        user: orderData.user,
        productsCount: orderData.products.length,
        products: orderData.products,
        totalPrice: orderData.totalPrice,
        shippingAddress: orderData.shippingAddress,
        hasNotes: !!orderData.notes
      });
      
      const response = await ordersAPI.createOrder(orderData);
      console.log('Order created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating order:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        data: error.response?.data
      });
      
      // Handle validation errors
      if (error.response?.status === 422) {
        // Log the validation errors in detail
        console.error('Validation errors from server:', error.response.data);
        
        // Extract validation error messages
        let errorMessage = 'Validation error. Please check your order details.';
        let validationErrors = [];
        
        if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
          validationErrors = error.response.data.errors;
          errorMessage = validationErrors.map(err => err.message || err.msg).join(', ');
        } else if (error.response.data.details) {
          if (Array.isArray(error.response.data.details)) {
            validationErrors = error.response.data.details;
            errorMessage = validationErrors.map(err => err.message || err.msg).join(', ');
          } else {
            errorMessage = error.response.data.details;
          }
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        
        return rejectWithValue({ 
          message: errorMessage,
          errors: validationErrors
        });
      }
      
      return rejectWithValue(error.response?.data || { message: 'Failed to create order' });
    }
  }
);

// Fetch user orders
export const fetchUserOrders = createAsyncThunk(
  'orders/fetchUserOrders',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Fetching user orders...');
      const response = await ordersAPI.getUserOrders();
      console.log('User orders fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching user orders:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch orders' });
    }
  }
);

// Fetch a single order by ID
export const fetchOrderById = createAsyncThunk(
  'orders/fetchOrderById',
  async (orderId, { rejectWithValue }) => {
    try {
      console.log('Fetching order by ID:', orderId);
      const response = await ordersAPI.getOrderById(orderId);
      console.log('Order fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching order:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch order' });
    }
  }
);

// Cancel an order
export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async ({ orderId, reason }, { rejectWithValue }) => {
    try {
      console.log('Cancelling order:', orderId, 'with reason:', reason);
      const response = await ordersAPI.cancelOrder(orderId, reason);
      console.log('Order cancelled successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error cancelling order:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || { message: 'Failed to cancel order' });
    }
  }
);

// Initialize payment
export const initializePayment = createAsyncThunk(
  'orders/initializePayment',
  async (orderId, { rejectWithValue }) => {
    try {
      console.log('Initializing payment for order:', orderId);
      const response = await ordersAPI.initializePayment(orderId);
      console.log('Payment initialized successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error initializing payment:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || { message: 'Failed to initialize payment' });
    }
  }
);

// Verify payment
export const verifyPayment = createAsyncThunk(
  'orders/verifyPayment',
  async (reference, { rejectWithValue }) => {
    try {
      console.log('Verifying payment with reference:', reference);
      const response = await ordersAPI.verifyPayment(reference);
      console.log('Payment verified successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error verifying payment:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || { message: 'Failed to verify payment' });
    }
  }
);

const initialState = {
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,
  success: false,
  paymentData: null,
  paymentLoading: false,
  paymentError: null,
  paymentSuccess: false,
  verificationLoading: false,
  verificationError: null,
  verificationSuccess: false,
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearOrderError: (state) => {
      state.error = null;
    },
    clearOrderSuccess: (state) => {
      state.success = false;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    clearPaymentData: (state) => {
      state.paymentData = null;
      state.paymentError = null;
      state.paymentSuccess = false;
    },
    clearVerificationData: (state) => {
      state.verificationError = null;
      state.verificationSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Order
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
        state.success = true;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to create order';
      })
      
      // Fetch User Orders
      .addCase(fetchUserOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch orders';
      })
      
      // Fetch Order By ID
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch order';
      })
      
      // Cancel Order
      .addCase(cancelOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.loading = false;
        // Update the order in the orders list if it exists
        if (state.orders.length > 0) {
          const index = state.orders.findIndex(order => order._id === action.payload._id);
          if (index !== -1) {
            state.orders[index] = action.payload;
          }
        }
        // Update the current order if it's the one being cancelled
        if (state.currentOrder && state.currentOrder._id === action.payload._id) {
          state.currentOrder = action.payload;
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to cancel order';
      })
      
      // Initialize Payment
      .addCase(initializePayment.pending, (state) => {
        state.paymentLoading = true;
        state.paymentError = null;
        state.paymentSuccess = false;
      })
      .addCase(initializePayment.fulfilled, (state, action) => {
        state.paymentLoading = false;
        state.paymentData = action.payload;
        state.paymentSuccess = true;
      })
      .addCase(initializePayment.rejected, (state, action) => {
        state.paymentLoading = false;
        state.paymentError = action.payload?.message || 'Failed to initialize payment';
      })
      
      // Verify Payment
      .addCase(verifyPayment.pending, (state) => {
        state.verificationLoading = true;
        state.verificationError = null;
        state.verificationSuccess = false;
      })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.verificationLoading = false;
        state.verificationSuccess = true;
        
        // Update the order status if the payment was successful
        if (action.payload.status === 'Paid') {
          // Update the order in the orders list if it exists
          if (state.orders.length > 0) {
            const index = state.orders.findIndex(order => order._id === action.payload.orderId);
            if (index !== -1) {
              state.orders[index].status = 'Paid';
            }
          }
          // Update the current order if it's the one being paid
          if (state.currentOrder && state.currentOrder._id === action.payload.orderId) {
            state.currentOrder.status = 'Paid';
          }
        }
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.verificationLoading = false;
        state.verificationError = action.payload?.message || 'Failed to verify payment';
      });
  },
});

export const { 
  clearOrderError, 
  clearOrderSuccess, 
  clearCurrentOrder,
  clearPaymentData,
  clearVerificationData
} = ordersSlice.actions;

export default ordersSlice.reducer; 