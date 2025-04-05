import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchOrders } from '../features/orders/ordersSlice';

export default function Orders() {
  const dispatch = useDispatch();
  const { orders, loading, error } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="mt-2 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Error loading orders</h2>
          <p className="mt-4 text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">No orders yet</h2>
          <p className="mt-4 text-gray-500">
            When you make a purchase, your orders will appear here.
          </p>
          <div className="mt-6">
            <Link
              to="/products"
              className="btn-primary inline-flex items-center justify-center"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Order History</h1>
      <div className="mt-8 space-y-8">
        {orders.map((order) => (
          <div key={order.id} className="border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Order #{order.id}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Placed on {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-medium text-gray-900">GHS {order.total}</p>
                <p className="mt-1 text-sm text-gray-500">{order.status}</p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">Items</h3>
              <ul role="list" className="mt-4 divide-y divide-gray-200">
                {order.items.map((item) => (
                  <li key={item.id} className="flex py-4">
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>

                    <div className="ml-4 flex flex-1 flex-col">
                      <div>
                        <div className="flex justify-between text-base font-medium text-gray-900">
                          <h4>{item.product.name}</h4>
                          <p className="ml-4">GHS {item.product.price * item.quantity}</p>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">Qty {item.quantity}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">Shipping Address</h3>
              <div className="mt-2 text-sm text-gray-500">
                <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                <p>{order.shippingAddress.address}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                </p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 