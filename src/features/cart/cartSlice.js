import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cartAPI } from '../../services/api';
import { isValidItemId } from '../../utils/cartDebug';

export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      console.log('fetchCart - Fetching cart data...');
      const response = await cartAPI.getCart();
      console.log('fetchCart - Response:', response.data);
      
      // Handle the new response structure with cart, totalPrice, and itemCount
      if (response.data && response.data.cart) {
        console.log('fetchCart - Using cart from response:', response.data.cart);
        
        // Check if cart is an array
        if (!Array.isArray(response.data.cart)) {
          console.log('fetchCart - Cart is not an array:', response.data.cart);
          
          // If cart is a single item, wrap it in an array
          if (response.data.cart && typeof response.data.cart === 'object') {
            console.log('fetchCart - Converting single item to array');
            return {
              items: [response.data.cart],
              total: response.data.totalPrice || 0
            };
          }
          
          return rejectWithValue({ message: 'Invalid cart data structure' });
        }
        
        return {
          items: response.data.cart,
          total: response.data.totalPrice || 0
        };
      } 
      // Fallback to the old structure if the response is an array
      else if (response.data && Array.isArray(response.data)) {
        console.log('fetchCart - Using array response as items');
        
        // Calculate total from items
        const total = response.data.reduce((sum, item) => {
          return sum + (item.product?.price || 0) * (item.quantity || 1);
        }, 0);
        
        return {
          items: response.data,
          total
        };
      } else if (response.data && typeof response.data === 'object') {
        // Handle case where response.data is a single cart item
        console.log('fetchCart - Response is a single cart item, converting to array');
        
        // Calculate total from the single item
        const total = (response.data.product?.price || 0) * (response.data.quantity || 1);
        
        return {
          items: [response.data],
          total
        };
      } else {
        console.error('fetchCart - Unexpected response structure:', response.data);
        return rejectWithValue({ message: 'Invalid cart data structure' });
      }
    } catch (error) {
      console.error('fetchCart - Error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch cart' });
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, quantity }, { rejectWithValue, getState }) => {
    try {
      // Check if token exists
      const token = localStorage.getItem('token');
      console.log('addToCart - Token check:', token ? 'Present' : 'Missing');
      
      if (!token) {
        console.error('addToCart - No token found in localStorage');
        return rejectWithValue({ 
          message: 'Authentication required. Please log in.',
          status: 401
        });
      }
      
      // Get current cart state
      const currentState = getState();
      const currentCartItems = currentState.cart.items || [];
      
      console.log('addToCart - Attempting to add product:', { product: productId, quantity });
      const response = await cartAPI.addToCart(productId, quantity);
      console.log('addToCart - Success response:', response.data);
      
      // Handle the new response structure
      if (response.data && response.data.cart) {
        console.log('addToCart - Using cart from response:', response.data.cart);
        
        // Check if cart is an array
        if (!Array.isArray(response.data.cart)) {
          console.log('addToCart - Cart is not an array:', response.data.cart);
          
          // If cart is a single item, we need to update the existing cart items
          if (response.data.cart && typeof response.data.cart === 'object') {
            console.log('addToCart - Response is a single cart item, updating existing cart');
            
            // Check if the product already exists in the cart
            const existingItemIndex = currentCartItems.findIndex(item => 
              String(item.product?._id) === String(productId)
            );
            
            // Create a new array with the updated or added item
            let updatedItems;
            if (existingItemIndex >= 0) {
              // Update the existing item
              updatedItems = [...currentCartItems];
              updatedItems[existingItemIndex] = response.data.cart;
            } else {
              // Add the new item to the cart
              updatedItems = [...currentCartItems, response.data.cart];
            }
            
            // Calculate total from all items
            const total = updatedItems.reduce((sum, item) => {
              return sum + (item.product?.price || 0) * (item.quantity || 1);
            }, 0);
            
            return {
              items: updatedItems,
              total: response.data.totalPrice || total
            };
          }
          
          return rejectWithValue({ message: 'Invalid cart data structure' });
        }
        
        return {
          items: response.data.cart,
          total: response.data.totalPrice || 0
        };
      } else if (response.data && Array.isArray(response.data)) {
        // Fallback to the old structure if the response is an array
        console.log('addToCart - Using array response as items');
        
        // Calculate total from items
        const total = response.data.reduce((sum, item) => {
          return sum + (item.product?.price || 0) * (item.quantity || 1);
        }, 0);
        
        return {
          items: response.data,
          total
        };
      } else if (response.data && typeof response.data === 'object') {
        // Handle case where response.data is a single cart item
        console.log('addToCart - Response is a single cart item, updating existing cart');
        
        // Check if the product already exists in the cart
        const existingItemIndex = currentCartItems.findIndex(item => 
          String(item.product?._id) === String(productId)
        );
        
        // Create a new array with the updated or added item
        let updatedItems;
        if (existingItemIndex >= 0) {
          // Update the existing item
          updatedItems = [...currentCartItems];
          updatedItems[existingItemIndex] = response.data;
        } else {
          // Add the new item to the cart
          updatedItems = [...currentCartItems, response.data];
        }
        
        // Calculate total from all items
        const total = updatedItems.reduce((sum, item) => {
          return sum + (item.product?.price || 0) * (item.quantity || 1);
        }, 0);
        
        return {
          items: updatedItems,
          total
        };
      } else {
        console.error('addToCart - Unexpected response structure:', response.data);
        return rejectWithValue({ message: 'Invalid cart data structure' });
      }
    } catch (error) {
      console.error('addToCart - Error details:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        data: error.response?.data
      });
      
      // Handle authentication errors
      if (error.response?.status === 401) {
        console.error('addToCart - Authentication error detected');
        return rejectWithValue({ 
          message: 'Authentication required. Please log in again.',
          status: 401
        });
      }
      
      return rejectWithValue(error.response?.data || { 
        message: 'Failed to add item to cart',
        status: error.response?.status
      });
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ itemId, quantity }, { rejectWithValue, getState }) => {
    try {
      // Validate itemId
      if (!isValidItemId(itemId)) {
        console.error('updateCartItem - Invalid itemId:', itemId);
        return rejectWithValue({ message: 'Invalid item ID' });
      }
      
      // Validate quantity
      if (!quantity || quantity < 1) {
        console.error('updateCartItem - Invalid quantity:', quantity);
        return rejectWithValue({ message: 'Invalid quantity' });
      }
      
      // Convert itemId to string if it's not already
      const itemIdString = String(itemId);
      
      console.log('updateCartItem - Updating item:', { itemId: itemIdString, quantity });
      const response = await cartAPI.updateCartItem(itemIdString, quantity);
      console.log('updateCartItem - Success response:', response.data);
      
      // Get current cart state
      const currentState = getState();
      const currentCartItems = currentState.cart.items || [];
      
      // Handle the new response structure
      if (response.data && response.data.cart) {
        console.log('updateCartItem - Using cart from response:', response.data.cart);
        
        // Check if cart is an array
        if (!Array.isArray(response.data.cart)) {
          console.log('updateCartItem - Cart is not an array:', response.data.cart);
          
          // If cart is a single item, we need to update the existing cart items
          if (response.data.cart && typeof response.data.cart === 'object') {
            console.log('updateCartItem - Converting single item to array');
            
            // Find the index of the updated item in the current cart
            const updatedItemIndex = currentCartItems.findIndex(item => 
              String(item._id) === itemIdString || 
              String(item.id) === itemIdString || 
              String(item.product?._id) === itemIdString
            );
            
            // Create a new array with the updated item
            let updatedItems;
            if (updatedItemIndex >= 0) {
              // Replace the item at the found index
              updatedItems = [...currentCartItems];
              updatedItems[updatedItemIndex] = response.data.cart;
            } else {
              // If item not found, add it to the array
              updatedItems = [...currentCartItems, response.data.cart];
            }
            
            // Calculate total from all items
            const total = updatedItems.reduce((sum, item) => {
              return sum + (item.product?.price || 0) * (item.quantity || 1);
            }, 0);
            
            return {
              items: updatedItems,
              total: response.data.totalPrice || total
            };
          }
          
          return rejectWithValue({ message: 'Invalid cart data structure' });
        }
        
        return {
          items: response.data.cart,
          total: response.data.totalPrice || 0
        };
      } else if (response.data && Array.isArray(response.data)) {
        // Fallback to the old structure if the response is an array
        console.log('updateCartItem - Using array response as items');
        
        // Calculate total from items
        const total = response.data.reduce((sum, item) => {
          return sum + (item.product?.price || 0) * (item.quantity || 1);
        }, 0);
        
        return {
          items: response.data,
          total
        };
      } else if (response.data && typeof response.data === 'object') {
        // Handle case where response.data is a single cart item
        console.log('updateCartItem - Response is a single cart item, updating existing cart');
        
        // Find the index of the updated item in the current cart
        const updatedItemIndex = currentCartItems.findIndex(item => 
          String(item._id) === itemIdString || 
          String(item.id) === itemIdString || 
          String(item.product?._id) === itemIdString
        );
        
        // Create a new array with the updated item
        let updatedItems;
        if (updatedItemIndex >= 0) {
          // Replace the item at the found index
          updatedItems = [...currentCartItems];
          updatedItems[updatedItemIndex] = response.data;
        } else {
          // If item not found, add it to the array
          updatedItems = [...currentCartItems, response.data];
        }
        
        // Calculate total from all items
        const total = updatedItems.reduce((sum, item) => {
          return sum + (item.product?.price || 0) * (item.quantity || 1);
        }, 0);
        
        return {
          items: updatedItems,
          total
        };
      } else {
        console.error('updateCartItem - Unexpected response structure:', response.data);
        return rejectWithValue({ message: 'Invalid cart data structure' });
      }
    } catch (error) {
      console.error('updateCartItem - Error:', error.response?.data || error.message);
      
      // Handle HTML error responses
      if (error.response?.data && typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE html>')) {
        console.error('updateCartItem - Received HTML error response');
        return rejectWithValue({ message: 'Server error. Please try again later.' });
      }
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        return rejectWithValue({ message: 'Item not found in cart' });
      } else if (error.response?.status === 401) {
        return rejectWithValue({ message: 'Authentication required. Please log in again.' });
      } else if (error.response?.status === 500) {
        return rejectWithValue({ message: 'Server error. Please try again later.' });
      }
      
      return rejectWithValue(error.response?.data || { message: 'Failed to update cart item' });
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (itemId, { rejectWithValue, getState }) => {
    try {
      // Validate itemId
      if (!isValidItemId(itemId)) {
        console.error('removeFromCart - Invalid itemId:', itemId);
        return rejectWithValue({ message: 'Invalid item ID' });
      }
      
      // Log the itemId for debugging
      console.log('removeFromCart - Item ID type:', typeof itemId);
      console.log('removeFromCart - Item ID value:', itemId);
      
      // Convert itemId to string if it's not already
      const itemIdString = String(itemId);
      
      // Get current cart state
      const currentState = getState();
      const currentCartItems = currentState.cart.items || [];
      
      console.log('removeFromCart - Removing item with ID:', itemIdString);
      const response = await cartAPI.removeFromCart(itemIdString);
      console.log('removeFromCart - Success response:', response.data);
      
      // Handle the new response structure
      if (response.data && response.data.cart) {
        console.log('removeFromCart - Using cart from response:', response.data.cart);
        
        // Check if cart is an array
        if (!Array.isArray(response.data.cart)) {
          console.log('removeFromCart - Cart is not an array:', response.data.cart);
          
          // If cart is a single item, we need to filter the current cart
          if (response.data.cart && typeof response.data.cart === 'object') {
            console.log('removeFromCart - Response is a single cart item, filtering current cart');
            
            // Filter out the removed item from the current cart
            const updatedItems = currentCartItems.filter(item => 
              String(item._id) !== itemIdString && 
              String(item.id) !== itemIdString && 
              String(item.product?._id) !== itemIdString
            );
            
            // Calculate total from remaining items
            const total = updatedItems.reduce((sum, item) => {
              return sum + (item.product?.price || 0) * (item.quantity || 1);
            }, 0);
            
            return {
              items: updatedItems,
              total: response.data.totalPrice || total
            };
          }
          
          return rejectWithValue({ message: 'Invalid cart data structure' });
        }
        
        return {
          items: response.data.cart,
          total: response.data.totalPrice || 0
        };
      } else if (response.data && Array.isArray(response.data)) {
        // Fallback to the old structure if the response is an array
        console.log('removeFromCart - Using array response as items');
        
        // Calculate total from items
        const total = response.data.reduce((sum, item) => {
          return sum + (item.product?.price || 0) * (item.quantity || 1);
        }, 0);
        
        return {
          items: response.data,
          total
        };
      } else if (response.data && typeof response.data === 'object') {
        // Handle case where response.data is a single cart item
        console.log('removeFromCart - Response is a single cart item, filtering current cart');
        
        // Filter out the removed item from the current cart
        const updatedItems = currentCartItems.filter(item => 
          String(item._id) !== itemIdString && 
          String(item.id) !== itemIdString && 
          String(item.product?._id) !== itemIdString
        );
        
        // Calculate total from remaining items
        const total = updatedItems.reduce((sum, item) => {
          return sum + (item.product?.price || 0) * (item.quantity || 1);
        }, 0);
        
        return {
          items: updatedItems,
          total
        };
      } else {
        console.error('removeFromCart - Unexpected response structure:', response.data);
        return rejectWithValue({ message: 'Invalid cart data structure' });
      }
    } catch (error) {
      console.error('removeFromCart - Error:', error.response?.data || error.message);
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        return rejectWithValue({ message: 'Item not found in cart' });
      } else if (error.response?.status === 401) {
        return rejectWithValue({ message: 'Authentication required. Please log in again.' });
      } else if (error.response?.status === 500) {
        return rejectWithValue({ message: 'Server error. Please try again later.' });
      }
      
      // If the error message contains "some is not a function", it's likely a data structure issue
      if (error.message && error.message.includes('some is not a function')) {
        console.error('removeFromCart - Data structure error detected');
        return rejectWithValue({ message: 'Server returned invalid data structure. Please try again.' });
      }
      
      return rejectWithValue(error.response?.data || { message: 'Failed to remove item from cart' });
    }
  }
);

export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      console.log('clearCart - Clearing cart...');
      const response = await cartAPI.clearCart();
      console.log('clearCart - Success response:', response.data);
      return { items: [], total: 0 };
    } catch (error) {
      console.error('clearCart - Error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || { message: 'Failed to clear cart' });
    }
  }
);

const initialState = {
  items: [],
  loading: false,
  error: null,
  total: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Cart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch cart';
      })
      // Add to Cart
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to add item to cart';
      })
      // Update Cart Item
      .addCase(updateCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to update cart item';
      })
      // Remove from Cart
      .addCase(removeFromCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to remove item from cart';
      })
      // Clear Cart
      .addCase(clearCart.fulfilled, (state) => {
        state.items = [];
        state.total = 0;
      });
  },
});

export default cartSlice.reducer; 