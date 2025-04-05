import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { verifyPayment, clearVerificationData } from '../features/orders/ordersSlice';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../utils/dateUtils';

export default function PaymentVerification() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [reference, setReference] = useState('');
  
  const { 
    verificationLoading, 
    verificationError, 
    verificationSuccess,
    currentOrder
  } = useSelector((state) => state.orders);
  
  useEffect(() => {
    // Get reference from URL query parameters
    const params = new URLSearchParams(location.search);
    const ref = params.get('reference');
    
    if (ref) {
      setReference(ref);
      dispatch(verifyPayment(ref));
    } else {
      // If no reference is found, redirect to orders page
      navigate('/orders');
    }
    
    // Clean up when component unmounts
    return () => {
      dispatch(clearVerificationData());
    };
  }, [dispatch, location, navigate]);
  
  const handleViewOrders = () => {
    navigate('/orders');
  };
  
  const handleContinueShopping = () => {
    navigate('/products');
  };
  
  if (verificationLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="mt-4 text-lg font-medium text-gray-900">Verifying your payment...</h2>
          <p className="mt-2 text-sm text-gray-500">
            Please wait while we verify your payment.
          </p>
        </div>
      </div>
    );
  }
  
  if (verificationError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <div className="text-center">
          <XCircleIcon className="mx-auto h-12 w-12 text-red-600" />
          <h2 className="mt-4 text-lg font-medium text-gray-900">Payment Verification Failed</h2>
          <p className="mt-2 text-sm text-gray-500">
            {verificationError}
          </p>
          <div className="mt-6 flex justify-center space-x-4">
            <button
              onClick={handleViewOrders}
              className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              View Orders
            </button>
            <button
              onClick={handleContinueShopping}
              className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!verificationSuccess || !currentOrder) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Order Not Found</h2>
          <p className="mt-4 text-gray-500">
            We couldn't find your order. Please check your order history or contact support.
          </p>
          <button
            onClick={handleViewOrders}
            className="mt-6 inline-block rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            View Orders
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
      <div className="text-center">
        <CheckCircleIcon className="mx-auto h-12 w-12 text-green-600" />
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">Payment Successful!</h1>
        <p className="mt-2 text-base text-gray-500">
          Your payment has been verified successfully. Your order is now being processed.
        </p>
      </div>

      <div className="mt-16">
        <h2 className="text-lg font-medium text-gray-900">Order Details</h2>
        <div className="mt-4 border-t border-gray-200">
          <dl className="divide-y divide-gray-200">
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Order Number</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{currentOrder._id}</dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Order Date</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{formatDate(currentOrder.createdAt)}</dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  currentOrder.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                  currentOrder.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                  currentOrder.status === 'Paid' ? 'bg-green-100 text-green-800' :
                  currentOrder.status === 'Shipped' ? 'bg-purple-100 text-purple-800' :
                  currentOrder.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                  currentOrder.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                  currentOrder.status === 'Refunded' ? 'bg-gray-100 text-gray-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {currentOrder.status}
                </span>
              </dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Payment Reference</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{reference}</dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">GHS {currentOrder.totalPrice}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-16">
        <h2 className="text-lg font-medium text-gray-900">Shipping Address</h2>
        <div className="mt-4 border-t border-gray-200">
          <dl className="divide-y divide-gray-200">
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Street</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{currentOrder.shippingAddress?.street}</dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">City</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{currentOrder.shippingAddress?.city}</dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">State</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{currentOrder.shippingAddress?.state}</dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{currentOrder.shippingAddress?.phone}</dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{currentOrder.shippingAddress?.email}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-16">
        <h2 className="text-lg font-medium text-gray-900">Order Items</h2>
        <div className="mt-4 border-t border-gray-200">
          <ul role="list" className="divide-y divide-gray-200">
            {currentOrder.products?.map((item) => (
              <li key={item._id || item.product} className="flex py-6">
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
                      <p className="ml-4">GHS {item.price * item.quantity}</p>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Quantity: {item.quantity}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-16 flex justify-center space-x-4">
        <button
          onClick={handleViewOrders}
          className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          View All Orders
        </button>
        <button
          onClick={handleContinueShopping}
          className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
} 