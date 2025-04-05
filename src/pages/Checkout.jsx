import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createOrder, initializePayment, clearOrderError, clearOrderSuccess, clearPaymentData } from '../features/orders/ordersSlice';
import { clearCart } from '../features/cart/cartSlice';
import { refreshUserProfile } from '../features/auth/authSlice';
import toast from 'react-hot-toast';

export default function Checkout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, total } = useSelector((state) => state.cart);
  const { user, isAuthenticated, token, loading } = useSelector((state) => state.auth);
  const { 
    loading: orderLoading, 
    error, 
    success, 
    currentOrder,
    paymentLoading,
    paymentError,
    paymentSuccess,
    paymentData
  } = useSelector((state) => state.orders);

  const [formData, setFormData] = useState({
    street: '',
    city: '',
    state: '',
    phone: '',
    email: user?.email || '',
    notes: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Debug authentication state
  useEffect(() => {
    console.log('Checkout - Auth state:', {
      isAuthenticated,
      hasUser: !!user,
      userId: user?._id,
      hasToken: !!token,
      userEmail: user?.email,
      loading
    });
  }, [isAuthenticated, user, token, loading]);

  // Debug cart items
  useEffect(() => {
    console.log('Checkout - Cart items:', items);
    if (items && items.length > 0) {
      console.log('Checkout - First cart item structure:', {
        item: items[0],
        hasProduct: !!items[0].product,
        productId: items[0].product?._id,
        productStructure: items[0].product
      });
    }
  }, [items]);

  // Update email in form data when user changes
  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({
        ...prev,
        email: user.email
      }));
    }
  }, [user]);

  useEffect(() => {
    // Only redirect if not authenticated and no token
    if (!isAuthenticated && !token) {
      console.log('Checkout - Not authenticated, redirecting to login');
      toast.error('Please login to place an order');
      navigate('/login');
      return;
    }
  }, [isAuthenticated, token, navigate]);

  useEffect(() => {
    // Show success message and redirect to order confirmation page
    if (success && currentOrder) {
      toast.success('Order placed successfully!');
      // Initialize payment for the order
      dispatch(initializePayment(currentOrder._id));
    }
  }, [success, currentOrder, dispatch]);

  useEffect(() => {
    // Handle payment initialization success
    if (paymentSuccess && paymentData) {
      // Clear the cart after successful order
      dispatch(clearCart());
      
      // Redirect to payment gateway if available
      if (paymentData.authorizationUrl) {
        window.location.href = paymentData.authorizationUrl;
      } else {
        // If no payment URL is provided, redirect to order confirmation
        navigate('/order-confirmation');
      }
    }
  }, [paymentSuccess, paymentData, dispatch, navigate]);

  useEffect(() => {
    // Show error message if there's an error
    if (error) {
      toast.error(error);
      dispatch(clearOrderError());
    }
    
    if (paymentError) {
      toast.error(paymentError);
      dispatch(clearPaymentData());
    }
  }, [error, paymentError, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.street.trim()) {
      errors.street = 'Street address is required';
    }
    
    if (!formData.city.trim()) {
      errors.city = 'City is required';
    }
    
    if (!formData.state.trim()) {
      errors.state = 'State is required';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[0-9+\-\s()]{10,}$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if user is authenticated and has required data
    if (!isAuthenticated || !token) {
      console.log('Checkout - Not authenticated when submitting order, redirecting to login');
      toast.error('Please login to place an order');
      navigate('/login');
      return;
    }
    
    // Check if user object exists but doesn't have an ID
    if (!user || !user._id) {
      console.log('Checkout - User object missing or missing ID:', user);
      
      // Try to refresh the user profile before giving up
      if (!isRefreshing) {
        setIsRefreshing(true);
        console.log('Checkout - Attempting to refresh user profile...');
        
        try {
          const result = await dispatch(refreshUserProfile()).unwrap();
          console.log('Checkout - User profile refreshed successfully:', result);
          
          // Check if the refreshed user data has an ID
          if (result && result._id) {
            console.log('Checkout - User data is now available, proceeding with order');
            setIsRefreshing(false);
            // Continue with the order submission
          } else {
            console.log('Checkout - User data still missing after refresh');
            toast.error('User data is incomplete. Please try logging in again.');
            navigate('/login');
            return;
          }
        } catch (error) {
          console.error('Checkout - Failed to refresh user profile:', error);
          toast.error('User data is incomplete. Please try logging in again.');
          navigate('/login');
          return;
        } finally {
          setIsRefreshing(false);
        }
      } else {
        toast.error('User data is incomplete. Please try logging in again.');
        navigate('/login');
        return;
      }
    }
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    try {
      // Debug cart items before creating order data
      console.log('Checkout - Cart items before creating order:', items);
      
      // Format the order data according to the validation schema
      const orderData = {
        user: user._id,
        products: items.map(item => {
          console.log('Checkout - Processing cart item:', item);
          
          // Extract product ID from different possible structures
          let productId;
          
          // Check different possible locations for the product ID
          if (item.product && item.product._id) {
            productId = item.product._id;
          } else if (item.product && item.product.id) {
            productId = item.product.id;
          } else if (item.productId) {
            productId = item.productId;
          } else if (item.product) {
            // If product is just an ID string
            productId = item.product;
          }
          
          console.log('Checkout - Extracted product ID:', productId);
          
          // Check if product ID exists
          if (!productId) {
            console.error('Checkout - Missing product ID in cart item:', item);
            throw new Error('Product ID is missing in cart item');
          }
          
          // Get the price from the item
          const price = parseFloat(item.price || item.product?.price || 0);
          
          return {
            product: productId,
            quantity: item.quantity,
            // Remove the price field as it's causing validation errors
            // The server will calculate the price based on the product ID
          };
        }),
        totalPrice: total, // Changed from amount to totalPrice
        shippingAddress: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          phone: formData.phone,
          email: formData.email
        },
        notes: formData.notes || undefined
      };

      // Log the order data in detail
      console.log('Checkout - Order data structure:', {
        user: orderData.user,
        productsCount: orderData.products.length,
        products: orderData.products,
        totalPrice: orderData.totalPrice,
        shippingAddress: orderData.shippingAddress,
        hasNotes: !!orderData.notes
      });
      
      console.log('Checkout - Submitting order with data:', orderData);
      const result = await dispatch(createOrder(orderData)).unwrap();
      console.log('Checkout - Order created successfully:', result);
      
      // Clear the cart after successful order creation
      dispatch(clearCart());
      
      // Navigate to order confirmation page
      navigate('/order-confirmation');
    } catch (err) {
      console.error('Error creating order:', err);
      
      // Handle validation errors
      if (err.errors && Array.isArray(err.errors)) {
        // Display each validation error
        err.errors.forEach(error => {
          const field = error.field || error.path || 'form';
          const message = error.message || error.msg || 'Invalid value';
          
          // Set the error in the form errors state
          setFormErrors(prev => ({
            ...prev,
            [field]: message
          }));
          
          // Show a toast for each error
          toast.error(`${field}: ${message}`);
        });
      } else {
        // Show a generic error message
        toast.error(err.message || 'Failed to create order');
      }
    }
  };

  if (loading || paymentLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-8">Checkout</h1>
      
      <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-2">
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
          <div className="mt-4 border-t border-gray-200">
            <ul role="list" className="divide-y divide-gray-200">
              {items.map((item) => (
                <li key={item._id} className="flex py-6">
                  <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                    <img
                      src={item.product?.image}
                      alt={item.product?.productName}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                  <div className="ml-4 flex flex-1 flex-col">
                    <div>
                      <div className="flex justify-between text-base font-medium text-gray-900">
                        <h3>{item.product?.productName}</h3>
                        <p className="ml-4">GHS {item.product?.price * item.quantity}</p>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">Quantity: {item.quantity}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="flex justify-between text-base font-medium text-gray-900">
              <p>Subtotal</p>
              <p>GHS {total}</p>
            </div>
            <p className="mt-0.5 text-sm text-gray-500">Shipping and taxes calculated at checkout.</p>
          </div>
        </div>
        
        {/* Checkout Form */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Information</h2>
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="grid grid-cols-1 gap-y-6">
              <div>
                <label htmlFor="street" className="block text-sm font-medium text-gray-700">
                  Street Address
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="street"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${formErrors.street ? 'border-red-500' : ''}`}
                  />
                  {formErrors.street && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.street}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${formErrors.city ? 'border-red-500' : ''}`}
                    />
                    {formErrors.city && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.city}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                    State / Province
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${formErrors.state ? 'border-red-500' : ''}`}
                    />
                    {formErrors.state && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.state}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${formErrors.phone ? 'border-red-500' : ''}`}
                  />
                  {formErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${formErrors.email ? 'border-red-500' : ''}`}
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Order Notes (Optional)
                </label>
                <div className="mt-1">
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    value={formData.notes}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-10">
              <button
                type="submit"
                disabled={loading || paymentLoading}
                className="w-full rounded-md border border-transparent bg-blue-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading || paymentLoading ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 