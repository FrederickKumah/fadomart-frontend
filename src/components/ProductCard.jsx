import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../features/cart/cartSlice';
import { StarIcon } from '@heroicons/react/20/solid';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to add items to your cart');
      return;
    }

    setIsAdding(true);
    try {
      console.log('Adding to cart:', { productId: product._id, quantity: 1 });
      await dispatch(addToCart({ productId: product._id, quantity: 1 })).unwrap();
      toast.success('Product added to cart successfully');
    } catch (err) {
      console.error('Error adding to cart:', err);
      toast.error(err.message || 'Failed to add product to cart');
    } finally {
      setIsAdding(false);
    }
  };

  // Handle the case where category is an object
  const getCategoryName = (category) => {
    if (!category) return 'Uncategorized';
    if (typeof category === 'string') return category;
    if (typeof category === 'object' && category.name) return category.name;
    return 'Uncategorized';
  };

  const isOutOfStock = (product) => {
    // Check if the product exists and has stock information
    if (!product) return true;
    
    // Check if stockStatus is explicitly "Out of Stock"
    if (product.stockStatus === "Out of Stock") return true;
    
    // Check if quantity is 0 or less
    if (product.quantity <= 0) return true;
    
    // If we get here, the item is in stock
    return false;
  };

  return (
    <div className="group relative">
      <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-md bg-gray-200 lg:aspect-none group-hover:opacity-75 lg:h-80">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover object-center lg:h-full lg:w-full"
        />
      </div>
      <div className="mt-4 flex justify-between">
        <div>
          <h3 className="text-sm text-gray-700">
            <Link to={`/products/${product._id || product.id}`}>
              <span aria-hidden="true" className="absolute inset-0" />
              {product.name}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-gray-500">{getCategoryName(product.category)}</p>
        </div>
        <p className="text-sm font-medium text-gray-900">GHS {product.price}</p>
      </div>
      <div className="mt-2 flex items-center">
        <div className="flex items-center">
          {[0, 1, 2, 3, 4].map((rating) => (
            <StarIcon
              key={rating}
              className={`h-4 w-4 flex-shrink-0 ${
                product.rating > rating ? 'text-yellow-400' : 'text-gray-200'
              }`}
              aria-hidden="true"
            />
          ))}
        </div>
        <p className="ml-2 text-xs text-gray-500">
          {product.numReviews} {product.numReviews === 1 ? 'review' : 'reviews'}
        </p>
      </div>
      <div className="mt-1">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isOutOfStock(product) ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {isOutOfStock(product) ? 'Out of Stock' : 'In Stock'}
        </span>
      </div>
      <div className="mt-4">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isAdding}
          className="flex w-full items-center justify-center rounded-md border border-transparent bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isAdding ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Adding...
            </span>
          ) : (
            <span className="flex items-center">
              <ShoppingCartIcon className="h-4 w-4 mr-1" />
              Add to cart
            </span>
          )}
        </button>
      </div>
    </div>
  );
} 