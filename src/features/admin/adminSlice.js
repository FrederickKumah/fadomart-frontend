import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productsAPI } from '../../services/api';

// Async thunks for admin operations
export const fetchAdminProducts = createAsyncThunk(
  'admin/fetchAdminProducts',
  async (params, { rejectWithValue }) => {
    try {
      const response = await productsAPI.getAllProducts(params);
      return {
        products: response.data.products || response.data || [],
        total: response.data.total || response.data.length
      };
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || error.message || 'Failed to fetch products',
        status: error.response?.status
      });
    }
  }
);

export const createProduct = createAsyncThunk(
  'admin/createProduct',
  async (productData, { rejectWithValue }) => {
    try {
      const response = await productsAPI.addProduct(productData);
      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || error.message || 'Failed to create product',
        status: error.response?.status
      });
    }
  }
);

export const updateProduct = createAsyncThunk(
  'admin/updateProduct',
  async ({ id, productData }, { rejectWithValue }) => {
    try {
      const response = await productsAPI.updateProduct(id, productData);
      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || error.message || 'Failed to update product',
        status: error.response?.status
      });
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'admin/deleteProduct',
  async (id, { rejectWithValue }) => {
    try {
      await productsAPI.deleteProduct(id);
      return id;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || error.message || 'Failed to delete product',
        status: error.response?.status
      });
    }
  }
);

export const updateInventory = createAsyncThunk(
  'admin/updateInventory',
  async ({ id, quantity }, { rejectWithValue }) => {
    try {
      const response = await productsAPI.updateProduct(id, { quantity });
      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || error.message || 'Failed to update inventory',
        status: error.response?.status
      });
    }
  }
);

// Admin slice
const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    products: [],
    selectedProduct: null,
    loading: false,
    error: null,
    success: null,
    totalProducts: 0,
    currentPage: 1,
    inventoryUpdates: {},
    reports: {
      sales: [],
      inventory: [],
      loading: false,
      error: null
    },
    dashboardStats: {
      totalProducts: 0,
      totalOrders: 0,
      totalUsers: 0,
      totalRevenue: 0,
      loading: false,
      error: null
    }
  },
  reducers: {
    clearAdminError: (state) => {
      state.error = null;
    },
    clearAdminSuccess: (state) => {
      state.success = null;
    },
    setSelectedProduct: (state, action) => {
      state.selectedProduct = action.payload;
    },
    setInventoryUpdate: (state, action) => {
      const { id, quantity } = action.payload;
      state.inventoryUpdates[id] = quantity;
    },
    clearInventoryUpdates: (state) => {
      state.inventoryUpdates = {};
    },
    calculateDashboardStats: (state) => {
      // Calculate stats from available data
      state.dashboardStats.totalProducts = state.products.length;
      
      // For now, we don't have orders or users data in the admin slice
      // These would need to be fetched separately or added to the admin slice
      state.dashboardStats.totalOrders = 0;
      state.dashboardStats.totalUsers = 0;
      
      // Calculate total revenue from products (price * stock)
      state.dashboardStats.totalRevenue = state.products.reduce((total, product) => {
        return total + (product.price * product.stock);
      }, 0);
    }
  },
  extraReducers: (builder) => {
    // Fetch admin products
    builder
      .addCase(fetchAdminProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.totalProducts = action.payload.total;
        
        // Recalculate dashboard stats when products are fetched
        state.dashboardStats.totalProducts = action.payload.products.length;
        state.dashboardStats.totalRevenue = action.payload.products.reduce((total, product) => {
          return total + (product.price * product.stock);
        }, 0);
      })
      .addCase(fetchAdminProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch products';
      })
      
      // Create product
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products.push(action.payload);
        state.success = 'Product created successfully';
        
        // Update dashboard stats
        state.dashboardStats.totalProducts = state.products.length;
        state.dashboardStats.totalRevenue = state.products.reduce((total, product) => {
          return total + (product.price * product.stock);
        }, 0);
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to create product';
      })
      
      // Update product
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.products.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
        state.success = 'Product updated successfully';
        
        // Update dashboard stats
        state.dashboardStats.totalRevenue = state.products.reduce((total, product) => {
          return total + (product.price * product.stock);
        }, 0);
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to update product';
      })
      
      // Delete product
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products = state.products.filter(p => p._id !== action.payload);
        state.success = 'Product deleted successfully';
        
        // Update dashboard stats
        state.dashboardStats.totalProducts = state.products.length;
        state.dashboardStats.totalRevenue = state.products.reduce((total, product) => {
          return total + (product.price * product.stock);
        }, 0);
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to delete product';
      })
      
      // Update inventory
      .addCase(updateInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateInventory.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.products.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
        state.success = 'Inventory updated successfully';
        
        // Update dashboard stats
        state.dashboardStats.totalRevenue = state.products.reduce((total, product) => {
          return total + (product.price * product.stock);
        }, 0);
      })
      .addCase(updateInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to update inventory';
      });
  }
});

export const { 
  clearAdminError, 
  clearAdminSuccess, 
  setSelectedProduct,
  setInventoryUpdate,
  clearInventoryUpdates,
  calculateDashboardStats
} = adminSlice.actions;

export default adminSlice.reducer; 