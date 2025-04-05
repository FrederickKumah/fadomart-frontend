import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';

// Async thunks
export const fetchUserProfile = createAsyncThunk(
  'auth/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Fetching user profile...');
      const response = await authAPI.getProfile();
      console.log('User profile fetched successfully:', response.data);
      
      // Check if the response has the expected structure
      if (!response.data || typeof response.data !== 'object') {
        console.error('Invalid user profile data:', response.data);
        return rejectWithValue({
          message: 'Invalid user profile data received from server',
          status: 500
        });
      }
      
      // Log the user ID for debugging
      console.log('User ID from profile:', response.data._id || response.data.id);
      
      return response.data;
    } catch (error) {
      console.error('Profile fetch error:', error);
      return rejectWithValue({
        message: error.response?.data?.message || error.message || 'Failed to fetch profile',
        status: error.response?.status
      });
    }
  }
);

// New action to refresh user profile
export const refreshUserProfile = createAsyncThunk(
  'auth/refreshUserProfile',
  async (_, { rejectWithValue, getState }) => {
    try {
      // Check if we have a token
      const { auth } = getState();
      if (!auth.token) {
        console.error('No token available for profile refresh');
        return rejectWithValue({ message: 'No authentication token available' });
      }
      
      console.log('Refreshing user profile...');
      const response = await authAPI.getProfile();
      console.log('User profile refreshed successfully:', response.data);
      
      // Check if the response has the expected structure
      if (!response.data || typeof response.data !== 'object') {
        console.error('Invalid user profile data:', response.data);
        return rejectWithValue({
          message: 'Invalid user profile data received from server',
          status: 500
        });
      }
      
      // Log the user ID for debugging
      console.log('User ID from profile refresh:', response.data._id || response.data.id);
      
      return response.data;
    } catch (error) {
      console.error('Profile refresh error:', error);
      return rejectWithValue({
        message: error.response?.data?.message || error.message || 'Failed to refresh profile',
        status: error.response?.status
      });
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { dispatch, rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      console.log('Full login response:', response);
      console.log('Login response data:', response.data);
      
      // Check if response has the expected structure
      if (!response.data || typeof response.data !== 'object') {
        console.error('Invalid response structure:', response.data);
        return rejectWithValue({
          message: 'Invalid response from server',
          status: 500
        });
      }
      
      // Get token from the appropriate location in the response
      const token = response.data.token || response.data.accessToken || response.headers?.authorization;
      
      if (!token) {
        console.error('No token found in response. Response structure:', {
          data: response.data,
          headers: response.headers
        });
        return rejectWithValue({
          message: 'Authentication failed: No token received',
          status: 401
        });
      }
      
      // Store token in localStorage
      const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
      localStorage.setItem('token', cleanToken);
      console.log('Token stored in localStorage:', cleanToken.substring(0, 10) + '...');
      
      // Fetch user profile after successful login
      dispatch(fetchUserProfile());
      
      return {
        token: cleanToken,
        user: response.data.user || response.data
      };
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response);
      return rejectWithValue({
        message: error.response?.data?.message || error.message || 'Login failed',
        status: error.response?.status,
        data: error.response?.data
      });
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { dispatch, rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData);
      console.log('Full register response:', response);
      console.log('Register response data:', response.data);
      
      // Check if response has the expected structure
      if (!response.data || typeof response.data !== 'object') {
        console.error('Invalid response structure:', response.data);
        return rejectWithValue({
          message: 'Invalid response from server',
          status: 500
        });
      }
      
      // Get token from the appropriate location in the response
      const token = response.data.token || response.data.accessToken || response.headers?.authorization;
      
      if (!token) {
        console.error('No token found in response. Response structure:', {
          data: response.data,
          headers: response.headers
        });
        return rejectWithValue({
          message: 'Registration failed: No token received',
          status: 401
        });
      }
      
      // Store token in localStorage
      const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
      localStorage.setItem('token', cleanToken);
      console.log('Token stored in localStorage:', cleanToken.substring(0, 10) + '...');
      
      // Fetch user profile after successful registration
      dispatch(fetchUserProfile());
      
      return {
        token: cleanToken,
        user: response.data.user || response.data
      };
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error response:', error.response);
      return rejectWithValue({
        message: error.response?.data?.message || error.message || 'Registration failed',
        status: error.response?.status,
        data: error.response?.data
      });
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authAPI.logout();
      localStorage.removeItem('token');
      return null;
    } catch (error) {
      console.error('Logout error:', error);
      // Even if the server request fails, we want to clear the local state
      localStorage.removeItem('token');
      return null;
    }
  }
);

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    // Add a new action to manually set the user
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch User Profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        
        // Check if the user data has an _id property, if not, try to use 'id'
        const userData = action.payload;
        if (userData && !userData._id && userData.id) {
          console.log('Converting user.id to user._id');
          userData._id = userData.id;
        }
        
        state.user = userData;
        state.isAuthenticated = true;
        
        // Log the user state after update
        console.log('Updated user state:', {
          hasUser: !!state.user,
          userId: state.user?._id,
          userEmail: state.user?.email
        });
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch profile';
        if (action.payload?.status === 401) {
          state.isAuthenticated = false;
          state.user = null;
          state.token = null;
          localStorage.removeItem('token');
        }
      })
      
      // Refresh User Profile
      .addCase(refreshUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(refreshUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        
        // Check if the user data has an _id property, if not, try to use 'id'
        const userData = action.payload;
        if (userData && !userData._id && userData.id) {
          console.log('Converting user.id to user._id in refresh');
          userData._id = userData.id;
        }
        
        state.user = userData;
        state.isAuthenticated = true;
        
        // Log the user state after update
        console.log('Updated user state after refresh:', {
          hasUser: !!state.user,
          userId: state.user?._id,
          userEmail: state.user?.email
        });
      })
      .addCase(refreshUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to refresh profile';
        if (action.payload?.status === 401) {
          state.isAuthenticated = false;
          state.user = null;
          state.token = null;
          localStorage.removeItem('token');
        }
      })
      
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Login failed';
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Registration failed';
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer; 