import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../features/orders/ordersSlice';
import { clearCart } from '../features/cart/cartSlice';
import toast from 'react-hot-toast';

export default function Checkout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, total } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    street: '',
    city: '',
    state: '',
    phone: '',
    email: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [isAuthenticated, items.length, navigate]);

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = [
      'street',
      'city',
      'state',
      'phone',
      'email',
    ];

    requiredFields.forEach((field) => {
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
      }
    });

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (formData.phone && !/^\d{10,15}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone number must be 10-15 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const orderData = {
          items: items.map((item) => ({
            productId: item.product?._id,
            quantity: item.quantity,
          })),
          shippingAddress: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            phone: formData.phone,
            email: formData.email,
          },
          total,
        };

        await dispatch(createOrder(orderData)).unwrap();
        dispatch(clearCart());
        toast.success('Order placed successfully!');
        navigate('/orders');
      } catch (err) {
        toast.error(err.message || 'Failed to place order');
      }
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
      <div className="lg:grid lg:grid-cols-2 lg:gap-x-8">
        {/* Order summary */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-medium text-gray-900">Order summary</h2>
          <div className="mt-4">
            <div className="flow-root">
              <ul role="list" className="-my-6 divide-y divide-gray-200">
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
                        <p className="mt-1 text-sm text-gray-500">Qty {item.quantity}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-base font-medium text-gray-900">
              <p>Subtotal</p>
              <p>GHS {total}</p>
            </div>
            <p className="mt-0.5 text-sm text-gray-500">Shipping and taxes calculated at checkout.</p>
          </div>
        </div>

        {/* Checkout form */}
        <div className="mt-10 lg:col-span-1 lg:mt-0">
          <h2 className="text-lg font-medium text-gray-900">Shipping information</h2>
          <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="street" className="block text-sm font-medium text-gray-700">
                Street address
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="street"
                  id="street"
                  value={formData.street}
                  onChange={handleChange}
                  className={`input-primary ${errors.street ? 'ring-red-500' : ''}`}
                />
                {errors.street && <p className="mt-1 text-sm text-red-600">{errors.street}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                City
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="city"
                  id="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={`input-primary ${errors.city ? 'ring-red-500' : ''}`}
                />
                {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                State
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="state"
                  id="state"
                  value={formData.state}
                  onChange={handleChange}
                  className={`input-primary ${errors.state ? 'ring-red-500' : ''}`}
                />
                {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone number
              </label>
              <div className="mt-1">
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`input-primary ${errors.phone ? 'ring-red-500' : ''}`}
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`input-primary ${errors.email ? 'ring-red-500' : ''}`}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Place order
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 