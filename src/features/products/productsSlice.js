import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productsAPI } from '../../services/api';

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params, { rejectWithValue }) => {
    try {
      const response = await productsAPI.getAllProducts(params);
      console.log('Products API Response:', response.data); // Debug log
      
      // Log the structure of the first product to understand its format
      if (response.data && response.data.length > 0) {
        console.log('First product structure:', JSON.stringify(response.data[0], null, 2));
        
        // Log validation checks for the first product
        const product = response.data[0];
        console.log('Product validation checks:', {
          hasId: Boolean(product._id || product.id),
          hasName: Boolean(product.name),
          nameType: typeof product.name,
          hasPrice: Boolean(product.price),
          priceType: typeof product.price,
          hasImage: Boolean(product.image),
          imageType: typeof product.image,
          hasCategory: Boolean(product.category),
          categoryType: typeof product.category
        });
      }
      
      // Handle both array and object response formats
      const products = Array.isArray(response.data) ? response.data : response.data.products;
      const total = response.data.total || products.length;
      
      return {
        products: products || [],
        total: total
      };
    } catch (error) {
      console.error('Fetch products error:', error);
      return rejectWithValue({
        message: error.response?.data?.message || error.message || 'Failed to fetch products',
        status: error.response?.status,
        data: error.response?.data
      });
    }
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (id, { rejectWithValue }) => {
    try {
      console.log('Fetching product by ID:', id);
      
      // Validate ID
      if (!id) {
        console.error('Invalid product ID: ID is undefined or empty');
        return rejectWithValue({ message: 'Invalid product ID' });
      }
      
      const response = await productsAPI.getProductById(id);
      console.log('Product API Response:', response.data);
      
      // Validate response data
      if (!response.data) {
        console.error('No product data returned from API');
        return rejectWithValue({ message: 'Product not found' });
      }
      
      return response.data;
    } catch (error) {
      console.error('Fetch product by ID error:', error);
      return rejectWithValue({
        message: error.response?.data?.message || error.message || 'Failed to fetch product',
        status: error.response?.status,
        data: error.response?.data
      });
    }
  }
);

export const searchProducts = createAsyncThunk(
  'products/searchProducts',
  async (query, { rejectWithValue }) => {
    try {
      const response = await productsAPI.searchProducts(query);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  products: [],
  selectedProduct: null,
  loading: false,
  error: null,
  totalProducts: 0,
  currentPage: 1,
  filters: {
    category: '',
    sortBy: 'newest',
    priceRange: [0, 1000],
  },
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.totalProducts = action.payload.total;
        state.error = null;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch products';
        state.products = [];
        state.totalProducts = 0;
        console.error('Products fetch error:', action.payload); // Debug log
      })
      // Fetch Product by ID
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch product';
      })
      // Search Products
      .addCase(searchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.totalProducts = action.payload.total;
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Search failed';
      });
  },
});

export const { setFilters, clearFilters, setCurrentPage, clearError } = productsSlice.actions;
export default productsSlice.reducer; 