import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchCart, updateCartItem, removeFromCart } from '../features/cart/cartSlice';
import { TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { logCartItem, findCartItemById, isValidItemId } from '../utils/cartDebug';

export default function Cart() {
  const dispatch = useDispatch();
  const { items = [], loading, total = 0, error } = useSelector((state) => state.cart);

  useEffect(() => {
    console.log('Cart component mounted, fetching cart data...');
    const loadCart = async () => {
      try {
        const result = await dispatch(fetchCart()).unwrap();
        console.log('Cart data loaded:', result);
      } catch (err) {
        console.error('Failed to load cart:', err);
        toast.error(err.message || 'Failed to load cart');
      }
    };
    
    loadCart();
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleUpdateQuantity = async (item, newQuantity) => {
    try {
      // Validate newQuantity
      if (!newQuantity || newQuantity < 1) {
        console.error('handleUpdateQuantity - Invalid quantity:', newQuantity);
        toast.error('Invalid quantity');
        return;
      }
      
      // Get the item ID
      const itemId = item._id || item.id || item.product?._id;
      
      // Validate itemId
      if (!itemId) {
        console.error('handleUpdateQuantity - No valid item ID found:', item);
        toast.error('Could not update item: Invalid item ID');
        return;
      }
      
      console.log('handleUpdateQuantity - Updating item:', { itemId, newQuantity });
      await dispatch(updateCartItem({ itemId, quantity: newQuantity })).unwrap();
      toast.success('Cart updated successfully');
    } catch (error) {
      console.error('handleUpdateQuantity - Error:', error);
      
      // Handle specific error messages
      if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Failed to update cart item');
      }
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      // Add confirmation dialog
      if (!window.confirm('Are you sure you want to remove this item from your cart?')) {
        return;
      }
      
      // Log the item structure to debug
      console.log('Item to remove:', itemId);
      console.log('Cart items structure:', items);
      
      // Validate the item ID
      if (!isValidItemId(itemId)) {
        console.error('Cannot remove item: Invalid item ID');
        toast.error('Cannot remove item: Invalid item ID');
        return;
      }
      
      // Find the item in the cart to verify its structure
      const itemToRemove = findCartItemById(items, itemId);
      
      if (!itemToRemove) {
        console.error('Cannot find item with ID:', itemId);
        toast.error('Cannot find item in cart');
        return;
      }
      
      // Log detailed information about the item
      logCartItem(itemToRemove, 'Removing');
      
      // Convert itemId to string to ensure consistent handling
      const itemIdString = String(itemId);
      console.log('Using string itemId for removal:', itemIdString);
      
      try {
        await dispatch(removeFromCart(itemIdString)).unwrap();
        toast.success('Item removed from cart');
      } catch (err) {
        console.error('Error removing item:', err);
        
        // Handle specific error messages
        if (err.message && err.message.includes('invalid data structure')) {
          toast.error('Server error: Invalid data structure. Please try again.');
        } else if (err.message && err.message.includes('not found')) {
          toast.error('Item not found in cart. It may have been already removed.');
        } else {
          toast.error(err.message || 'Failed to remove item');
        }
      }
    } catch (err) {
      console.error('Error in handleRemoveItem:', err);
      toast.error('An unexpected error occurred. Please try again.');
    }
  };

  // Handle the case where category is an object
  const getCategoryName = (category) => {
    if (!category) return 'Uncategorized';
    if (typeof category === 'string') return category;
    if (typeof category === 'object' && category.name) return category.name;
    return 'Uncategorized';
  };

  const isOutOfStock = (item) => {
    // Check if the product exists and has stock information
    if (!item.product) return true;
    
    // Check if stockStatus is explicitly "Out of Stock"
    if (item.product.stockStatus === "Out of Stock") return true;
    
    // Check if quantity is 0 or less
    if (item.product.quantity <= 0) return true;
    
    // If we get here, the item is in stock
    return false;
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="flex gap-4">
              <div className="h-24 w-24 bg-gray-200 rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  console.log('Cart items:', items);
  console.log('Cart total:', total);

  if (!items || items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Your cart is empty</h2>
          <p className="mt-4 text-gray-500">
            Looks like you haven't added any items to your cart yet.
          </p>
          <Link
            to="/products"
            className="mt-6 inline-block rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Shopping Cart</h1>

      <div className="mt-8">
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
                      <h3>
                        <Link to={`/products/${item.product?._id}`}>{item.product?.productName}</Link>
                      </h3>
                      <p className="ml-4">GHS {item.product?.price * item.quantity}</p>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{getCategoryName(item.product?.category)}</p>
                    <p className="mt-1 text-sm">
                      <span className={`font-medium ${isOutOfStock(item) ? 'text-red-600' : 'text-green-600'}`}>
                        {isOutOfStock(item) ? 'Out of Stock' : 'In Stock'}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-1 items-end justify-between text-sm">
                    <div className="flex items-center">
                      <label htmlFor={`quantity-${item._id}`} className="sr-only">
                        Quantity
                      </label>
                      <select
                        id={`quantity-${item._id}`}
                        value={item.quantity}
                        onChange={(e) => handleUpdateQuantity(item, parseInt(e.target.value))}
                        className="rounded-md border-0 py-1.5 text-left text-base font-medium leading-5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
                      >
                        {[...Array(10)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex">
                      <button
                        type="button"
                        onClick={() => {
                          // Log the item structure before removing
                          logCartItem(item, 'Item to remove');
                          
                          // Try different possible ID properties
                          const itemId = item._id || item.id || item.product?._id;
                          
                          if (!isValidItemId(itemId)) {
                            console.error('Cannot find valid ID for item:', item);
                            toast.error('Cannot remove item: Invalid item ID');
                            return;
                          }
                          
                          console.log('Using itemId for removal:', itemId);
                          handleRemoveItem(itemId);
                        }}
                        className="font-medium text-blue-600 hover:text-blue-500"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex justify-between text-base font-medium text-gray-900">
          <p>Subtotal</p>
          <p>GHS {total}</p>
        </div>
        <p className="mt-0.5 text-sm text-gray-500">Shipping and taxes calculated at checkout.</p>
        <div className="mt-6">
          <Link
            to="/checkout"
            className="flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700"
          >
            Checkout
          </Link>
        </div>
        <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
          <p>
            or{' '}
            <Link to="/products" className="font-medium text-blue-600 hover:text-blue-500">
              Continue Shopping
              <span aria-hidden="true"> &rarr;</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}