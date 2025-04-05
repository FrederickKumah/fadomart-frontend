import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { fetchUserProfile, refreshUserProfile } from './features/auth/authSlice';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import OrderConfirmation from './pages/OrderConfirmation';
import PaymentVerification from './pages/PaymentVerification';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/Dashboard';
import ProductManagement from './pages/admin/ProductManagement';
import InventoryManagement from './pages/admin/InventoryManagement';
import Reports from './pages/admin/Reports';
import { Toaster } from 'react-hot-toast';

function App() {
  const dispatch = useDispatch();
  const { token, isAuthenticated, user, loading } = useSelector((state) => state.auth);
  const profileFetchAttempted = useRef(false);

  // Debug authentication state
  useEffect(() => {
    console.log('App - Auth state:', {
      isAuthenticated,
      hasUser: !!user,
      userId: user?._id,
      hasToken: !!token,
      userEmail: user?.email,
      loading
    });
  }, [isAuthenticated, user, token, loading]);

  useEffect(() => {
    // If we have a token but no user data, fetch the user profile
    // Only attempt to fetch once to avoid infinite loops
    if (token && (!user || !user._id) && !profileFetchAttempted.current) {
      console.log('App - Token exists but user data is missing, fetching profile...');
      profileFetchAttempted.current = true;
      dispatch(fetchUserProfile());
    }
  }, [dispatch, token, user]);

  // Add a periodic refresh of the user profile
  useEffect(() => {
    if (isAuthenticated && user && user._id) {
      console.log('App - Setting up periodic profile refresh');
      const refreshInterval = setInterval(() => {
        console.log('App - Refreshing user profile...');
        dispatch(refreshUserProfile());
      }, 5 * 60 * 1000); // Refresh every 5 minutes
      
      return () => clearInterval(refreshInterval);
    }
  }, [dispatch, isAuthenticated, user]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:orderId" element={<OrderDetails />} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
            <Route path="/payment/verify" element={<PaymentVerification />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<ProductManagement />} />
            <Route path="/admin/inventory" element={<InventoryManagement />} />
            <Route path="/admin/reports" element={<Reports />} />
          </Routes>
        </main>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;
